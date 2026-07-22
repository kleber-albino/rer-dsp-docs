# RER DSP — Documentação

Portal de documentação da **Data Sharing Platform (DSP)** do ecossistema **RER** (*Rural Environmental Registry*).

## Sumário

- [Visão geral](#visao-geral)
- [Arquitetura](#arquitetura)
- [Jornada de onboarding](#jornada-de-onboarding)
- [Fluxo de migração](#fluxo-de-migracao)
- [Mapa da documentação](#mapa-da-documentacao)
- [Componentes do DSP](#componentes-do-dsp)

---

## Visão geral

O **RER** (*Rural Environmental Registry*) é uma solução para gerenciar informações ambientais geoespaciais declaradas em propriedades rurais — bem público digital ([DPG](https://www.digitalpublicgoods.net/r/rural-environmental-registry-registration-module)). Serve como base para controle, monitoramento e planejamento ambiental e econômico.

O **DSP** (*Data Sharing Platform*) é a plataforma de **compartilhamento, visualização e acesso** a esses dados ambientais entre instituições parceiras. Ele combina APIs, frontend, domínio (`core`), bancos PostgreSQL/PostGIS, GeoServer, file buckets e **jobs de migração de dados**.

| Conceito | Papel |
|----------|--------|
| **Rural Environmental Registry (RER)** | Cadastro ambiental (DPG): coleta e mantém as declarações geoespaciais das propriedades rurais |
| **Data Sharing Platform (DSP)** | Plataforma de compartilhamento: sincroniza, publica e expõe esses dados para parceiros e aplicações |

!!! tip "Por onde começar"
    A primeira atividade de onboarding é popular o banco de destino com o job [`rer-dsp-job-data-migration`](migration/rer-dsp-job-data-migration.md). Sem essa base, as demais camadas do DSP não têm dados geoespaciais.

---

## Arquitetura

```mermaid
flowchart LR
  legGw["Gateway"]
  legApp["Aplicações"]
  legGeo["Geoespacial"]
  legDb["Persistência"]
  legJob["Jobs"]
  legCore["Core"]

  legGw ~~~ legApp ~~~ legGeo ~~~ legDb ~~~ legJob ~~~ legCore

  classDef gw fill:#1e3a5f22,color:#1e3a5f,stroke:#1e3a5f,stroke-width:2px
  classDef app fill:#0f766e22,color:#115e59,stroke:#0f766e,stroke-width:2px
  classDef geoCls fill:#16653422,color:#14532d,stroke:#166534,stroke-width:2px
  classDef db fill:#b4530922,color:#92400e,stroke:#b45309,stroke-width:2px
  classDef job fill:#7c2d1222,color:#7c2d12,stroke:#9a3412,stroke-width:2px
  classDef coreCls fill:#312e8122,color:#312e81,stroke:#4338ca,stroke-width:2px

  class legGw gw
  class legApp app
  class legGeo geoCls
  class legDb db
  class legJob job
  class legCore coreCls
```

```mermaid
flowchart LR
  srcDb[("SEU DATABASE<br/>Banco da sua organização que você quer migrar os dados.<br/>Fonte a migrar para o DSP.")]
  jobMig["JOB-DB-MIGRATION<br/>ETL Spring Batch.<br/>Sincroniza origem (SEU DATABASE) → DSP DB."]
  core["CORE<br/>SETUP · CONFIG · START.<br/>Prepara bancos e dispara migração."]
  jobGeo["JOB-GEO-FILE<br/>Gera arquivos geoespaciais.<br/>Lê DSP DB e grava no bucket."]

  dspDb[("DSP DB<br/>Banco operacional PostGIS.<br/>Dados consumidos pela API.")]
  gsDb[("GEOSERVER DB<br/>Base das layers geoespaciais.<br/>Alimenta Exhibition e Download.")]
  bucket[("FILE-BUCKET<br/>Armazena arquivos e artefatos.<br/>Exports, pacotes e anexos.")]

  be["DSP BACKEND<br/>API REST e regras de negócio.<br/>Autenticação e orquestração."]
  fe["DSP FRONTEND<br/>Interface web da plataforma.<br/>Consulta, mapas e compartilhamento."]

  gsEx["GEOSERVER-EXIBITION<br/>Publica layers para visualização.<br/>Serviços WMS/WFS na tela."]
  gsDl["GEOSERVER-DOWNLOAD<br/>Entrega dados geo para download.<br/>Exportação de camadas."]

  nginx["NGINX<br/>Ponto de entrada HTTP.<br/>Reverse proxy para apps e GeoServers."]

  srcDb --- jobMig
  jobMig --- dspDb
  core --- jobMig
  core --- dspDb
  core --- gsDb
  dspDb --- jobGeo
  jobGeo --- bucket

  be --- dspDb
  gsEx --- gsDb
  gsDl --- gsDb
  gsEx --- be
  gsEx --- gsDl

  fe --- be
  fe --- bucket
  fe --- gsEx
  fe --- gsDl

  nginx --- fe
  nginx --- be
  nginx --- gsEx
  nginx --- gsDl
  nginx --- bucket

  classDef gw fill:#1e3a5f22,color:#1e3a5f,stroke:#1e3a5f,stroke-width:2px
  classDef app fill:#0f766e22,color:#115e59,stroke:#0f766e,stroke-width:2px
  classDef geoCls fill:#16653422,color:#14532d,stroke:#166534,stroke-width:2px
  classDef db fill:#b4530922,color:#92400e,stroke:#b45309,stroke-width:2px
  classDef job fill:#7c2d1222,color:#7c2d12,stroke:#9a3412,stroke-width:2px
  classDef coreCls fill:#312e8122,color:#312e81,stroke:#4338ca,stroke-width:2px

  class nginx gw
  class fe,be app
  class gsEx,gsDl geoCls
  class dspDb,gsDb,srcDb,bucket db
  class jobMig,jobGeo job
  class core coreCls
```

| Componente | Responsabilidade | Repositório |
|------------|------------------|-------------|
| **NGINX** | Gateway / reverse proxy de entrada | — |
| **DSP Frontend** | Interface web (Platform Services) | [rer-dsp-frontend](https://github.com/Rural-Environmental-Registry/rer-dsp-frontend) |
| **DSP Backend** | API e lógica de negócio | [rer-dsp-backend](https://github.com/Rural-Environmental-Registry/rer-dsp-backend) |
| **DSP DB** | Banco operacional da plataforma | — |
| **GEOSERVER DB** | Banco das layers geoespaciais | — |
| **GEOSERVER-EXIBITION** | Publicação / exibição de maps (WMS/WFS) | — |
| **GEOSERVER-DOWNLOAD** | Download de dados geoespaciais | — |
| **JOB-DB-MIGRATION** | ETL: migra dados da origem (`SEU DATABASE`) → DSP DB | [rer-dsp-job-data-migration](https://github.com/Rural-Environmental-Registry/rer-dsp-job-data-migration) |
| **JOB-GEO-FILE** | Gera arquivos geo a partir do DSP DB → FILE-BUCKET | [rer-dsp-job-geo-file-generation](https://github.com/Rural-Environmental-Registry/rer-dsp-job-geo-file-generation) |
| **FILE-BUCKET** | Armazenamento de arquivos e artefatos | — |
| **CORE** | SETUP, CONFIG e START dos bancos e do job de migração | [rer-dsp-core](https://github.com/Rural-Environmental-Registry/rer-dsp-core) |
| **Docs** | Documentação transversal de onboarding e padrões | [rer-dsp-docs](https://github.com/Rural-Environmental-Registry/rer-dsp-docs) |

Detalhes em [Arquitetura](architecture/overview.md).

---

## Jornada de onboarding

| Passo | O que fazer | Onde |
|-------|-------------|------|
| 1 | Entender propósito do DSP e da migração | Esta página |
| 2 | Preparar máquina (Java 21, Maven, Docker) | [Começando](getting-started.md) |
| 3 | Clonar e configurar `rer-dsp-job-data-migration` | [Job de migração](migration/rer-dsp-job-data-migration.md) |
| 4 | Rodar a migração inicial | [Começando](getting-started.md#passo-5-executar-a-migracao-inicial) |
| 5 | Conferir contagens, status do Batch e tabelas | [Validação](migration/validation.md) |

!!! warning "Ordem dos jobs"
    Execute sempre na ordem **level-1 → level-2 → level-3 → rural-property** quando houver dependência de chave estrangeira no destino.

---

## Fluxo de migração

A migração inicial é o coração do onboarding. O banco de **origem** (`source`) é o banco da sua organização (legado, cadastro ou outro módulo) que você pretende trazer para as aplicações RER/DSP. O job Spring Batch:

1. Lê geometrias e atributos do **banco de origem** (`source`)
2. Detecta mudanças em relação ao **destino** (`target` — base PostGIS do DSP)
3. Faz UPSERT (e, na estratégia `DEFAULT`, remove órfãos)
4. Registra a execução em **metadados** (`batch_metadata`)
5. Deixa o destino pronto para consumo por core, backend, frontend e GeoServer

```mermaid
flowchart LR
  org[(Seu banco de dados<br/>source)] -->|1. Lê e detecta mudanças| job[dsp-batch]
  job ---|2. UPSERT / DELETE| tgt[(Destino PostGIS<br/>target)]
  job ---|3. Metadados| meta[(batch_metadata)]
  tgt ---|4. Publica| gs[GeoServer]
  tgt ---|5. Consome| apps[core / backend / frontend]
```

Visão completa: [Migração — visão geral](migration/overview.md).

---

## Mapa da documentação

| Documento | Conteúdo |
|-----------|----------|
| [Começando](getting-started.md) | Passo a passo do primeiro run local |
| [Arquitetura](architecture/overview.md) | Camadas, containers e fluxo de dados |
| [Migração — visão geral](migration/overview.md) | Conceitos, ordem e estratégias |
| [Job data-migration](migration/rer-dsp-job-data-migration.md) | YAML, datasources, comandos e pipeline |
| [Validação](migration/validation.md) | Checklist e queries pós-migração |

---

## Componentes do DSP

| Repositório / componente | Papel |
|--------------------------|--------|
| [rer-dsp-docs](https://github.com/Rural-Environmental-Registry/rer-dsp-docs) | Esta wiki — fonte transversal de onboarding e padrões |
| [rer-dsp-job-data-migration](https://github.com/Rural-Environmental-Registry/rer-dsp-job-data-migration) | ETL geoespacial (Spring Batch / `dsp-batch`) |
| [rer-dsp-job-geo-file-generation](https://github.com/Rural-Environmental-Registry/rer-dsp-job-geo-file-generation) | Geração de arquivos geoespaciais |
| [rer-dsp-core](https://github.com/Rural-Environmental-Registry/rer-dsp-core) | Domínio e serviços compartilhados |
| [rer-dsp-backend](https://github.com/Rural-Environmental-Registry/rer-dsp-backend) | API REST da plataforma |
| [rer-dsp-frontend](https://github.com/Rural-Environmental-Registry/rer-dsp-frontend) | Interface web |
| PostgreSQL / PostGIS | Persistência operacional e geometrias |
| GeoServer | Layers WMS/WFS |
| Buckets S3 | Arquivos, exports e artefatos |
