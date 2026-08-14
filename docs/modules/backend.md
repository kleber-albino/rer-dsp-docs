# rer-dsp-backend

Este módulo é parte do [DSP](../index.md) — veja a documentação completa em [rer-dsp-docs](../index.md). As informações abaixo tratam apenas deste módulo.

## Objetivo

O `rer-dsp-backend` é a API REST do DSP: expõe dados de negócio, hierarquia territorial, downloads e configuração de mapas para o frontend e outros consumidores.

## Responsabilidades

- Servir dados de negócio a partir do banco operacional (`dsp-db`) — nunca geometria completa.
- Expor configuração de instalação (labels, hierarquia, telas, KPIs) via arquivo externo, sem precisar alterar código.
- Expor configuração de camadas de mapa (base maps e layers) consumida pelo componente de mapa do frontend.
- Fazer proxy WFS ao GeoServer Download para busca e download de arquivos CSV na tela de Downloads.

## Stack

| Item | Valor |
|------|--------|
| Linguagem / runtime | Java 21 |
| Framework | Spring Boot 3.4.2 |
| Build | Gradle |
| ORM | JPA/Hibernate + hibernate-spatial + PostGIS |
| Documentação de API | springdoc-openapi |
| Boilerplate | Lombok |

## Como executar

```bash
./gradlew bootRun
```

Ou via Docker, orquestrado pelo `rer-dsp-core` — que oferece dois modos: [demo](../getting-started.md) (seed sintético, sem banco externo) ou [instalação real](../guides/full-installation.md) (dados do adotante via fonte JDBC).

## Variáveis de ambiente

Definidas com valores default em `src/main/resources/application.properties`.

| Variável | Função |
|----------|--------|
| `SERVER_SERVLET_CONTEXT_PATH` | Context-path da API (default `/dsp-backend`) |
| `DSP_CORS_ALLOWED_ORIGINS` | Origens permitidas no CORS |
| `DSP_INSTALLATION_CONFIG_FILE` | Caminho do JSON de configuração de instalação |
| `DSP_MAP_LAYERS_FILE` | Caminho do JSON de camadas de mapa |
| `DSP_DOWNLOAD_THEMES_FILE` | Caminho do JSON de temas de download (`downloadThemesConfig.json`) |
| `DSP_GEOSERVER_WFS_BASE_URL` | URL base WFS do GeoServer Download para exportação de downloads |
| `SPRING_DATASOURCE_URL` / `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` | Conexão com `dsp-db` |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | Gestão de schema (manter `none`) |

## Endpoints REST

| Endpoint | Descrição |
|----------|-----------|
| `GET /config/installation` | Configuração de instalação: hierarquia, telas, KPIs |
| `GET /geoServices/getRegions` | Lista de regiões |
| `GET /state/getAll` | Lista de estados |
| `GET /state/getCitiesByUf/{idState}` | Cidades por estado |
| `GET /state/getUfsByRegion/{region}` | Estados por região |
| `GET /downloads/themes` | Temas disponíveis para download (catálogo em `downloadThemesConfig.json`) |
| `POST /downloads/search` | Busca itens por hierarquia/tema (nível 2 obrigatório, nível 3 opcional) |
| `GET /downloads/file` | Download de arquivo CSV via proxy WFS |
| `GET /map/getBaseMaps` | Mapas base configurados |
| `GET /map/getLayers` | Camadas de mapa (via `DSP_MAP_LAYERS_FILE`) |
| `POST /totalizer/` | Totalizadores |
| `GET /totalizer/getDeatilsByIdentifier/{identifier}` | Detalhe por identificador |
| `GET /totalizer/getDetailsByCoordinates` | Detalhe por coordenadas |
| `GET /territory/options` | Opções de território por hierarquia |
| `GET /territory/boundary-box` | Bounding box de território |

Documentação interativa: Swagger UI em `{context-path}/swagger-ui.html`; OpenAPI JSON em `/api-docs`.

## Configuração de instalação (labels, telas, KPIs)

Os **dados** territoriais (unidades L1/L2/L3) ficam nas tabelas `dsp.territory_level_*`. Os **nomes exibidos** dos filtros ("Level 1", "Region", etc.) vêm de um arquivo JSON externo, sem necessidade de alterar código.

| Item | Valor |
|------|--------|
| Arquivo default | `rer-dsp-backend/src/main/resources/installationConfig.json` |
| Propriedade | `dsp.installation-config.file` |
| Variável de ambiente | `DSP_INSTALLATION_CONFIG_FILE` |

Formatos aceitos: `classpath:installationConfig.json` (default), `file:/etc/dsp/installationConfig.json`, ou caminho absoluto no disco.

O frontend consome `GET /config/installation` para montar filtros, títulos de tela e cards de KPI. A configuração é carregada uma vez e fica em cache na memória do backend — após mudar o arquivo, é necessário reiniciar a aplicação.

