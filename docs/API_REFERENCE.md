# TIM Agentic CMS — API Reference

API v2 — versão consolidada resource-oriented.

> **Breaking changes**: 2026-05. Todos os paths `/figma/*`, `/variants/*`, `/deploy/*`, `/import`, `/static-page/*`, `/debug/*` foram renomeados ou removidos. Veja [Migration map](#migration-map-old--new) ao final.

---

## Convenções

- **Base URL (dev)**: `https://tim-agentic-cms-api-dev.gentlebeach-a211275a.eastus.azurecontainerapps.io`
- **Base path**: `/api`
- **Swagger interativo**: `<base>/docs`
- **Auth**: header `X-TIM-Key: <api_key>` em todos os endpoints (exceto `/health` e `/screenshots/{name}`)
- **Multi-env**: a maioria dos endpoints aceita `?env=ambiteste|stage|prod`. Default = `ambiteste`. Para POST/PUT/PATCH com body JSON, env vai como campo no body.
- **Content-Type**: `application/json` (exceto upload de template, que é multipart)
- **Erros**: status HTTP padrão + body `{"detail": "..."}` ou `{"detail": {"errors": [...]}}` para validação
- **Datas**: ISO-8601 UTC (ex: `2026-05-06T14:30:00.000Z`)

---

## Health & Jobs

### `GET /api/health`
Sem auth. Retorna status do container, SSH, volume.

```json
{
  "status": "online",
  "volume_mounted": true,
  "ssh_key_injected": true,
  "ssh_file_written": true
}
```

### `GET /api/jobs/{job_id}`
Retorna status de um job assíncrono.

```json
{
  "job_id": "uuid",
  "job_type": "import_workspace|deploy_figma|static_page|scan_drift",
  "status": "queued|processing|done|failed",
  "updated_at": "2026-05-06T14:30:00Z",
  "result": { ... },
  "error": "..."
}
```

### `POST /api/jobs/import-workspace`
Enfileira import de workspace de um NID matriz. Retorna `{job_id}`.

**Body:**
```json
{
  "nid": "12345",
  "env_host": "timbrasil.ambiteste@timbrasilambiteste.ssh.prod.acquia-sites.com",
  "env": "ambiteste"
}
```

### `POST /api/jobs/figma-deploy`
Enfileira deploy de um módulo Figma para um node Drupal. Retorna `{job_id}`.

**Body:**
```json
{
  "target_nid": "140421",
  "module_name": "m13_conjunto_cta_padrao",
  "data": { "TXT_TITULO": "Hero", "BOOL_MOSTRAR_BOTAO": true },
  "env_host": "timbrasil.ambiteste@...",
  "env": "ambiteste"
}
```

---

## Templates

### `GET /api/templates?env=&variants_only=&component_id=`

Lista templates do env.

- `variants_only=true` → apenas templates com `variant_id`, formato detalhado.
- default → lista enxuta com `figma_component_schema` de cada template.
- `component_id=` → filtra por component raiz (apenas com `variants_only=true`).

**Response (default):**
```json
{
  "status": "success",
  "count": 185,
  "templates": [
    {
      "componentName": "m13_conjunto_cta_padrao",
      "properties": [
        {"name": "TXT_TITULO", "type": "TEXT"},
        {"name": "BOOL_MOSTRAR_BOTAO", "type": "BOOLEAN"}
      ]
    }
  ]
}
```

**Response (`variants_only=true`):**
```json
{
  "status": "success",
  "count": 32,
  "templates": [
    {
      "module_name": "m13_conjunto_cta_padrao",
      "component_id": "cpt_conjunto_cta",
      "component_title": "Conjunto CTA",
      "variant_id": "v1",
      "variant_count": 47,
      "variant_pct": 0.32,
      "canvas_field": "field_layout_canvas",
      "figma_properties": { ... },
      "figma_dropzones": { ... },
      "figma_component_schema": { ... }
    }
  ]
}
```

### `GET /api/templates/{template_name}?env=`

Retorna template completo (incluindo `drupal_skeleton`).

```json
{
  "status": "success",
  "template": {
    "module_name": "m13_conjunto_cta_padrao",
    "canvas_field": "field_layout_canvas",
    "figma_properties": { ... },
    "figma_component_schema": { ... },
    "drupal_skeleton": [ ... ]
  }
}
```

### `POST /api/templates?env=`

Upload de um JSON de template (multipart/form-data, campo `file`).

```bash
curl -X POST "$API/api/templates?env=ambiteste" \
  -H "X-TIM-Key: $KEY" \
  -F "file=@m13_conjunto_cta_padrao.json"
```

---

## Content Types & Schemas

### `GET /api/content-types?env=`

Lista os 9 content types Drupal disponíveis no env.

```json
{
  "status": "success",
  "count": 9,
  "content_types": [
    {
      "content_type": "faq",
      "samples_analyzed": 250,
      "field_count": 28,
      "required_count": 6,
      "relationship_count": 12,
      "canvas_count": 1
    }
  ]
}
```

### `GET /api/content-types/{content_type}?env=`

Schema completo (após o regenerate_schemas_jsonapi.py corrigido):

```json
{
  "status": "success",
  "schema": {
    "content_type": "faq",
    "samples_analyzed": 250,
    "field_count": 28,
    "fields": {
      "field_peso": {
        "drupal_type": "integer",
        "type": "integer",
        "label": "Peso",
        "cardinality": 1,
        "is_multi": false,
        "required": true,
        "essential": true,
        "fill_rate": 1.0,
        "occurrences": 250,
        "samples": [{"value": 0}]
      },
      "field_ai_filter_type": {
        "drupal_type": "list_string",
        "type": "list",
        "cardinality": 1,
        "is_multi": false,
        "required": false,
        "essential": true,
        "allowed_values": [
          {"value": "controle", "label": "Controle"},
          {"value": "pos_pago", "label": "Pós-pago"}
        ]
      }
    },
    "relationships": {
      "field_tag": {
        "label": "Tags",
        "target_type": "taxonomy_term",
        "target_bundles": ["tag"],
        "cardinality": -1,
        "is_multi": true,
        "required": false,
        "essential": true,
        "fill_rate": 0.94,
        "taxonomy_options": [
          {"tid": 12, "name": "Internet"},
          {"tid": 13, "name": "Voz"}
        ]
      },
      "field_page": {
        "label": "Página associada",
        "target_type": "node",
        "target_bundles": ["paginas_gerais", "plano"],
        "cardinality": 1,
        "is_multi": false,
        "required": false
      }
    }
  }
}
```

**Campos importantes que o plugin deve usar:**
- `essential: true` — campo aparece em ≥90% dos nodes do bundle. Usar pra priorizar UI.
- `is_multi: true` — render como multi-select / multi-checkbox.
- `cardinality: -1` — unlimited; `>1` — bounded multi; `1` — single.
- `target_bundles` — lista de content_types ou vocabularies que o entity_ref aceita. Usar pra abrir o picker certo via [/api/references/...](#references-pickers-de-entity_ref).
- `allowed_values` — para `list_string`/`list_integer` com opções fixas.
- `taxonomy_options` — opções pré-carregadas de uma taxonomia (cache do servidor; não precisa chamar `/references/taxonomy` separadamente).

---

## Nodes

### `GET /api/nodes/{nid}?env=&no_cache=`

Info básica de um node (content_type, título). Cache TTL 300s.

```json
{
  "status": "success",
  "cached": false,
  "source": "jsonapi",
  "nid": "140421",
  "content_type": "paginas_gerais",
  "title": "Home"
}
```

### `GET /api/nodes/{nid}/fields?env=&langcode=`

Lê todos os campos atuais do node via JSON API (inclui url_alias, metatags, entity refs).

```json
{
  "status": "success",
  "source": "jsonapi",
  "nid": "12345",
  "content_type": "faq",
  "title": "Como ativo o pacote?",
  "drupal_status": true,
  "url_alias": "/faq/como-ativo-o-pacote",
  "metatags": {"robots": "index,follow"},
  "field_values": {
    "field_peso": 5,
    "field_ai_filter_type": "controle",
    "field_tag": {"_entity_ref": true, "target_ids": [12, 13]},
    "field_page": {"_entity_ref": true, "target_ids": [59256]}
  },
  "schema": { ...mesmo formato de /content-types/{type}... }
}
```

### `PATCH /api/nodes/{nid}/fields`

Atualiza campos sem tocar no canvas.

**Body:**
```json
{
  "field_values": {
    "title": "Novo título",
    "field_peso": 10,
    "url_alias": {"alias": "/faq/novo-slug", "pathauto": 0},
    "metatags": {"robots": "noindex,nofollow"}
  },
  "env_host": "timbrasil.ambiteste@..."
}
```

### `PUT /api/nodes/{nid}/canvas`

Deploya um template de variante no canvas Cohesion do node. Opcionalmente atualiza campos junto.

**Body:**
```json
{
  "template_name": "m13_conjunto_cta_padrao",
  "env_host": "timbrasil.ambiteste@...",
  "env": "ambiteste",
  "node_field_values": {
    "field_titulo": {"value": "Hero"},
    "field_destaque": {"value": false}
  }
}
```

### `DELETE /api/nodes/{nid}/canvas`

Esvazia todos os canvas fields do node (pra reset/screenshot).

**Body:**
```json
{
  "env_host": "timbrasil.ambiteste@...",
  "canvas_fields": null
}
```

`canvas_fields=null` limpa todos; passe lista pra limpar fields específicos.

### `GET /api/nodes/{nid}/sync-payload?module_name=&env=&env_host=`

**Endpoint principal pro plugin Figma.** Retorna payload no formato consumido por `syncFromPayload` / `syncPageFromPayload`.

- **Sem `module_name`** → página inteira, retorna lista de módulos:
  ```json
  {
    "status": "success",
    "modules": [
      {"module_name": "m13_conjunto_cta_padrao", "data": {"TXT_TITULO": "Hero"}},
      {"module_name": "m05_faq_sanfona", "data": {"TXT_TITULO": "FAQ", "SLOT_ITENS_FAQ": [...]}}
    ]
  }
  ```

- **Com `module_name`** → single module:
  ```json
  {
    "status": "success",
    "data": {"TXT_TITULO": "Hero", "BOOL_MOSTRAR_BOTAO": true}
  }
  ```

---

## References (pickers de entity_ref)

> **Use case**: campo `field_page` num FAQ tem `target_bundles: ["paginas_gerais", "plano"]`. O plugin precisa mostrar um campo de busca → backend retorna lista NID+título → designer escolhe. Endpoints abaixo são otimizados pra esse fluxo.

### `GET /api/references/nodes/{bundle}?search=&limit=&langcode=`

Busca NIDs por content_type. CONTAINS no título, case-insensitive.

```bash
curl "$API/api/references/nodes/faq?search=internet&limit=10" \
  -H "X-TIM-Key: $KEY"
```

```json
{
  "status": "success",
  "bundle": "faq",
  "count": 4,
  "results": [
    {"nid": 59256, "title": "Como contratar internet?", "status": true},
    {"nid": 61983, "title": "Plano de internet 5G", "status": true}
  ]
}
```

### `GET /api/references/taxonomy/{vocabulary}?search=&limit=`

Busca termos de taxonomia. Use vocabularies retornados em `target_bundles` de relationships com `target_type=taxonomy_term`.

```bash
curl "$API/api/references/taxonomy/tag?search=internet" \
  -H "X-TIM-Key: $KEY"
```

```json
{
  "status": "success",
  "vocabulary": "tag",
  "count": 3,
  "results": [
    {"tid": 12, "name": "Internet"},
    {"tid": 27, "name": "Internet 5G"}
  ]
}
```

---

## Screenshots (preview de módulos)

### `GET /api/screenshots/{module_name}`

**Sem auth** — pra que `<img src="...">` funcione direto no plugin Figma.

Retorna PNG do módulo (gerado via Playwright pelo Streamlit/Builder). 404 se não capturado ainda.

```html
<img src="https://api.tim-agentic-cms-api-dev.../api/screenshots/m13_conjunto_cta_padrao" />
```

### `GET /api/screenshots`

Lista todos screenshots disponíveis. Útil pra plugin saber o que existe.

```json
{
  "status": "success",
  "count": 32,
  "screenshots": [
    {
      "module_name": "m13_conjunto_cta_padrao",
      "size_bytes": 124823,
      "modified_at": "2026-05-06T10:30:00"
    }
  ]
}
```

---

## Pages (deploy via Figma)

### `POST /api/pages`

Cria/atualiza uma página Drupal a partir de payload Figma. Versão síncrona do `/jobs/figma-deploy`.

**Body:**
```json
{
  "target_nid": null,
  "module_name": "m13_conjunto_cta_padrao",
  "data": {"TXT_TITULO": "Hero", "BOOL_MOSTRAR_BOTAO": true},
  "env_host": "timbrasil.ambiteste@...",
  "env": "ambiteste"
}
```

`target_nid=null` → cria novo node. Caso contrário, atualiza o existente.

**Response:**
```json
{"status": "success", "new_nid": "61984"}
```

---

## Clones (preview/test environment)

### `GET /api/clones?env=`

Lista NIDs de clones de teste ativos no env.

```json
{"status": "success", "active_nids": ["61984", "61985"]}
```

### `POST /api/clones?env=`

Cria clones de teste com dados modificados.

**Body:**
```json
{
  "workspaces": { ... payload do canvas editor ... },
  "selected_nids": ["12345", "12346"],
  "env_host": "timbrasil.ambiteste@...",
  "env": "ambiteste"
}
```

### `DELETE /api/clones?env_host=&env=`

Deleta todos os clones registrados do env.

```bash
curl -X DELETE "$API/api/clones?env_host=...&env=ambiteste" -H "X-TIM-Key: $KEY"
```

---

## Admin

### `POST /api/admin/static-pages`

Enfileira geração de página estática (HTML+assets → Blob).

**Body:**
```json
{
  "nid": "12345",
  "source_path": "/faq/foo",
  "slug": "foo",
  "env_host": "timbrasil.ambiteste@...",
  "base_url": "https://timbrasilambiteste.prod.acquia-sites.com",
  "env": "ambiteste"
}
```

Retorna `{job_id}`.

### `POST /api/admin/drift-scan`

Enfileira scan de drift de componentes Cohesion.

**Body:**
```json
{
  "env": "ambiteste",
  "scope": ["components"],
  "ssh_host": "timbrasil.ambiteste@..."
}
```

### `GET /api/admin/drift?env=`

Último drift report.

### `GET /api/admin/drift/history?env=&limit=`

Histórico de scans (resumos, sem detalhe completo).

### `GET /api/admin/worker-stats`

Métricas agregadas dos jobs do worker.

```json
{
  "status": "success",
  "summary": {
    "deploy_figma": {"total": 47, "completed": 45, "failed": 2, "avg_time_seconds": 12.3},
    "static_page": {"total": 12, "completed": 12, "failed": 0, "avg_time_seconds": 8.4}
  },
  "recent_jobs": [...]
}
```

---

## Migration Map (old → new)

| Antigo (v1) | Novo (v2) | Notas |
|---|---|---|
| `POST /import` | `POST /jobs/import-workspace` | |
| `POST /deploy/test` | `POST /clones` | |
| `GET /deploy/test/clones` | `GET /clones` | |
| `DELETE /deploy/test/clean` | `DELETE /clones` | query `env_host` continua |
| `POST /deploy/figma` | `POST /jobs/figma-deploy` | |
| `GET /figma/templates` | `GET /templates` | |
| `GET /variants/templates` | `GET /templates?variants_only=true` | merged |
| `GET /variants/templates/{n}` | `GET /templates/{n}` | |
| `GET /figma/pull/{nid}?module_name=` | `GET /nodes/{nid}/sync-payload?module_name=` | sem `module_name` retorna página inteira |
| `POST /figma/page` | `POST /pages` | |
| `POST /admin/upload-template` | `POST /templates` (multipart) | |
| `POST /static-page/generate` | `POST /admin/static-pages` | |
| `POST /variants/preview` | `PUT /nodes/{nid}/canvas` | nid sai do path |
| `POST /variants/clear-preview` | `DELETE /nodes/{nid}/canvas` | |
| `GET /nodes/{nid}/content-type` | `GET /nodes/{nid}` | |
| `GET /debug/worker-stats` | `GET /admin/worker-stats` | |

**Endpoints novos (sem equivalente anterior):**
- `GET /references/nodes/{bundle}` — picker de entity_ref pra content_types
- `GET /references/taxonomy/{vocab}` — picker de termos
- `GET /screenshots/{module_name}` — PNG de preview (sem auth)
- `GET /screenshots` — lista de screenshots disponíveis
- `GET /nodes/{nid}/sync-payload` (sem `module_name`) — página inteira pra `syncPageFromPayload`

---

## Mudanças no schema de content_type

Após `regenerate_schemas_jsonapi.py` (rodar com `DRUPAL_USER` admin):

**`fields[*]` ganhou:**
- `drupal_type` — tipo Drupal real (ex: `boolean`, `list_string`, `entity_reference`)
- `cardinality` — `1` single, `-1` unlimited, `>1` bounded
- `is_multi` — derivado de cardinality
- `required` — autoritativo (vem do field_config, não inferido)
- `essential` — fill_rate ≥ 90% nos samples
- `label` — nome humano
- `allowed_values` — sempre que existir no Drupal

**`relationships[*]` ganhou:**
- `target_type` — `node|taxonomy_term|paragraph|...`
- `target_bundles` — lista de bundles (content_types ou vocabularies) que o ref aceita
- `cardinality`, `is_multi`, `required`, `essential`, `label`
- `taxonomy_options` — termos pré-carregados quando target é uma única taxonomia

Antes (v1): apenas `target_types: {}`, `is_multi_value`, `required_inferred`, `fill_rate`. Faltava o crítico (`target_bundles`), por isso o plugin não conseguia popular pickers de entity_ref.
