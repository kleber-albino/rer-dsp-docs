# Configuração da instalação (labels)

Como personalizar **rótulos e textos da UI** por instalação no `rer-dsp-backend`, sem alterar código.

Os **dados** territoriais (unidades L1/L2/L3) ficam nas tabelas `dsp.territory_level_*`.  
Os **nomes exibidos** dos filtros (“Level 1”, “Region”, etc.) vêm de um **arquivo JSON** — padrão semelhante ao `layerConfig` do Consulta Pública (arquivo externo apontado por propriedade).

## Sumário

- [Arquivo e propriedade](#arquivo-e-propriedade)
- [Endpoint](#endpoint)
- [Estrutura do JSON](#estrutura-do-json)
- [Exemplo: renomear níveis](#exemplo-renomear-niveis)
- [Primeira execução / ambiente](#primeira-execucao--ambiente)
- [O que não entra neste arquivo](#o-que-nao-entra-neste-arquivo)

---

## Arquivo e propriedade

| Item | Valor |
|------|--------|
| Arquivo default | `rer-dsp-backend/src/main/resources/installationConfig.json` |
| Propriedade | `dsp.installation-config.file` |
| Variável de ambiente | `DSP_INSTALLATION_CONFIG_FILE` |

Valores aceitos:

| Formato | Exemplo |
|---------|---------|
| Classpath | `classpath:installationConfig.json` (default) |
| URI de arquivo | `file:/etc/dsp/installationConfig.json` |
| Caminho no disco | `/etc/dsp/installationConfig.json` |

No `application.properties`:

```properties
dsp.installation-config.file=${DSP_INSTALLATION_CONFIG_FILE:classpath:installationConfig.json}
```

!!! tip "Labels padrão"
    O JSON padrão do repositório usa textos em **inglês** (Level 1 / Level 2 / Level 3, KPIs, telas). Cada instalação altera o arquivo conforme o vocabulário local.

---

## Endpoint

```http
GET /config/installation
```

(context-path default: `/dsp-backend`)

O frontend consome esse endpoint para montar filtros, títulos de tela e cards de KPI. Se a API falhar, usa o fallback local em `rer-dsp-frontend/src/config/installationConfigFallback.ts`.

A config é carregada uma vez e **fica em cache** na memória do backend. Após mudar o arquivo, **reinicie** a aplicação.

---

## Estrutura do JSON

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
  }
}
```

| Bloco | Função |
|-------|--------|
| `hierarchy` | Labels e placeholders dos níveis `level1` / `level2` / `level3` |
| `screens.home` / `screens.downloads` | Quais níveis cada tela usa e textos dos campos |
| `screens.home.detail` | Rótulos do painel de detalhe por identificador (A4) |
| `kpis` | Cards da home (rótulos, unidades, cores) |
| `areaOfInterest` | Unidade/rótulo da área do imóvel (A4), migrada e persistida |
| `formats` | Padrões de **exibição** de data/hora na UI |

As chaves `level1`–`level3` são estáveis: batem com `GET /territory/options?level=…`. Mude o **`label`**, não a **`key`**.

### `screens.home.detail` — painel A4

| Campo | Exemplo (EN) | Exemplo (PT) |
|-------|--------------|--------------|
| `sectionTitle` | Search details | Detalhes da consulta |
| `areaOfInterestSectionTitle` | Area of interest data | Dados da área de interesse |
| `registrationDateLabel` | Registration date | Data de registro |
| `alterationDateLabel` | Alteration date | Data de alteração |
| `latitudeLabel` / `longitudeLabel` | Latitude / Longitude | Latitude / Longitude |
| `areaLabel` | Area | Área |
| `featuresDownloadLabel` | Download features | Baixar feições |

Se o bloco `detail` estiver ausente, o backend aplica os defaults em inglês.
### Transferência de datas (API)

Entre front e back, sempre:

| Conteúdo | Formato |
|----------|--------|
| Só dia | `yyyy-MM-dd` |
| Dia + hora | `yyyy-MM-dd'T'HH:mm:ss` |

A UI converte para `formats.date` / `formats.dateTime` na exibição.

### `formats` — exibição

| Campo | Exemplo (Brasil) | Se ausente/vazio |
|-------|------------------|------------------|
| `date` | `dd/MM/yyyy` | `yyyy-MM-dd` (mesmo da transferência) |
| `dateTime` | `dd/MM/yyyy HH:mm:ss` | `yyyy-MM-dd'T'HH:mm:ss` |

### `areaOfInterest` — unidade de área

A área do imóvel é **migrada da origem** (ex.: `num_area_imovel` no SICAR) e persistida em `dsp.area_of_interest.area`. O DSP **não** calcula área pela geometria nem converte unidade.

`areaUnit` / `areaUnitLabel` são **texto livre**: descrevem a unidade do valor migrado (rótulo A4). Pode ser `ha`, `m²`, `km2` ou algo local (ex.: `"campos de futebol"`). O importante é alinhar o que a instalação grava na migração com o que a UI exibe. Nos JSONs de exemplo do repositório (Brasil/CAR) a unidade está **explícita** como `ha`.

| Campo | Valores | Se ausente/vazio |
|-------|---------|------------------|
| `areaUnit` | qualquer texto | `unidade-nao-configurada` (com log warn) |
| `areaUnitLabel` | texto livre para UI | `unidade não configurada` (se a unit também faltou); senão copia `areaUnit` |

**Não** há fallback silencioso para `ha`: isso mascararia configuração incompleta. Defina a unidade de propósito no JSON da instalação.

Se o bloco `areaOfInterest` inteiro estiver ausente, o backend usa os mesmos marcadores de “não configurada”.

Não reutilize `kpis[].unitOfMeasurement` para essa unidade — são contextos diferentes (cards da home vs. detalhe do imóvel).

---

## Exemplo: renomear níveis

Instalação no estilo Brasil (região → estado → município):

```json
"hierarchy": [
  { "key": "level1", "label": "Region", "placeholder": "Select region", "order": 1 },
  { "key": "level2", "label": "State", "placeholder": "Select state", "order": 2 },
  { "key": "level3", "label": "Municipality", "placeholder": "Select municipality", "order": 3 }
]
```

Outra instalação (país → região → distrito) só altera os mesmos `label` / `placeholder`.

---

## Primeira execução / ambiente

1. Copie `installationConfig.json` (ou monte um volume com o arquivo da instalação).
2. Ajuste labels, telas e KPIs.
3. Defina `DSP_INSTALLATION_CONFIG_FILE` apontando para esse arquivo (se não for o classpath default).
4. Suba o backend.
5. Confira `GET /config/installation`.

Não é necessário rebuild da imagem se o arquivo for montado por volume/ConfigMap e a propriedade apontar para ele.

---

## O que não entra neste arquivo

| Assunto | Onde fica |
|---------|-----------|
| Unidades territoriais (id, nome, pai, bbox/centroid) | Tabelas `dsp.territory_level_1\|2\|3` + job de migração |
| Camadas WMS / GeoServer | `GET /map/getBaseMaps` e `GET /map/getLayers` (JSONs `baseMapConfig.json` / `mapLayersConfig.json`; ver [componente de mapa](../frontend/map-component.md)) |
| Mapeamento origem→destino do ETL | `application.yaml` do `rer-dsp-job-data-migration` |
