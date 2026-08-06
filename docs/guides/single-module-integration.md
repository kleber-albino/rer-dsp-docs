# Integrar apenas um módulo

## Como integrar apenas um módulo específico ao meu ambiente?

!!! warning "Caminho avançado"
    Rodar um módulo isolado, fora da stack orquestrada pelo `rer-dsp-core`, é um caminho **avançado e não oficial** e minimamente documentado abaixo. O caminho recomendado é usar o core como orquestrador (veja [Começando rápido](../getting-started.md) e [Instalação completa](full-installation.md)). Use este guia apenas se você já tem infraestrutura própria e sabe o que está fazendo.

## rer-dsp-backend sozinho

Para rodar o backend fora do Docker Compose do core, você precisa:

- Um PostgreSQL/PostGIS acessível com o **schema `dsp`** já criado (normalmente provido pelo SQL de inicialização do core).
- Os arquivos externos de configuração apontados por `DSP_INSTALLATION_CONFIG_FILE` (config de instalação: hierarquia, telas, KPIs) e `DSP_MAP_LAYERS_FILE` (camadas de mapa) — normalmente gerados pelo `./config.sh` do core.
- Variáveis `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` apontando para esse banco, e `SPRING_JPA_HIBERNATE_DDL_AUTO=none` (o backend não gerencia o schema).

Detalhes completos: [rer-dsp-backend](../modules/backend.md).

## rer-dsp-frontend sozinho

O frontend é o módulo mais simples de rodar isoladamente: ele só precisa saber a URL de um backend já em execução.

- Defina `VITE_DSP_API_URL` no build, **ou** aponte em runtime via `public/config/env.json` (campo `urlBackend`) — útil quando a imagem já foi construída e você não quer rebuildar.
- Não há dependência direta de banco de dados ou GeoServer no frontend; tudo é consumido via API do backend e WMS do GeoServer configurado nas camadas de mapa.

Detalhes completos: [rer-dsp-frontend](../modules/frontend.md).

## rer-dsp-job-data-migration sozinho

É o módulo com mais dependências para rodar isolado — precisa dos **4 datasources** configurados manualmente em `application.yaml`:

| Datasource | Papel |
|------------|-------|
| `source` | Fonte JDBC da organização adotante |
| `target` | `dsp-db` — negócio + bbox/centroid |
| `geo-target` | `exhibition-db` — geometria completa |
| `batch` | Metadados do Spring Batch (schema `BATCH_*`, inicializado manualmente) |

Sem o core, você precisa criar manualmente os schemas de destino (`target` e `geo-target`) e aplicar o script `db/batch_metadata/01_spring_batch_schema.sql`. Detalhes completos: [rer-dsp-job-data-migration — Configuração e execução](../modules/job-data-migration/configuration.md).

## rer-dsp-core sem os demais módulos

Também é possível usar o core apenas para subir os **bancos e o GeoServer**, sem construir/subir backend e frontend — útil no cenário "só publicar mapas" descrito em [Módulos do DSP](../modulos.md#posso-utilizar-apenas-alguns-modulos).
