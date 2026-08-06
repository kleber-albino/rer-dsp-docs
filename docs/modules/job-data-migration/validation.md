# rer-dsp-job-data-migration — Validação pós-migração

Checklist e consultas para confirmar que a migração via `rer-dsp-job-data-migration` concluiu com sucesso e que o destino está consistente.

## Quando validar

| Momento | Objetivo |
|---------|----------|
| Após cada job (L1, L2, L3, área de interesse) | Isolar problemas por nível |
| Após a sequência completa | Confirmar base pronta para o DSP |
| Antes de liberar GeoServer/API | Evitar publicação de dados incompletos |

## Checklist rápido

- [ ] Última execução do job com `status = COMPLETED`
- [ ] Sem steps `FAILED` em `BATCH_STEP_EXECUTION`
- [ ] Contagem do destino coerente com a origem (respeitando `where-clause` / estratégia)
- [ ] PK/unique presentes nas colunas de conflito
- [ ] Amostra de geometrias com `ST_IsValid` e SRID conforme `srid` do YAML — em ambos os destinos (`dsp-db`: bbox/centroid; `exhibition-db`: geometry)
- [ ] FKs de hierarquia resolvidas (se aplicável)
- [ ] Layer GeoServer aponta para a tabela/view correta

## 1. Status do Spring Batch

Conecte no database de metadados (`spring.datasource.batch`):

```bash
psql -h localhost -p 6666 -U postgres -d batch_metadata
```

### Últimas execuções

```sql
SELECT i.job_name,
       e.status,
       e.exit_code,
       e.start_time,
       e.end_time
FROM batch_job_execution e
JOIN batch_job_instance i
  ON e.job_instance_id = i.job_instance_id
ORDER BY e.job_execution_id DESC
LIMIT 20;
```

A linha mais recente deve estar `COMPLETED`. Se aparecer `FAILED`, use a consulta de steps abaixo e os logs da aplicação para achar a causa.

### Steps da última execução de um job

```sql
SELECT se.step_name,
       se.status,
       se.read_count,
       se.write_count,
       se.skip_count,
       se.exit_message
FROM batch_step_execution se
JOIN batch_job_execution je
  ON se.job_execution_id = je.job_execution_id
JOIN batch_job_instance ji
  ON je.job_instance_id = ji.job_instance_id
WHERE ji.job_name = 'adminUnitLevel1GeoserverJob'
ORDER BY se.step_execution_id DESC
LIMIT 20;
```

!!! tip "Nomes dos jobs"
    Use o nome do **bean** (`adminUnitLevel1GeoserverJob`, etc.), não a flag `execution-jobs` em kebab-case.

## 2. Contagens origem × destino

Valide **os dois destinos** após cada job. Adapte schema/tabela ao seu YAML.

### dsp-db (operacional — sem geometry completa)

```sql
SELECT COUNT(*) AS dsp_db_count
FROM target_admin_units.target_l1_continent
WHERE boundary_box IS NOT NULL;
```

### exhibition-db (geometria completa)

```sql
SELECT COUNT(*) AS source_count
FROM source_admin_units.source_l1_continents
WHERE source_continent_geom IS NOT NULL;

SELECT COUNT(*) AS exhibition_count
FROM target_admin_units.target_l1_continent
WHERE target_continent_geometry IS NOT NULL;
```

| Estratégia | Expectativa |
|------------|-------------|
| `DEFAULT` | Destino reflete origem filtrada; órfãos removidos |
| `DATE_RANGE` | Destino pode ter histórico fora do intervalo; valide o recorte de negócio |

## 3. Integridade de chave e órfãos

### PK no destino

```sql
SELECT tc.constraint_type, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'target_admin_units'
  AND tc.table_name = 'target_l1_continent'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE');
```

### Órfãos no destino (não deveriam existir após DEFAULT)

```sql
SELECT t.target_continent_id
FROM target_admin_units.target_l1_continent t
LEFT JOIN source_admin_units.source_l1_continents s
  ON s.source_continent_pk = t.target_continent_id
WHERE s.source_continent_pk IS NULL
LIMIT 50;
```

## 4. Geometrias

### exhibition-db — geometry completa

```sql
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE NOT ST_IsValid(target_continent_geometry)) AS invalidas,
  COUNT(*) FILTER (WHERE ST_SRID(target_continent_geometry) <> 4326) AS srid_diferente,
  COUNT(*) FILTER (WHERE target_continent_geometry IS NULL) AS nulas
FROM target_admin_units.target_l1_continent;
```

Substitua `4326` pelo valor de `srid` do bloco YAML correspondente.

### dsp-db — bbox e centroid

```sql
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE NOT ST_IsValid(boundary_box)) AS bbox_invalidas,
  COUNT(*) FILTER (WHERE ST_SRID(boundary_box) <> 4326) AS bbox_srid_diferente,
  COUNT(*) FILTER (WHERE NOT ST_IsValid(centroid_coordinates)) AS centroid_invalidos,
  COUNT(*) FILTER (WHERE ST_SRID(centroid_coordinates) <> 4326) AS centroid_srid_diferente
FROM target_admin_units.target_l1_continent;
```

| Verificação | Critério de aceite |
|-------------|---------------------|
| `invalidas` | 0 (ou lista conhecida tratada à parte) |
| `srid_diferente` | 0 em relação ao `srid` do YAML (validar em exhibition-db e em bbox/centroid do dsp-db) |
| `nulas` | Compatível com regras de negócio |

## 5. Hierarquia entre levels

```sql
SELECT c.target_country_id, c.target_continent_ref
FROM target_admin_units.target_l2_country c
LEFT JOIN target_admin_units.target_l1_continent p
  ON p.target_continent_id = c.target_continent_ref
WHERE p.target_continent_id IS NULL
LIMIT 50;
```

Repita o padrão para level-3 → level-2.

## 6. Paralelização e performance

| Sinal | Interpretação |
|-------|----------------|
| `write_count` muito menor que esperado | Filtros de geometria / skips no writer |
| Muitos erros de conexão | `thread-pool-size` maior que o pool Hikari |
| Job lento com `thread-pool-size: 1` | Esperado em tabelas grandes |
| `SKIP` imediato | Change detection sem mudanças — confirme se a origem realmente mudou |

## 7. GeoServer

| Checagem | Como |
|----------|------|
| Layer existe | UI/REST do GeoServer com o mesmo `layer-name` do YAML |
| Store aponta para exhibition-db | Conferir datastore JDBC/PostGIS → `dsp-geoserver-exhibition-db` (não `dsp-db`) |
| Preview WMS | Bounding box coerente com a amostra SQL do exhibition-db |

## Sinais de falha frequentes

| Sintoma | Causa provável | Correção |
|---------|-----------------|----------|
| `batch_job_instance does not exist` | Schema BATCH ausente | Rodar `01_spring_batch_schema.sql` |
| Erro `ON CONFLICT` | Sem PK/unique no destino | Criar constraint |
| Contagem destino = 0 | Job em SKIP, flags false, ou JDBC errado | Revisar `execution-jobs` e URLs |
| Geometrias nulas | Mapping da coluna geom incorreto | Revisar `column-mapping` / `geometry-column` |
| FK quebrada entre levels | Ordem invertida ou L1 incompleto | Reexecutar L1 → L2 → L3 |
| App sobe e encerra "ok" sem dados | Nenhuma flag `true` | Habilitar ao menos um job |

Configuração completa: [Configuração e execução](configuration.md).
