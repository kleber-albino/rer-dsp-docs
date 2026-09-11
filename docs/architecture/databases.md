# Bancos de dados — contrato de papéis

Contrato dos papéis de datasource no fluxo de migração, geração de arquivos e consumo do DSP. Há **dois bancos Postgres** no Compose; metadados Spring Batch ficam em **schemas separados** dentro do `dsp-db` (`data_migration` para migração + watermark; `geo_file_generation` para o job geo-file).

## Sumário

- [Visão geral](#visao-geral)
- [Papéis de datasource](#papeis-de-datasource)
- [Colunas geo por banco](#colunas-geo-por-banco)
- [Quem lê e quem escreve](#quem-le-e-quem-escreve)
- [Dual-write do job](#dual-write-do-job)
- [SRID via YAML](#srid-via-yaml)
- [Prefixos de configuração](#prefixos-de-configuracao)

---

## Visão geral

A geometria completa fica isolada no banco dos **GeoServers** (`dsp-geoserver-db`). O banco **operacional** (`dsp-db`) guarda atributos de negócio e representações leves (`boundary_box`, `centroid_coordinates`) para consultas da API — sem polígonos completos.

Dois GeoServers leem esse mesmo geoserver-db: **Exhibition** (mapa) e **Download** (WFS de exportação via backend).

```mermaid
flowchart LR
  src[(source<br/>origem externa)]
  job[dsp-batch]
  dsp[(dsp-db<br/>operacional + data_migration)]
  ex[(dsp-geoserver-db<br/>geometria completa)]
  api[backend]
  gsEx[GeoServer Exhibition]
  gsDl[GeoServer Download]

  src -->|read| job
  job -->|geom| ex
  job -->|BATCH_* + watermark| dsp
  api -->|read| dsp
  api -->|WFS downloads| gsDl
  gsEx -->|read| ex
  gsDl -->|read| ex
```

---

## Papéis de datasource

São papéis de **conexão**, não containers Postgres extras. No core há dois serviços (`dsp-db` e `dsp-geoserver-db`). O job de migração mantém **quatro DataSources** no Java (`source`, `target`, `geo-target`, `batch`); `batch` e `target` apontam para o mesmo `dsp-db`, com pools separados.

| Papel | Onde (fluxo orquestrado pelo core) | Para que serve |
|-------|-------------------------------------|----------------|
| **source** | Banco do adotante, fora do Compose (`spring.datasource.source`) | Origem da migração — só leitura |
| **dsp-db** | Serviço `dsp-db`, schema `dsp` (`spring.datasource.target`) | Dados de negócio, `boundary_box` e `centroid_coordinates`. Sem `geom` completa. É o que o backend consulta |
| **geoserver-db** | Serviço `dsp-geoserver-db`, schema `dsp` (`spring.datasource.geo-target`) | Mesmas entidades com coluna `geom` completa. É o que os GeoServers leem |
| **batch** (migração) | Schema `data_migration` no `dsp-db` (`spring.datasource.batch` do job de migração) | Metadados Spring Batch da migração: `BATCH_*` e `BATCH_JOB_EXECUTION_SYNC_STATE` (watermark). URL com `currentSchema=data_migration` |
| **batch** (geo-file) | Schema `geo_file_generation` no `dsp-db` (job geo-file) | Metadados Spring Batch do job geo-file: `BATCH_*` (sem watermark). Isolado da migração |

`dsp-db` e `geoserver-db` repetem as tabelas lógicas (`territory_level_1`, `territory_level_2`, `territory_level_3`, `area_of_interest`). IDs e FKs são `VARCHAR` (`territory_level_*`: `varchar(64)`; AOI/camadas: `varchar(255)` no `id`). A diferença geo está na seção seguinte.

---

## Colunas geo por banco

| Coluna | Tipo PostGIS | dsp-db | geoserver-db |
|--------|--------------|--------|---------------|
| Atributos de negócio (`id`, `name`, FKs, etc.) | — | sim | sim |
| `created_at` / `updated_at` | `timestamptz` | sim | sim |
| `geom` | `geometry` (UA: `MultiPolygon` no DDL do core; AOI/camadas: tipo da origem) | **não** | **sim** |
| `boundary_box` | `geometry(Polygon)` | **sim** | **não** |
| `centroid_coordinates` | `geometry(Point)` | **sim** | **não** |

O writer do job deriva `boundary_box` e `centroid_coordinates` a partir da geometria lida na origem e grava só em `dsp-db`. O `geoserver-db` recebe a geometria completa em `geom`.

`created_at` é obrigatório no destino (watermark). `updated_at` existe nas tabelas oficiais e é preenchido quando o YAML declara `updated-at-column`.

---

## Quem lê e quem escreve

| Componente | source | dsp-db | geoserver-db | batch |
|------------|--------|--------|---------------|-------|
| `rer-dsp-job-data-migration` | leitura | escrita (bbox/centroid) | escrita (`geom`) | escrita (`BATCH_*` + watermark) |
| `rer-dsp-backend` / `rer-dsp-core` | — | leitura/escrita de negócio (schema `dsp`) | — | — |
| GeoServer Exhibition | — | — | leitura (WMS/WFS mapa) | — |
| GeoServer Download | — | — | leitura (WFS downloads via backend) | — |

Os dois GeoServers apontam **somente** para `dsp-geoserver-db` (mesmo PostGIS; processos isolados).

---

## Dual-write do job

Cada execução do job faz **1 source → 2 targets** (camadas genéricas: só geo-target):

1. Lê origem (atributos + geometria), recortada pelo watermark e pelo `where-clause`.
2. Grava em `dsp-db`: atributos + `boundary_box` + `centroid_coordinates`.
3. Grava em `geoserver-db`: atributos + `geom` completa.

```mermaid
flowchart LR
  src[(Fonte JDBC<br/>do adotante)] -->|1. Lê atributos + geometria| job[dsp-batch]

  subgraph write ["2. Dual-write — UPSERT ON CONFLICT"]
    job -->|"atributos + boundary_box<br/>+ centroid_coordinates"| dspdb[(dsp-db)]
    job -->|"atributos + geom<br/>completa"| exdb[(geoserver-db)]
  end
```

Detalhe do watermark: [Visão geral do job](../modules/job-data-migration/overview.md#sincronizacao-incremental-watermark).

---

## SRID via YAML

O SRID **não** é fixado em código. No DDL oficial das unidades administrativas do core, `geom` não leva typmod de SRID. O DDL automático de AOI/camadas pode gravar o SRID no `CREATE TABLE`.

| Onde | Como |
|------|------|
| DDL das UA (core) | `geom` sem typmod de SRID |
| Job | Cada bloco informa `srid` no YAML (ex.: `4674`, `4326`) |
| Leitura (UA, AOI e camadas) | `ST_Transform` para o `srid` do YAML antes do GeoJSON |
| Escrita | `ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON(?)), srid)` |
| Validação | Conferir `ST_SRID(...)` contra o `srid` do YAML correspondente |

Instalações distintas podem usar SRIDs diferentes por camada, desde que o YAML e a origem estejam alinhados.

---

## Prefixos de configuração

| Papel | Prefixo Spring | Exemplo Compose (core) |
|-------|----------------|------------------------|
| source | `spring.datasource.source` | — (externo; `DSP_SOURCE_JDBC_URL`, `DSP_SOURCE_DB_USER`, `DSP_SOURCE_DB_PASSWORD`) |
| dsp-db (target) | `spring.datasource.target` | `dsp-db` |
| geoserver-db (geo-target) | `spring.datasource.geo-target` | `dsp-geoserver-db` |
| batch (migração) | `spring.datasource.batch` | `dsp-db`, schema `data_migration` |
| batch (geo-file) | `spring.datasource.batch` | `dsp-db`, schema `geo_file_generation` |

Detalhe operacional: [Job data-migration — Configuração e execução](../modules/job-data-migration/configuration.md) · validação: [Validação pós-migração](../modules/job-data-migration/validation.md) · orquestração dos bancos: [rer-dsp-core](../modules/core.md).
