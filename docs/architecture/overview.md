# Arquitetura do RER DSP

Visão da arquitetura multi-camada e multi-repositório da **Data Sharing Platform (DSP)** no ecossistema **RER**.

## Sumário

- [Contexto](#contexto)
- [Diagrama de componentes](#diagrama-de-componentes)
- [Princípios](#principios)
- [Visão de contexto](#visao-de-contexto)
- [Camadas e responsabilidades](#camadas-e-responsabilidades)
- [Fluxo de dados](#fluxo-de-dados)
- [Bancos de dados](#bancos-de-dados)
- [Jobs](#jobs)
- [Relação com o onboarding](#relacao-com-o-onboarding)

---

## Contexto

O DSP não é um único monólito. Ele combina:

- **Aplicações** (frontend, backend, core)
- **Jobs** (migração de dados, geração de arquivos geo)
- **Infraestrutura de dados** (PostgreSQL/PostGIS, File Bucket, GeoServer)

O objetivo é **compartilhar dados ambientais rurais** de forma confiável, com base geoespacial sincronizada a partir de fontes legadas ou de outros módulos do RER.

---

## Diagrama de componentes

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

---

## Princípios

| Princípio | Descrição |
|-----------|-----------|
| Separação por repositório | Cada capacidade evolui e versiona de forma independente |
| Source of truth documentada | Esta wiki (`rer-dsp-docs`) é a referência transversal |
| Migração primeiro | A base geoespacial no destino vem do job de migração |
| Configuração externa | Mapeamentos de tabela/coluna ficam no YAML, não hardcoded |

---

## Visão de contexto

```mermaid
flowchart TB
  user[Usuário institucional]
  dev[Desenvolvedor DSP]
  legado[Sistemas / bancos legados]
  parceiros[Instituições parceiras]

  subgraph rer ["Ecossistema RER"]
    reg[RER Registration — cadastro DPG]
    dsp[RER DSP — Data Sharing Platform]
  end

  user -->|UI / APIs| dsp
  dev -->|jobs e deploys| dsp
  reg -->|dados ambientais| dsp
  legado -->|migração ETL| dsp
  dsp -->|compartilha dados e layers| parceiros
```

---

## Camadas e responsabilidades

| Camada | Componentes | Responsabilidade |
|--------|-------------|------------------|
| Apresentação | [rer-dsp-frontend](https://github.com/Rural-Environmental-Registry/rer-dsp-frontend) | Interface web para consulta e compartilhamento |
| API | [rer-dsp-backend](https://github.com/Rural-Environmental-Registry/rer-dsp-backend) | Contratos REST, autenticação de acesso à plataforma |
| Domínio | [rer-dsp-core](https://github.com/Rural-Environmental-Registry/rer-dsp-core) | Regras de negócio lógica de domínio, modelos de dados, regras de negócio e utilitários compartilhados entre os demais componentes. |
| Integração / ETL | [rer-dsp-job-data-migration](https://github.com/Rural-Environmental-Registry/rer-dsp-job-data-migration) | Sync geoespacial source → target, ou seja faz a migração dos dados de um banco para outro. |
| Geração geo | [rer-dsp-job-geo-file-generation](https://github.com/Rural-Environmental-Registry/rer-dsp-job-geo-file-generation) | Produção de arquivos geoespaciais mais pesados para download rápido evitando sobrecarregar o geoserver. |
| Publicação geo | Instâncias GeoServer | Layers WMS/WFS e cache. São 2 GeoServer, um para exibição no frontend e um para download das geometrias. |
| Persistência | PostgreSQL / PostGIS | Dados operacionais e geometrias |
| Objetos | File Bucket | Arquivos gerados pelo [rer-dsp-job-geo-file-generation](https://github.com/Rural-Environmental-Registry/rer-dsp-job-geo-file-generation) |
| Documentação | [rer-dsp-docs](https://github.com/Rural-Environmental-Registry/rer-dsp-docs) (esta wiki) | Onboarding e padrões transversais de todos os repositórios |

## Fluxo de dados

```mermaid
flowchart LR
  A[(Origem)] -->|1. Detecta mudanças| B[dsp-batch]
  B -->|2. UPSERT / DELETE| C[(Destino PostGIS)]
  B -->|3. Metadados| D[(batch_metadata)]
  C -->|4. Publica| E[GeoServer]
  C -->|5. Consome| F[core / backend / frontend]
  G[job-geo-file-generation]-->|arquivos| H[(File Bucket)] 
```

1. **Ingestão / sync** — job de migração atualiza o destino
2. **Publicação** — GeoServer expõe layers a partir do destino
3. **Consumo** — core/backend/frontend e parceiros leem a base DSP
4. **Arquivos** — `job-geo-file-generation` cria os arquivos mais pesados e salva File Bucket.

---

## Bancos de dados

No fluxo do job de migração existem **três** papéis de datasource:

| Papel | Prefixo de config | Conteúdo típico |
|-------|-------------------|-----------------|
| Origem | `spring.datasource.source` | Dados legados / cadastro a migrar |
| Destino | `spring.datasource.target` | Base PostGIS do DSP |
| Metadados | `spring.datasource.batch` | Controle Spring Batch (`BATCH_*`) |


## Jobs

| Job / repositório | Entrada | Saída | Quando usar |
|-------------------|---------|-------|-------------|
| `rer-dsp-job-data-migration` | DB source | DB target + metadados | **Onboarding e sync contínuo da base geo** |
| `rer-dsp-job-geo-file-generation` | DB / arquivos | Arquivos em File Bucket ou filesystem | Geração de pacotes geo |

Detalhe operacional do primeiro: [Migração — visão geral](../migration/overview.md) e [Job data-migration](../migration/rer-dsp-job-data-migration.md).

---

## Relação com o onboarding

```mermaid
flowchart TD
  wiki[Ler wiki DSP] --> gs[getting-started]
  gs --> mig[Executar rer-dsp-job-data-migration]
  mig --> val[Validar destino]
  val --> arch[Aprofundar arquitetura]
  arch --> other[Frontend / backend / GeoServer / File Bucket]
```