Estrutura do JSON:

```json
{
  "hierarchy": [
    { "key": "level1", "label": "Level 1", "placeholder": "Select level 1", "order": 1 },
    { "key": "level2", "label": "Level 2", "placeholder": "Select level 2", "order": 2 },
    { "key": "level3", "label": "Level 3", "placeholder": "Select level 3", "order": 3 }
  ],
  "screens": {
    "home": { "...": "title, hierarchyKeys, identifier, detail, ..." },
    "downloads": { "...": "title, hierarchyKeys, theme, section titles, ..." }
  },
  "kpis": {
    "maxCards": 5,
    "primaryCode": "AREA_OF_INTEREST",
    "cards": [ { "code": "...", "label": "...", "unitOfMeasurement": "...", "accentColor": "...", "order": 1, "required": true } ]
  },
  "areaOfInterest": {
    "areaUnit": "ha",
    "areaUnitLabel": "ha"
  },
  "formats": {
    "date": "dd/MM/yyyy",
    "dateTime": "dd/MM/yyyy HH:mm:ss"
  },
  "map": {
    "initialView": {
      "mode": "territorial_bbox",
      "latitude": null,
      "longitude": null,
      "zoom": null
    }
  }
}
```

Exemplo com modo manual:

```json
"map": {
  "initialView": {
    "mode": "manual",
    "latitude": 39.5,
    "longitude": -8.0,
    "zoom": 7
  }
}
```

Exemplo com modo planet:

```json
"map": {
  "initialView": {
    "mode": "planet",
    "latitude": null,
    "longitude": null,
    "zoom": null
  }
}
```

| Bloco | Função |
|-------|--------|
| `hierarchy` | Labels e placeholders dos níveis `level1` / `level2` / `level3` — as **chaves** são estáveis (batem com `GET /territory/options?level=…`); altere o `label`, não a `key` |
| `screens.home` / `screens.downloads` | Quais níveis cada tela usa e textos dos campos |
| `kpis` | Cards da home (rótulos, unidades, cores) |
| `map.initialView` | Modo de abertura/reset do mapa na Home. `mode` obrigatório: `territorial_bbox` (enquadra via `GET /territory/boundary-box`; se nenhum nível territorial L1/L2/L3 estiver configurado no ETL, o `./config.sh` grava `planet` explicitamente), `manual` (exige `latitude`, `longitude`, `zoom`) ou `planet` (sempre centro `[0,0]` zoom `0`) |
| `areaOfInterest` | Unidade/rótulo da área do imóvel — a área em si vem migrada da origem, o DSP não a calcula nem converte unidade |
| `formats` | Padrões de exibição de data/hora na UI |

Entre frontend e backend, datas trafegam sempre em `yyyy-MM-dd` (só dia) ou `yyyy-MM-dd'T'HH:mm:ss` (dia + hora); a UI converte para `formats.date`/`formats.dateTime` na exibição.

O que **não** entra neste arquivo: unidades territoriais (tabelas `dsp.territory_level_*` + job de migração), camadas WMS/GeoServer (`GET /map/getBaseMaps` e `GET /map/getLayers`), catálogo de downloads (`downloadThemesConfig.json`) e o mapeamento origem→destino do ETL (`application.yaml` do job de migração).

## Downloads (GeoServer Download WFS)

O catálogo de temas de download vem de `downloadThemesConfig.json`, gerado pelo `./config.sh` do core a partir de `area_of_interest` e `etl.layers[]`. O backend:

1. Valida território (nível 2 obrigatório, nível 3 opcional) no `dsp-db`.
2. Monta filtro CQL por tema.
3. Consulta o **GeoServer Download** via WFS (`GetFeature` com `resultType=hits` na busca; `outputFormat=csv` no download) em `DSP_GEOSERVER_WFS_BASE_URL`.
4. Para temas com feições no recorte, consulta `alteration_date` via WFS (`sortBy`, `count=1`) e preenche `lastUpdate` na resposta.
5. Devolve status ou bytes CSV ao frontend — o browser não acessa o GeoServer para arquivos de download.

Se `alteration_date` faltar no WFS, a busca continua OK e `lastUpdate` fica `null` (UI exibe `—`).

## Integração com os demais módulos

- Depende do **core** para o schema `dsp` no Postgres e para os arquivos externos `installationConfig.json` e `mapLayersConfig.json`.
- É consumido pelo **frontend** via API REST (`VITE_DSP_API_URL`).
- Lê exclusivamente o banco **dsp-db** — nunca acessa `geoserver-db` diretamente.
- Consulta o **GeoServer Download** via HTTP/WFS para downloads de arquivo.

Veja também: [Bancos de dados](../architecture/databases.md), [Dependências entre módulos](../architecture/dependencies.md).
