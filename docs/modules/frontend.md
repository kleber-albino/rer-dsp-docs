# rer-dsp-frontend

Este módulo é parte do [DSP](../index.md) — veja a documentação completa em [rer-dsp-docs](../index.md). As informações abaixo tratam apenas deste módulo.

## Objetivo

O `rer-dsp-frontend` é a interface web do DSP: busca por hierarquia territorial, KPIs, mapa interativo e telas de apoio (Geoservices, About).

## Responsabilidades

- Renderizar a Home com busca/hierarquia territorial, KPIs e mapa.
- Consumir a API do backend para dados de negócio e configuração.
- Consumir GeoServer (WMS/WFS) diretamente para exibição de camadas no mapa.

## Stack

| Item | Valor |
|------|--------|
| Framework | Vue 3 (Composition API) + TypeScript |
| Build tool | Vite |
| Estilo | Tailwind CSS |
| Mapas | [`@rural-environmental-registry/map_component`](https://www.npmjs.com/package/@rural-environmental-registry/map_component) (baseado em Leaflet) |
| Testes | Vitest |

## Como executar

| Comando | Ação |
|---------|------|
| `npm run dev` | Dev server na porta 5173 |
| `npm run build` | Type-check + build de produção (Vite) |
| `npm run test` / `npm run coverage` | Testes com Vitest |

Docker: build multi-stage, servido por nginx:alpine em `/dsp/`, porta 8080 no container (8081 no host via docker-compose do core).

## Variáveis de ambiente

| Variável | Função |
|----------|--------|
| `VITE_BASE_URL` | Base path da aplicação (default `/dsp/`) |
| `VITE_DSP_API_URL` | URL do backend. Se ausente no build, o valor é lido em runtime de `public/config/env.json` (campo `urlBackend`) |

O mecanismo de runtime config via `public/config/env.json` permite trocar a URL do backend **sem rebuildar** a imagem — basta montar um arquivo diferente por volume/ConfigMap.

## Telas principais

| Tela | Conteúdo |
|------|----------|
| Home | Busca/hierarquia territorial + KPIs + mapa |
| Geoservices | Camadas geoespaciais |
| About | Informações institucionais |

## Componente de mapa

O mapa da Home usa o pacote compartilhado [`@rural-environmental-registry/map_component`](https://www.npmjs.com/package/@rural-environmental-registry/map_component),baseado em Leaflet.

| Item | Valor |
|------|--------|
| Papel no DSP | Exibição WMS + menu de temas/sub-camadas com toggle |
| Fonte das camadas | Somente a API do backend (`GET /map/getBaseMaps`, `GET /map/getLayers`) — sem fallback local; falha de configuração fica visível na UI |

O componente de mapa consome `/map/getBaseMaps` e `/map/getLayers` e integra o GeoServer (WMS/WFS) via o pacote `map_component`. A orquestração de negócio (filtros, clique no mapa → detalhe do imóvel) fica no frontend do DSP, não no pacote em si.

## Integração com o backend

Endpoints consumidos pelo frontend:

| Endpoint | Uso |
|----------|-----|
| `GET /config/installation` | Labels, hierarquia, telas, KPIs |
| `GET /downloads/themes` | Temas de download |
| `POST /downloads/search` | Busca de itens por hierarquia/tema |
| `GET /downloads/file` | Download de arquivo CSV via backend |
| `GET /map/getBaseMaps` | Mapas base |
| `GET /map/getLayers` | Camadas de mapa |
| `GET /geoServices/getRegions` | Regiões |
| `GET /state/getAll` | Estados |

## Integração com os demais módulos

- Depende do **backend** para todos os dados de negócio e para downloads de arquivo — sem um backend acessível, a maior parte da UI não funciona.
- Consome o **GeoServer** diretamente via WMS/WFS apenas para mapas e geometria de AOI, usando as URLs de camadas retornadas pelo backend.
- Não tem dependência direta de banco de dados.

Veja também: [Dependências entre módulos](../architecture/dependencies.md), [Fluxo de dados](../architecture/data-flow.md).
