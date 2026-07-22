# Opções de diagrama (Mermaid)

Compare as 5 versões e diga o número preferido para usar em [Início → Arquitetura](../index.md#arquitetura).

---

## V1 — Flat (sem grupos)

Simples, tudo no mesmo nível.

```mermaid
flowchart TB
  nginx[NGINX]

  fe[DSP Frontend<br/>Platform Services]
  be[DSP Backend<br/>api]
  gsEx[GEOSERVER-EXIBITION]
  gsDl[GEOSERVER-DOWNLOAD]

  dspDb[(Database<br/>DSP DB)]
  gsDb[(Database<br/>GEOSERVER DB)]
  srcDb[(Database*<br/>origem)]
  bucket[(FILE-BUCKET)]

  jobMig[JOB-DB-MIGRATION]
  jobGeo[JOB-GEO-FILE]
  core[CORE<br/>SETUP · CONFIG · START]

  nginx <--> fe
  nginx <--> be
  nginx --> gsEx
  nginx --> gsDl
  fe <--> be
  be --> dspDb
  gsEx --> be
  gsEx --> gsDb
  gsDl --> gsDb
  srcDb --> jobMig
  jobMig --> dspDb
  dspDb --> jobGeo
  jobGeo --> bucket
  core --> dspDb
  core --> gsDb
  core --> jobMig
```

---

## V2 — Por camadas (subgraphs)

Agrupa gateway, apps, geo, dados e jobs.

```mermaid
flowchart TB
  subgraph gateway ["Gateway"]
    nginx[NGINX]
  end

  subgraph apps ["Aplicações"]
    fe[DSP Frontend<br/>Platform Services]
    be[DSP Backend<br/>api]
  end

  subgraph geo ["Geoespacial"]
    gsEx[GEOSERVER-EXIBITION]
    gsDl[GEOSERVER-DOWNLOAD]
  end

  subgraph dados ["Persistência"]
    dspDb[(DSP DB)]
    gsDb[(GEOSERVER DB)]
    srcDb[(Database* origem)]
    bucket[(FILE-BUCKET)]
  end

  subgraph jobs ["Jobs e Core"]
    jobMig[JOB-DB-MIGRATION]
    jobGeo[JOB-GEO-FILE]
    core[CORE<br/>SETUP · CONFIG · START]
  end

  nginx <--> fe
  nginx <--> be
  nginx --> gsEx
  nginx --> gsDl
  fe <--> be
  be --> dspDb
  gsEx --> be
  gsEx --> gsDb
  gsDl --> gsDb
  srcDb --> jobMig
  jobMig --> dspDb
  dspDb --> jobGeo
  jobGeo --> bucket
  core --> dspDb
  core --> gsDb
  core --> jobMig
```

---

## V3 — Fluxo horizontal (LR)

Leitura da esquerda para a direita: entrada → apps → dados → jobs.

```mermaid
flowchart LR
  nginx[NGINX]

  fe[DSP Frontend]
  be[DSP Backend]
  gsEx[GEOSERVER-EXIBITION]
  gsDl[GEOSERVER-DOWNLOAD]

  dspDb[(DSP DB)]
  gsDb[(GEOSERVER DB)]
  srcDb[(Database*)]
  bucket[(FILE-BUCKET)]

  jobMig[JOB-DB-MIGRATION]
  jobGeo[JOB-GEO-FILE]
  core[CORE]

  nginx --> fe
  nginx --> be
  nginx --> gsEx
  nginx --> gsDl
  fe <--> be
  be --> dspDb
  gsEx --> gsDb
  gsDl --> gsDb
  gsEx --> be
  srcDb --> jobMig --> dspDb
  dspDb --> jobGeo --> bucket
  core --> dspDb
  core --> gsDb
  core --> jobMig
```

---

## V4 — Espelhando o draw.io

Layout próximo ao diagrama original: entrada no topo, apps à esquerda, GeoServers à direita, bancos no meio, jobs e CORE embaixo.

```mermaid
flowchart TB
  nginx[NGINX]

  subgraph esquerda ["Plataforma"]
    direction TB
    fe[DSP Frontend<br/>Platform Services]
    be[DSP Backend<br/>api]
    dspDb[(DSP DB)]
  end

  subgraph direita ["Geo"]
    direction TB
    gsEx[GEOSERVER-EXIBITION]
    gsDl[GEOSERVER-DOWNLOAD]
    gsDb[(GEOSERVER DB)]
  end

  srcDb[(Database*)]
  jobMig[JOB-DB-MIGRATION]
  jobGeo[JOB-GEO-FILE]
  bucket[(FILE-BUCKET)]
  core[CORE<br/>SETUP · CONFIG · START]

  nginx --> fe
  nginx --> be
  nginx --> gsEx
  nginx --> gsDl
  fe <--> be
  be --> dspDb
  gsEx --> be
  gsEx --> gsDb
  gsDl --> gsDb
  srcDb --> jobMig
  jobMig --> dspDb
  dspDb --> jobGeo
  jobGeo --> bucket
  core --> dspDb
  core --> gsDb
  core --> jobMig
```

---

## V5 — Com cores (classDef)

Mesmo fluxo da V2, com cores por tipo de componente.

```mermaid
flowchart TB
  subgraph gateway ["Gateway"]
    nginx[NGINX]
  end

  subgraph apps ["Aplicações"]
    fe[DSP Frontend<br/>Platform Services]
    be[DSP Backend<br/>api]
  end

  subgraph geo ["Geoespacial"]
    gsEx[GEOSERVER-EXIBITION]
    gsDl[GEOSERVER-DOWNLOAD]
  end

  subgraph dados ["Persistência"]
    dspDb[(DSP DB)]
    gsDb[(GEOSERVER DB)]
    srcDb[(Database* origem)]
    bucket[(FILE-BUCKET)]
  end

  subgraph jobs ["Jobs e Core"]
    jobMig[JOB-DB-MIGRATION]
    jobGeo[JOB-GEO-FILE]
    core[CORE<br/>SETUP · CONFIG · START]
  end

  nginx <--> fe
  nginx <--> be
  nginx --> gsEx
  nginx --> gsDl
  fe <--> be
  be --> dspDb
  gsEx --> be
  gsEx --> gsDb
  gsDl --> gsDb
  srcDb --> jobMig
  jobMig --> dspDb
  dspDb --> jobGeo
  jobGeo --> bucket
  core --> dspDb
  core --> gsDb
  core --> jobMig

  classDef gw fill:#1e3a5f,color:#fff,stroke:#0f172a
  classDef app fill:#0f766e,color:#fff,stroke:#115e59
  classDef geoCls fill:#166534,color:#fff,stroke:#14532d
  classDef db fill:#b45309,color:#fff,stroke:#92400e
  classDef job fill:#7c2d12,color:#fff,stroke:#431407
  classDef coreCls fill:#312e81,color:#fff,stroke:#1e1b4b

  class nginx gw
  class fe,be app
  class gsEx,gsDl geoCls
  class dspDb,gsDb,srcDb,bucket db
  class jobMig,jobGeo job
  class core coreCls
```

---

## V6 — V5 + mais ligações (só linhas)

Base na V5 com ligações sem seta (`---`). Ligações extras: NGINX — FILE-BUCKET, Frontend — FILE-BUCKET, Frontend — ambos GeoServers, e os dois GeoServers entre si.

```mermaid
flowchart TB
  subgraph gateway ["Gateway"]
    nginx[NGINX]
  end

  subgraph apps ["Aplicações"]
    fe[DSP Frontend<br/>Platform Services]
    be[DSP Backend<br/>api]
  end

  subgraph geo ["Geoespacial"]
    gsEx[GEOSERVER-EXIBITION]
    gsDl[GEOSERVER-DOWNLOAD]
  end

  subgraph dados ["Persistência"]
    dspDb[(DSP DB)]
    gsDb[(GEOSERVER DB)]
    srcDb[(Database* origem)]
    bucket[(FILE-BUCKET)]
  end

  subgraph jobs ["Jobs e Core"]
    jobMig[JOB-DB-MIGRATION]
    jobGeo[JOB-GEO-FILE]
    core[CORE<br/>SETUP · CONFIG · START]
  end

  nginx --- fe
  nginx --- be
  nginx --- gsEx
  nginx --- gsDl
  nginx --- bucket

  fe --- be
  fe --- bucket
  fe --- gsEx
  fe --- gsDl

  be --- dspDb
  gsEx --- be
  gsEx --- gsDb
  gsDl --- gsDb
  gsEx --- gsDl

  srcDb --- jobMig
  jobMig --- dspDb
  dspDb --- jobGeo
  jobGeo --- bucket

  core --- dspDb
  core --- gsDb
  core --- jobMig

  classDef gw fill:#1e3a5f,color:#fff,stroke:#0f172a
  classDef app fill:#0f766e,color:#fff,stroke:#115e59
  classDef geoCls fill:#166534,color:#fff,stroke:#14532d
  classDef db fill:#b45309,color:#fff,stroke:#92400e
  classDef job fill:#7c2d12,color:#fff,stroke:#431407
  classDef coreCls fill:#312e81,color:#fff,stroke:#1e1b4b

  class nginx gw
  class fe,be app
  class gsEx,gsDl geoCls
  class dspDb,gsDb,srcDb,bucket db
  class jobMig,jobGeo job
  class core coreCls
```

---

## V7 — V6 + textos com descrição

Mesmo layout e ligações do V6; cada caixa traz nome e duas linhas explicando o papel.

```mermaid
flowchart TB
  subgraph gateway ["Gateway"]
    nginx["NGINX<br/>Ponto de entrada HTTP.<br/>Reverse proxy para apps e GeoServers."]
  end

  subgraph apps ["Aplicações"]
    fe["DSP Frontend<br/>Interface web da plataforma.<br/>Consulta, mapas e compartilhamento."]
    be["DSP Backend<br/>API REST e regras de negócio.<br/>Autenticação e orquestração."]
  end

  subgraph geo ["Geoespacial"]
    gsEx["GEOSERVER-EXIBITION<br/>Publica layers para visualização.<br/>Serviços WMS/WFS na tela."]
    gsDl["GEOSERVER-DOWNLOAD<br/>Entrega dados geo para download.<br/>Exportação de camadas."]
  end

  subgraph dados ["Persistência"]
    dspDb[("DSP DB<br/>Banco operacional PostGIS.<br/>Dados consumidos pela API.")]
    gsDb[("GEOSERVER DB<br/>Base das layers geoespaciais.<br/>Alimenta Exhibition e Download.")]
    srcDb[("Database* origem<br/>Banco da organização / legado.<br/>Fonte a migrar para o DSP.")]
    bucket[("FILE-BUCKET<br/>Armazena arquivos e artefatos.<br/>Exports, pacotes e anexos.")]
  end

  subgraph jobs ["Jobs e Core"]
    jobMig["JOB-DB-MIGRATION<br/>ETL Spring Batch.<br/>Sincroniza origem → DSP DB."]
    jobGeo["JOB-GEO-FILE<br/>Gera arquivos geoespaciais.<br/>Lê DSP DB e grava no bucket."]
    core["CORE<br/>SETUP · CONFIG · START.<br/>Prepara bancos e dispara migração."]
  end

  nginx --- fe
  nginx --- be
  nginx --- gsEx
  nginx --- gsDl
  nginx --- bucket

  fe --- be
  fe --- bucket
  fe --- gsEx
  fe --- gsDl

  be --- dspDb
  gsEx --- be
  gsEx --- gsDb
  gsDl --- gsDb
  gsEx --- gsDl

  srcDb --- jobMig
  jobMig --- dspDb
  dspDb --- jobGeo
  jobGeo --- bucket

  core --- dspDb
  core --- gsDb
  core --- jobMig

  classDef gw fill:#1e3a5f,color:#fff,stroke:#0f172a
  classDef app fill:#0f766e,color:#fff,stroke:#115e59
  classDef geoCls fill:#166534,color:#fff,stroke:#14532d
  classDef db fill:#b45309,color:#fff,stroke:#92400e
  classDef job fill:#7c2d12,color:#fff,stroke:#431407
  classDef coreCls fill:#312e81,color:#fff,stroke:#1e1b4b

  class nginx gw
  class fe,be app
  class gsEx,gsDl geoCls
  class dspDb,gsDb,srcDb,bucket db
  class jobMig,jobGeo job
  class core coreCls
```

---

## V8 — Mesmos textos, outra ordem (LR)

Leitura da esquerda para a direita. **Só ligações entre itens** (sem ligar seções).

```mermaid
flowchart LR
  srcDb[("Database* origem<br/>Banco da organização / legado.<br/>Fonte a migrar para o DSP.")]
  jobMig["JOB-DB-MIGRATION<br/>ETL Spring Batch.<br/>Sincroniza origem → DSP DB."]
  core["CORE<br/>SETUP · CONFIG · START.<br/>Prepara bancos e dispara migração."]
  jobGeo["JOB-GEO-FILE<br/>Gera arquivos geoespaciais.<br/>Lê DSP DB e grava no bucket."]

  dspDb[("DSP DB<br/>Banco operacional PostGIS.<br/>Dados consumidos pela API.")]
  gsDb[("GEOSERVER DB<br/>Base das layers geoespaciais.<br/>Alimenta Exhibition e Download.")]
  bucket[("FILE-BUCKET<br/>Armazena arquivos e artefatos.<br/>Exports, pacotes e anexos.")]

  be["DSP Backend<br/>API REST e regras de negócio.<br/>Autenticação e orquestração."]
  fe["DSP Frontend<br/>Interface web da plataforma.<br/>Consulta, mapas e compartilhamento."]

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

  classDef gw fill:#1e3a5f,color:#fff,stroke:#0f172a
  classDef app fill:#0f766e,color:#fff,stroke:#115e59
  classDef geoCls fill:#166534,color:#fff,stroke:#14532d
  classDef db fill:#b45309,color:#fff,stroke:#92400e
  classDef job fill:#7c2d12,color:#fff,stroke:#431407
  classDef coreCls fill:#312e81,color:#fff,stroke:#1e1b4b

  class nginx gw
  class fe,be app
  class gsEx,gsDl geoCls
  class dspDb,gsDb,srcDb,bucket db
  class jobMig,jobGeo job
  class core coreCls
```

# ------

