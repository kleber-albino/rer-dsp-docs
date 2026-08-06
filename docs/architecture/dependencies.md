# Dependências entre módulos

## Quais dependências existem entre os módulos?

| Módulo | Depende de | Como |
|--------|------------|------|
| **rer-dsp-backend** | rer-dsp-core | Schema `dsp` já criado no Postgres (`dsp-db`); arquivos externos `installationConfig.json` (`DSP_INSTALLATION_CONFIG_FILE`) e `mapLayersConfig.json` (`DSP_MAP_LAYERS_FILE`), normalmente gerados pelo `./config.sh` do core |
| **rer-dsp-frontend** | rer-dsp-backend | API REST via `VITE_DSP_API_URL` (build) ou `public/config/env.json` (runtime) |
| **rer-dsp-frontend** | GeoServer | WMS consumido diretamente pelo componente de mapa (`map_component`), configurado via `/map/getBaseMaps` e `/map/getLayers` do backend |
| **rer-dsp-job-data-migration** | rer-dsp-core | Schema dos bancos `target` (dsp-db), `geo-target` (exhibition-db) e `batch` (metadados Spring Batch) |
| **rer-dsp-job-data-migration** | Fonte JDBC do adotante | Conexão externa configurada como datasource `source` — não provida pelo core |
| **rer-dsp-core** | rer-dsp-backend, rer-dsp-frontend, rer-dsp-job-data-migration | Apenas para **build/orquestração Docker**, via paths em variáveis de ambiente (`DSP_BACKEND_PATH`, `DSP_FRONTEND_PATH`, `DSP_JOB_MIGRATION_PATH`) — **sem** dependência de runtime |

## Leitura do quadro

- O **core** é a única peça sem dependência de runtime sobre os demais — ele só precisa deles no momento de construir e subir os containers.
- O **backend** é o módulo mais acoplado ao core em runtime: sem o schema e os arquivos de configuração gerados por ele, a API não sobe corretamente.
- O **frontend** depende apenas do backend (para dados) e do GeoServer (para mapas) — nenhuma dependência direta de banco de dados.
- O **job de migração** é o único módulo com uma dependência externa ao ecossistema DSP: a fonte JDBC da organização adotante.

Veja também: [Fluxo de dados](data-flow.md), [Bancos de dados](databases.md), [Módulos do DSP](../modulos.md).
