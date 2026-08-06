# Componente de mapa (frontend)

Como o **rer-dsp-frontend** monta o mapa da Página Inicial (Épico A3), usando o pacote compartilhado do RER.

## Decisão

| Item | Valor |
|------|--------|
| Pacote | [`@rural-environmental-registry/map_component`](https://www.npmjs.com/package/@rural-environmental-registry/map_component) |
| Biblioteca base | Leaflet |
| Papel no DSP | Exibição WMS + menu de temas/sub-camadas com toggle |
| Desenho / memorial | **Desligados** (consulta pública, não cadastro) |
| Loading overlay | **Desligado** — tiles e camadas aparecem conforme carregam |
| Fonte das camadas | **Somente** API do backend (`/map/getBaseMaps`, `/map/getLayers`). Sem fallback local — falha de config fica visível na UI |

A orquestração de negócio (filtros → CQL, clique → API de detalhe do imóvel) fica no frontend DSP, não no pacote.

## Clique no mapa → detalhe da AOI

| Item | Valor |
|------|--------|
| Gatilho | Clique no Leaflet em `DspMapComponent` → evento `aoi-click` |
| Identificação | `GET /totalizer/getDetailsByCoordinates?lat=&lng=` (`ST_Contains` em `boundary_box` no **dsp-db**) |
| Geometria | WFS `GetFeature` em `dsp:area-of-interest` (GeoServer Exhibition) filtrado por `id` |
| Destaque | Polígono no mapa com cores da layer AOI **mais escuras** (~30%) |
| Detalhe | Botão **“Ver Detalhes do Imóvel”** → evento `open-details` → painel `DetailSearchComponent` |
| Sobreposição | Lista **“Outros próximos”** no painel; clique redesenha geometria (e atualiza o painel se já aberto) |

## Onde está no código

| Arquivo | Função |
|---------|--------|
| `rer-dsp-frontend/src/components/DspMapComponent.vue` | Clique → `aoi-click`; highlight GeoJSON; botão → `open-details` |
| `rer-dsp-frontend/src/services/mapService.ts` | `getBaseMaps` / `getLayers` + adaptador para `MapLayers` |
| `rer-dsp-frontend/src/services/geoserverAoiService.ts` | WFS GetFeature por id + resolução da layer AOI |
| `rer-dsp-frontend/src/services/totalizerService.ts` | `getDetailsByCoordinates` / `getDeatilsByIdentifier` |
| `rer-dsp-frontend/src/config/mapOptions.ts` | Centro, zoom e ferramentas do mapa (não camadas) |
| `rer-dsp-frontend/src/main.ts` | Import dos CSS do pacote e do Leaflet |
| `rer-dsp-frontend/src/views/HomeView.vue` | Clique → API + WFS highlight → botão → painel + “Outros próximos” |
| `rer-dsp-backend` | `GET /map/getBaseMaps`, `GET /map/getLayers`, `GET /totalizer/getDetailsByCoordinates` |

## API de camadas (backend)

Estilo Consulta Pública. O backend lê arquivos JSON e devolve o conteúdo:

| Endpoint | Envelope | Propriedade / env |
|----------|----------|-------------------|
| `GET /map/getBaseMaps` | `{ "baseMap": [...] }` | `dsp.map.base-maps-file` / `DSP_MAP_BASE_MAPS_FILE` |
| `GET /map/getLayers` | `{ "groups": [...] }` | `dsp.map.layers-file` / `DSP_MAP_LAYERS_FILE` |

Default classpath: `baseMapConfig.json` e `mapLayersConfig.json`. Aceita `classpath:…`, `file:…` ou path absoluto (mesmo padrão do `installationConfig`).

O frontend monta `{ mapLayers: baseMap, customLayers: groups }` para o `map_component`. Se a API falhar, o mapa **não** monta e exibe erro (não mascara com config hardcoded).

## GeoServer Exhibition (stack local)

Na stack do `rer-dsp-core`, o mapa consome o **GeoServer Exhibition**:

| Item | Valor |
|------|--------|
| Serviço Compose | `dsp-geoserver-exhibition` |
| Porta local | **22668** (`DSP_GEOSERVER_HOST_PORT`) |
| WMS | `http://localhost:22668/geoserver/dsp/wms` |
| UI admin | `http://localhost:22668/geoserver/web/` |
| Banco das layers | `dsp-geoserver-exhibition-db` — **não** `dsp-db` |

Layers publicadas: `dsp:territory-level-1|2|3`, `dsp:area-of-interest` (mesmos `layer-name` do job; tabelas `dsp.*` no exhibition-db).

Detalhe: [GeoServer Exhibition](https://github.com/Rural-Environmental-Registry/rer-dsp-core/blob/main/docs/geoserver-exhibition.md) · contrato de bancos: [Bancos de dados](../architecture/databases.md).

Basemap: Esri Imagery (default) + OpenStreetMap. Menu: divisão territorial (L1–L3) + área de interesse.

## GeoServer temporário (dev legado)

!!! warning "Substituído pela stack Exhibition"
    O script `rer-dsp-core/scripts/tmp-start-geoserver.sh` (porta 8085, banco `dsp-db`) era um atalho de desenvolvimento. Use o GeoServer Exhibition na porta **22668** apontando para `exhibition-db`.
