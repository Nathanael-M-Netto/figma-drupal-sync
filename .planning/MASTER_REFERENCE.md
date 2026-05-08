# MASTER REFERENCE — Figma → Drupal Sync Plugin
**Single Source of Truth — derived from `docs/API_REFERENCE.md` (v2) + `docs/CODE_ARCHITECTURE.md` (v4.0) + functional requirements (current cycle).**

> Ler este documento substitui ler os `.md` brutos. Ele é literal, não generaliza, não inventa contexto fora do que está nos `.md` listados acima ou na descrição funcional aprovada.

---

## 1. INTERPRETATION OF REQUIREMENTS

Reescrita técnica e estruturada da descrição funcional, sem alterar significado:

### 1.1 Settings Page
1. **API Key field** — atualmente renderizado como `<Input>` texto plano em [DevSettingsTab.jsx:93-97](src/ui/components/dev/DevSettingsTab.jsx:93). Requisito: `type="password"`. Persistência em `figma.clientStorage` permanece inalterada (o problema é apenas exposição visual).
2. **NID** — deve ser **per-file**, não global ao plugin. A camada sandbox já implementa isso via `figma.root.setPluginData('linked_nid', …)` em [main.js:43-57](src/plugin/main.js:43). Requisito: garantir que **nenhuma camada superior** (Settings page, Zustand stores, clientStorage) reintroduza um NID global. Cada arquivo Figma abre com seu próprio NID ou nenhum.
3. **Module Schema (manual)** — Settings expõe carga manual de schema por módulo. Funciona como **fallback** quando o scanner não consegue extrair dados do Figma (ex.: módulo com nomenclatura inválida). Persistência: `clientStorage` por arquivo, indexado por `module_name`.
4. **Local Sync** — unificação de variáveis entre layers que representam o mesmo conceito lógico em variantes Desktop/Mobile (ex.: `desk.title` ≡ `mobile.title`). O sistema deve unificar mesmo quando apenas uma das variantes existe.
5. **JSON Content Editor** — editor em massa em Settings que permite alterar valores de múltiplas variáveis de uma vez. Comportamento equivalente ao sync inicial automático ao abrir o plugin.

### 1.2 Scan Page
- O scanner precisa percorrer **todos os layers** de **todas as pages** do arquivo Figma (não apenas a `currentPage`).
- A identificação de módulos e fields ocorre **estritamente** pelos nomes dos layers (sem heurística visual).

### 1.3 Templates
- Os nomes de template apresentados na UI são insatisfatórios e devem seguir a lógica do `API_REFERENCE.md` (ver §3 NAMING SYSTEM).
- **Responsive Preview do template**: o preview interno (iframe) deve adaptar-se ao seu próprio tamanho:
  - iframe pequeno → render mobile-like.
  - iframe grande → render desktop-like (otimizar uso de espaço).
- **Interaction**: clicar no nome de uma propriedade copia o valor para o clipboard. Atualmente quebrado em [FieldList.jsx](src/ui/components/templates/FieldList.jsx) e [VariationCard.jsx](src/ui/components/templates/VariationCard.jsx). Deve ser corrigido.

### 1.4 Home / Deploy Flow (CRITICAL)
Clicar em **DEPLOY** deve:
1. Abrir uma **nova janela/modal** (resize do plugin para ≥460×800 ou modal in-iframe full-overlay).
2. Mostrar a **estrutura completa da página** (JSON mesclado de todos os módulos da page atual).
3. Mostrar **diferença visual**:
   - Módulos inalterados (cinza/recolhido).
   - Módulos modificados (cor distintiva, expandível).
   - Módulos novos (added) e removidos (deleted).
4. Permitir ao usuário: **deletar** componentes/módulos antes do envio; **editar** dados do módulo (confirmação final).
5. Clicar em um módulo expande e exibe **todas** as propriedades dele.
6. **Editable properties logic**:
   - Mostrar apenas propriedades **essenciais que NÃO vêm do Figma** (ex.: dropdowns específicos do content_type Drupal, ou um boolean `BOOL_FOTO_CIRCLE` no módulo `m13_…`).
   - Ignorar propriedades não-essenciais que não são extraídas do Figma.
7. **JSON RULE (CRITICAL)**:
   - O payload enviado **DEVE** representar a página inteira.
   - **NÃO** enviar JSON parcial.
   - Se apenas 1 módulo foi modificado, o sistema **DEVE** mesclar com o JSON completo da página antes de enviar — caso contrário Drupal apaga os outros módulos.

---

## 2. DATA FLOW DESIGN

Pipeline literal de ponta a ponta. Cada etapa especifica **input**, **processing**, **output**.

```
[Figma File] → SCAN → NORMALIZE → JSON BUILD → PULL → MERGE → DIFF → PREVIEW → DEPLOY → [Drupal Node]
```

### 2.1 SCAN (sandbox: `src/plugin/main.js`)
- **Input**: Figma document (todas as pages, todos os layers).
- **Processing**: traversal recursivo via `figma.root.children` → para cada `PageNode` chamar `buildModuleTree(page)`. Para cada módulo identificar subcamadas Desktop/Mobile (`_desk`/`_desktop`/`_mobile`/`_mob`) e construir `nodeMap` por prefixo de nome.
- **Output**: `pageScanReport = [{ pageName, modules: [{ moduleName, nodeId, y, order, sharedProps, deskOnlyProps, mobileOnlyProps, rawData }] }]`.

### 2.2 NORMALIZE (sandbox + `src/utils/nodeMapper.js`)
- **Input**: `pageScanReport`.
- **Processing**:
  1. Extrair valores brutos por prefix (`TXT_`, `BOOL_`, `URL_`, `VAR_`, `SLOT_`).
  2. Aplicar `colorMap.js` para `VAR_*` de cor → nome semântico Drupal.
  3. Aplicar regras de **Local Sync** (§5).
  4. Filtrar por nomes válidos cruzando com **catálogo de templates** (`GET /api/templates`).
- **Output**: `figmaPageData = { modules: [{ module_name: "m13_…", data: { TXT_…: "…", BOOL_…: true, URL_…: "https://…" }, _meta: { foundKeys, missingKeys, extraKeys, sharedProps, conflicts } }] }`.

### 2.3 JSON BUILD (UI: `src/utils/payloadBuilder.js` — NOVO)
- **Input**: `figmaPageData`.
- **Processing**: serializar para o formato esperado por `POST /api/pages` ou `PUT /api/nodes/{nid}/canvas`. Cada módulo do array é `{ module_name, data: {…} }`. Slots (`SLOT_*`) viram arrays de objetos aninhados.
- **Output**: `figmaFullPagePayload = { modules: [...] }`.

### 2.4 PULL (UI: `src/api/drupalClient.js`)
- **Input**: `linkedNid`, `apiKey`, `env`.
- **Processing**: `GET /api/nodes/{nid}/sync-payload?env={env}` (sem `module_name` → página inteira).
- **Output**: `drupalFullPagePayload = { modules: [...] }`.

### 2.5 MERGE (UI: `src/utils/pageMerger.js` — NOVO)
- **Input**: `figmaFullPagePayload`, `drupalFullPagePayload`.
- **Processing** (regra de fonte autoritativa):
  - Para cada módulo presente em **Figma**: usar dados do Figma (Figma é fonte de verdade quando o designer fez alterações).
  - Para cada módulo presente em **Drupal mas ausente em Figma**: manter dados do Drupal (não apagar o que o designer não mexeu).
  - Para cada módulo presente em **Figma mas ausente em Drupal**: marcar como `added`.
  - Ordem dos módulos: ordem visual do Figma (`order` por posição Y) prevalece para módulos presentes no Figma; módulos exclusivos do Drupal vão para o final.
- **Output**: `mergedFullPagePayload = { modules: [...] }` — **sempre** representa a página inteira.

### 2.6 DIFF (UI: `src/utils/pageDiffer.js` — NOVO)
- **Input**: `figmaFullPagePayload`, `drupalFullPagePayload`.
- **Processing**: por módulo, classificar status:
  - `unchanged` — todos os campos iguais.
  - `modified` — pelo menos 1 campo diferente.
  - `added` — só existe no Figma.
  - `removed` — só existe no Drupal (e usuário pode optar por mantê-lo).
- **Output**: `pageDiff = { perModule: { [module_name]: { status, fieldDiffs: [{ key, before, after, source }] } }, summary: { unchanged, modified, added, removed } }`.

### 2.7 PREVIEW (UI: `src/ui/components/deploy/DeployModal.jsx` — NOVO)
- **Input**: `mergedFullPagePayload`, `pageDiff`, `contentTypeSchema`, `essentialNonFigmaFields`.
- **Processing**: renderizar modal com seções: resumo, lista expansível de módulos, formulário para campos essenciais não-Figma, JSON viewer da página completa.
- **Output**: `userIntent = { keptModules: [...], editedModuleData: {...}, nonFigmaFieldValues: {...} }`.

### 2.8 DEPLOY (UI: `src/api/drupalClient.js`)
- **Input**: `userIntent`, `linkedNid`, `apiKey`, `env`, `env_host`.
- **Processing**: aplicar `userIntent` sobre `mergedFullPagePayload` → produzir `finalPayload` (sempre página inteira). Chamar:
  - **Update existente** (`linkedNid` presente): `POST /api/jobs/figma-deploy` para cada módulo em sequência **OU** (preferível) `POST /api/pages` com `target_nid` setado, enviando lista de módulos.
  - **Criar novo** (`linkedNid` ausente): `POST /api/pages` com `target_nid: null` → recebe `new_nid` → `setLinkedNid(new_nid)` no sandbox.
- **Output**: confirmação de sucesso + atualização do `linkedNid` no `pluginData` se `newPage`.

> **Nota crítica do JSON RULE (§1.4.7)**: a etapa MERGE existe **exatamente** para isso. Mesmo que o usuário tenha tocado em 1 só módulo, o `finalPayload` enviado contém os N módulos da página, dos quais N-1 vieram do `drupalFullPagePayload` originalmente.

---

## 3. NAMING SYSTEM

Regras estritas baseadas em `docs/API_REFERENCE.md` (templates schema) e `docs/CODE_ARCHITECTURE.md`.

### 3.1 Módulos
| Token | Pattern | Exemplo (literal de API_REFERENCE.md) |
|---|---|---|
| `module_name` | `m{NN}_{slug_underscore}` | `m13_conjunto_cta_padrao`, `m05_faq_sanfona` |
| `component_id` | `cpt_{slug}` | `cpt_conjunto_cta` |
| `variant_id` | `v{N}` | `v1`, `v2` |
| `canvas_field` | `field_{slug}` | `field_layout_canvas` |

**Regra**: o nome do Frame raiz no Figma DEVE ser igual a `module_name`. Variantes podem usar suffix `_v{N}` quando aplicável (`m13_conjunto_cta_padrao_v01`).

### 3.2 Propriedades de Módulo (layers internos)
| Prefix | Tipo Drupal correspondente | Comportamento no plugin |
|---|---|---|
| `TXT_` | `TEXT` / `text_long` / `string` | Editável como texto. Click no nome no Templates copia. |
| `BOOL_` | `BOOLEAN` | Toggle de visibilidade do nó. Drupal `boolean`. |
| `VAR_` | `VARIANT` (Figma) → `list_string` Drupal | Variante de componente. Mapeia via `colorMap` quando cor. |
| `URL_` | `URL` / `link` / `entity_reference (media)` | Link ou imagem. `URL_IMAGEM_*` é **a forma canônica de imagem** (não há binário; a API espera URL ou referência de media). Para preview, usar `GET /api/screenshots/{module_name}` (sem auth). |
| `SLOT_` | `paragraph` / multi-value | Lista repetível (ex.: `SLOT_ITENS_FAQ` em `m05_faq_sanfona`). Cada item é um objeto. |
| `MOD_` | (agrupador, não enviado) | Sub-módulo aninhado dentro de outro módulo. |
| `COMP_` | (agrupador interno) | Componente Figma interno; não é enviado como field próprio. |

**IMAGE HANDLING (literal do API_REFERENCE.md)**:
- O backend **não** aceita upload binário a partir do plugin.
- Imagens viajam como **URL** (`URL_*`) — o Drupal resolve para media reference internamente.
- Preview visual de módulos no plugin: `<img src="{base}/api/screenshots/{module_name}">` (sem auth).

### 3.3 Field Naming (Drupal-side, lido via `/content-types/{type}`)
- Sempre `field_*` (exceto `title`, `url_alias`, `metatags`, `drupal_status` que são meta).
- Tipos relevantes: `string`, `text_formatted`, `boolean`, `integer`, `list_string`, `entity_reference`.
- Atributos importantes a respeitar na UI (literal §156-249 API_REFERENCE.md): `essential`, `is_multi`, `cardinality`, `target_bundles`, `allowed_values`, `taxonomy_options`.

### 3.4 Tratamento de variantes não-nomeadas
Quando uma variante de Figma não tem nome convencional (ex.: `Variant 2`), interpretar e **renomear pela função** seguindo regras determinísticas:

1. Se o componente raiz casa com um `module_name` do catálogo: tentar inferir variante por **score de similaridade entre o conjunto de propriedades** versus `figma_component_schema` de cada `variant_id` retornado por `GET /api/templates?variants_only=true&component_id={cpt}`.
2. Se score ≥ 0.7 e único: renomear `Variant N` → `{module_name}_{variant_id}` (ex.: `m13_conjunto_cta_padrao_v1`).
3. Se score < 0.7 ou ambíguo: marcar como `__unmatched__` e exibir no scan report como warning. **Nunca** inventar nome silenciosamente.
4. Layers internas sem prefixo reconhecido: prefixar tentativamente com `TXT_` se for `TextNode`, `URL_` se `RectangleNode` com fill image, e propor renomeação ao usuário (não aplicar automaticamente).

---

## 4. SCAN ENGINE DESIGN

### 4.1 Traversal
- **Escopo**: todas as `PageNode` em `figma.root.children`. Iterar com `for…of` em ordem natural.
- **Por page**: `page.findAll(n => n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'INSTANCE')` filtrando apenas top-level (parent é PageNode).
- **Ignorar**: nós com nome iniciando em `#` (convenção existente, [nodeMapper.js](src/utils/nodeMapper.js)).
- **Performance**: traversal único por scan; sem chamadas API durante traversal. Fontes carregadas apenas no apply, não no read.

### 4.2 Module Detection
- Para cada candidato top-level, comparar `node.name` contra catálogo (`templatesIndex`) usando 3 estratégias em ordem:
  1. **Match exato** (`node.name === module_name`).
  2. **Match com sufixo de variante** (`node.name === '{module_name}_v{N}'`).
  3. **Match fuzzy por segmentos** (existente em `matchModuleToTemplate`).
- Resultado: `{ template, score, matchType: 'exact' | 'variant' | 'fuzzy' | 'none' }`.

### 4.3 Field Extraction
- Dentro de um módulo identificado:
  1. `findAll(child => /^(TXT_|BOOL_|URL_|VAR_|SLOT_|MOD_|COMP_)/.test(child.name))`.
  2. Detectar containers Desktop/Mobile (`name.endsWith('_desk') || _desktop || _mobile || _mob`).
  3. Construir `nodeMap` por nome (sem prefix de variante).
  4. Para `BOOL_*`: valor = `node.visible`.
  5. Para `VAR_*`: valor = `node.parent.componentProperties[propRef]?.value` quando dentro de instance, ou `colorMap.match(fillColor)` quando representa cor.
  6. Para `URL_*`: valor = primeira URL detectada em fills do tipo image, OU `node.fills[0].imageHash` resolvido para URL via metadata externa.
  7. Para `SLOT_*`: percorrer filhos diretos do container `SLOT_*` e construir array.

### 4.4 Output do Scanner
```
{
  pages: [
    {
      pageName: "Ofertas Móvel",
      modules: [
        {
          moduleName: "m13_conjunto_cta_padrao",
          nodeId: "1:23",
          matchType: "exact",
          y: 0, order: 0,
          sharedProps: { TXT_TITULO: "...", BOOL_MOSTRAR_BOTAO: true },
          deskOnlyProps: { URL_IMAGEM_DESKTOP: "..." },
          mobileOnlyProps: { URL_IMAGEM_MOBILE: "..." },
          conflicts: []
        }
      ]
    }
  ]
}
```

---

## 5. SYNC ENGINE DESIGN (Local Sync — MANDATORY)

### 5.1 Detecção de variáveis equivalentes
Duas layers são consideradas o **mesmo conceito lógico** se e somente se:
- Estão dentro do mesmo módulo (mesmo Frame raiz).
- Estão em containers Desktop/Mobile distintos (um ancestor com sufixo `_desk*` e outro com `_mobile`/`_mob`).
- Compartilham o mesmo nome (incluindo prefixo) **após remoção** de qualquer sufixo `_desktop|_desk|_mobile|_mob` interno ao próprio nome do nó.

Exemplo:
- `m13/desk_container/TXT_TITULO` ≡ `m13/mobile_container/TXT_TITULO` → **mesma variável** (chave canônica: `TXT_TITULO`).
- `m13/desk_container/URL_IMAGEM_DESKTOP` e `m13/mobile_container/URL_IMAGEM_MOBILE` → variáveis **diferentes** (chaves distintas, não colapsam).

### 5.2 Regras de Precedência
Aplicação ao construir o objeto `data` final do módulo:

| Caso | Regra | Resultado |
|---|---|---|
| Apenas Desktop tem valor | Promover Desktop | `data[key] = desk.value`. Mobile recebe via `componentPropertyReferences` (link nativo Figma). |
| Apenas Mobile tem valor | Promover Mobile | `data[key] = mobile.value`. Desktop linkado. |
| Ambos têm valor **idêntico** | Sem ação | `data[key] = desk.value`. Sem conflito. |
| Ambos têm valor **diferente** | **CONFLITO** | `data[key] = desk.value` (default), `_meta.conflicts.push({ key, desk, mobile })`. UI exibe ícone ⚠️ e oferece resolução manual. |
| Nenhum tem valor | Fallback | Tentar `moduleSchema.defaults[key]` (Settings). Se ausente, omitir do payload. |

### 5.3 Resolução de Conflito (UI)
Quando `_meta.conflicts.length > 0`, no Deploy Modal:
1. Renderizar bloco "⚠️ Conflitos de variantes" no topo do módulo afetado.
2. Por conflito: dois botões "Usar Desktop" / "Usar Mobile" + input para valor customizado.
3. Após resolução, `data[key]` é atualizado e o conflito removido.
4. Linkagem nativa (`componentPropertyReferences`) é re-aplicada para garantir que ambos os layers no Figma exibam o valor escolhido.

### 5.4 Quando aplicar Local Sync
- **Sempre** durante `read-full-page` (pré-deploy).
- **Sempre** durante `scan-and-load-props` (criação de component properties unificadas).
- **Manualmente** via botão "Sync Local" em Settings, agindo sobre a seleção atual.
- **Automaticamente** após `apply-sync-data` (sync inbound do Drupal): após escrever o valor em uma variante, propagar para a outra.

### 5.5 JSON Content Editor (Settings)
- Aceita JSON colado no formato `{ "module_name": { "key": "value", ... }, ... }`.
- Aplica via mesmo handler de `apply-sync-data`, mas com path explícito por módulo.
- Após apply, dispara Local Sync automaticamente para propagar valores entre desk/mobile.

---

## 6. TEMPLATE SYSTEM DESIGN

### 6.1 Naming Improvements
- Substituir labels atuais (genéricos) pelos campos canônicos do `GET /api/templates`:
  - Display principal: `component_title` (ex.: "Conjunto CTA").
  - Display técnico (mono): `module_name` (ex.: `m13_conjunto_cta_padrao`).
  - Display de variante: `variant_id` + `variant_count` + `variant_pct` ("v1 — 47 nodes (32%)").
- Quando o template não tiver `component_title`, derivar de `module_name` removendo `m{NN}_` e `_` → Title Case ("Conjunto CTA Padrao").

### 6.2 Responsive Iframe Behavior
- Container do preview observa seu próprio `clientWidth` via `ResizeObserver`.
- Breakpoint interno: `< 360px` → mobile preview; `≥ 360px` → desktop preview.
- Mobile: usar viewport simulado 375×portrait, screenshot via `/api/screenshots/{module_name}` reescalado.
- Desktop: viewport simulado ≥ 720px, screenshot fullbleed.
- Fonte do preview: `<img src="{API_BASE}/api/screenshots/{module_name}">` (sem auth, conforme API_REFERENCE.md §416-444). Caso 404, renderizar placeholder textual.

### 6.3 Click-to-copy (FIX)
- Atual: handler `onClick` em `FieldList.jsx` e `VariationCard.jsx` não escreve no clipboard ou está mal binded.
- Solução literal:
  - Cada nome de propriedade renderizado é um `<button>` com `onClick={() => navigator.clipboard.writeText(propName)}` + toast de confirmação.
  - Em valores de exemplo, mesma lógica.
  - Em nome do módulo (`module_name`), mesma lógica.
- Observação: dentro do iframe Figma o `navigator.clipboard.writeText` requer secure context — manifest já inclui `networkAccess`, e o iframe é `https`. Se falhar, fallback `document.execCommand('copy')` com textarea oculto.

---

## 7. DEPLOY SYSTEM DESIGN (DETAILED)

### 7.1 Modal Structure
Layout vertical (resize plugin para 460×800 ao entrar em deploy):

```
┌────────────────────────────────────────┐
│ Header: "Deploy → NID 140421" [X]      │
│ Tabs: [Diff] [JSON Completo] [Campos]  │
├────────────────────────────────────────┤
│ Summary chips:                          │
│  [12 unchanged] [3 modified]            │
│  [1 added]      [0 removed]             │
├────────────────────────────────────────┤
│ Module list (expansível):               │
│  ▸ m13_conjunto_cta_padrao [modified]   │
│      ↳ TXT_TITULO: "Old" → "New"        │
│      ↳ BOOL_FOTO_CIRCLE: false (essen.) │
│      [Editar] [Excluir do deploy]       │
│  ▸ m05_faq_sanfona [unchanged]          │
│  ▸ m02_hero_principal [added]           │
├────────────────────────────────────────┤
│ Non-Figma essential fields form:        │
│  - title (Drupal): [_______________]    │
│  - field_peso: [10]                     │
│  - field_tag: [Internet, Voz]           │
├────────────────────────────────────────┤
│ JSON viewer (página completa, readonly) │
│  [Copiar] [Baixar .json]                │
├────────────────────────────────────────┤
│ Footer: [Cancelar] [Confirmar Deploy]   │
└────────────────────────────────────────┘
```

### 7.2 JSON Merge Logic
Pseudocódigo formal (descritivo, não código executável):

1. `figmaPage = readFullPage()` (sandbox).
2. `drupalPage = await drupalClient.getSyncPayload(linkedNid)`.
3. `figmaModulesByName = indexBy(figmaPage.modules, 'module_name')`.
4. `drupalModulesByName = indexBy(drupalPage.modules, 'module_name')`.
5. Para cada chave em `union(figmaModulesByName.keys, drupalModulesByName.keys)`:
   - Se em ambos: `merged[name] = { module_name: name, data: figma.data, _status: deepEqual(figma.data, drupal.data) ? 'unchanged' : 'modified' }`.
   - Se só em Figma: `merged[name] = { module_name: name, data: figma.data, _status: 'added' }`.
   - Se só em Drupal: `merged[name] = { module_name: name, data: drupal.data, _status: 'removed' }` (preservado por padrão; usuário pode excluir).
6. Ordem final: ordem visual do Figma para módulos presentes; módulos `removed` no fim.
7. Ao confirmar deploy: filtrar `merged` removendo módulos que o usuário marcou para exclusão; serializar como `{ modules: [...] }`; enviar inteiro.

### 7.3 Diff Visualization Rules
- **Cor por status**: `unchanged` cinza, `modified` âmbar, `added` verde, `removed` vermelho.
- **Por field dentro de módulo modificado**: linha tipo `key: before → after`. Booleanos viram chips. Strings longas truncadas com tooltip.
- **Conflitos de variante** (vide §5.3): bloco destacado dentro do módulo com botões de resolução.
- **Toggle "mostrar inalterados"**: default `off` para reduzir ruído.

### 7.4 Edit / Delete System
- **Excluir módulo**: marca `__excluded__: true` em `userIntent.excludedModules`. Módulo permanece visível no modal mas riscado. Excluir um módulo `unchanged` mantém o módulo no payload final (porque o JSON precisa representar a página) — exclusão real significa "remover do JSON enviado", o que pode causar wipe parcial. **Default seguro**: o botão "Excluir do deploy" remove apenas as **alterações** desse módulo (revert para o valor do Drupal), não remove o módulo da página. Botão separado "Remover módulo da página" (destrutivo, com confirmação dupla) é o que de fato apaga.
- **Editar campos**: campos extraídos do Figma são read-only no modal (devem ser editados no Figma). Apenas **non-Figma essential fields** (Drupal `field_*` que não têm contraparte de layer) são editáveis no modal.

### 7.5 Editable Properties Logic (literal §1.4.6)
- Computar conjunto `editableInModal = essentialDrupalFields − figmaProvidedFields`.
- `essentialDrupalFields`: campos do `contentTypeSchema` com `essential: true`.
- `figmaProvidedFields`: chaves presentes em `figmaPage.modules[*].data`.
- Renderização por tipo Drupal (literal API_REFERENCE.md §244-250):
  - `string`/`text_formatted` → input/textarea.
  - `boolean` → toggle (caso `BOOL_FOTO_CIRCLE` no `m13_…` quando não vem do Figma).
  - `list_string` com `allowed_values` → select.
  - `entity_reference` com `target_bundles` → autocomplete via `GET /api/references/nodes/{bundle}`.
  - `taxonomy_term` → multi-select via `GET /api/references/taxonomy/{vocab}` (ou `taxonomy_options` pré-cacheado).
- Campos `essential: true` mas não-essenciais à modificação atual: ocultar.
- Campos não-essenciais que vêm do Figma: ignorar no modal (já estão no JSON via Figma).

### 7.6 Validation Rules
Antes de habilitar "Confirmar Deploy":
1. Todos os campos `required: true` do `contentTypeSchema` precisam ter valor (no Figma ou no formulário).
2. NID, quando presente, deve ser numérico e existir (`GET /api/nodes/{nid}` retornou 200 ao montar o modal).
3. `module_name` de cada módulo deve estar presente no catálogo (`templates`); módulos `unmatched` bloqueiam deploy.
4. Sem conflitos não-resolvidos (Local Sync §5.3).
5. JSON final < 256 KB (limite prudente; ajustar conforme observado).

### 7.7 Endpoints utilizados
- Update: `POST /api/pages` com `target_nid` setado (variante síncrona) **ou** `POST /api/jobs/figma-deploy` (assíncrona com job_id) — escolher síncrona como default e oferecer "deploy em background" quando JSON > 100 KB.
- Create: `POST /api/pages` com `target_nid: null`.
- Atualizar campos meta sem mexer no canvas: `PATCH /api/nodes/{nid}/fields`.
- Reset: `DELETE /api/nodes/{nid}/canvas` (apenas em modo dev).

---

## 8. STEP-BY-STEP IMPLEMENTATION PLAN

Fases ordenadas por dependência. Cada fase: **Objetivo**, **Entregas**, **Dependências**, **Riscos**.

### FASE A — Naming Alignment & Settings Hardening
**Objetivo**: alinhar UI ao naming do `API_REFERENCE.md` e corrigir buracos de Settings.
**Entregas**:
1. `DevSettingsTab.jsx` → API Key passa a `type="password"` com toggle "olho" para revelar.
2. Auditoria: confirmar que **nenhum** store/clientStorage global guarda NID; remover qualquer resíduo. NID lido apenas via mensagem `get-nid` que devolve `figma.root.getPluginData`.
3. Rebatizar todos os displays de template para `{component_title}` + `{module_name}` mono.
4. Estrutura de storage para Module Schema manual: `clientStorage['module_schemas'] = { [module_name]: schemaJson }`.
5. Fix click-to-copy em `FieldList.jsx` e `VariationCard.jsx` com fallback `execCommand`.
**Dependências**: nenhuma.
**Riscos**: regressão visual em Templates; mitigar com snapshot manual.

### FASE B — Scan Engine Cross-Page
**Objetivo**: scanner cobre todas as pages, não só a current.
**Entregas**:
1. `readFullPage()` em [main.js](src/plugin/main.js) passa a iterar `figma.root.children`.
2. `buildModuleTree(page)` em [nodeMapper.js](src/utils/nodeMapper.js) aceita argumento de page e é chamado em loop.
3. Output do scan agrupa por `pageName`.
4. UI do Scan Report renderiza accordion por page.
**Dependências**: A.
**Riscos**: performance em arquivos grandes; mitigar com indicador de progresso e early-exit por page.

### FASE C — Local Sync Engine
**Objetivo**: implementar regras §5 de unificação desk/mobile.
**Entregas**:
1. `nodeMapper.js`: novo `unifyDeskMobile(moduleData)` aplicando precedência §5.2.
2. Detecção de conflitos com `_meta.conflicts`.
3. Handler `sync-props-local` reaproveita `unifyDeskMobile` em vez da lógica atual.
4. `apply-sync-data` propaga via `componentPropertyReferences` após escrita.
5. JSON Content Editor em Settings: textarea + botão "Aplicar"; valida JSON; chama handler novo `apply-bulk-json`.
**Dependências**: B.
**Riscos**: divergência entre `componentPropertyReferences` existentes e novos; testar em arquivo com properties pré-existentes.

### FASE D — Pull / Merge / Diff utils (UI)
**Objetivo**: criar primitivos puros para deploy.
**Entregas**:
1. `src/utils/payloadBuilder.js` — serializa `figmaPage` para o formato `{ modules: [...] }`.
2. `src/utils/pageMerger.js` — implementa §2.5.
3. `src/utils/pageDiffer.js` — implementa §2.6.
4. Testes unitários (mesmo que via script standalone) com fixtures derivadas dos exemplos do `API_REFERENCE.md`.
**Dependências**: A. Usa endpoint `GET /api/nodes/{nid}/sync-payload` (já no `drupalClient` ou a adicionar).
**Riscos**: shape do payload divergir da API real; mitigar testando contra `https://tim-agentic-cms-api-dev…` antes de evoluir.

### FASE E — Templates Responsive Preview
**Objetivo**: preview iframe adapta a tamanho próprio.
**Entregas**:
1. `VariationCard.jsx` adquire `ResizeObserver` do container interno.
2. `<img src="{API_BASE}/api/screenshots/{module_name}">` substitui placeholder atual.
3. Lógica de breakpoint < 360px → mobile-cropped; ≥ 360px → desktop-fullbleed.
4. Fallback: 404 do screenshot endpoint → placeholder com instrução "screenshot ainda não capturado".
**Dependências**: A.
**Riscos**: CORS no endpoint de screenshot; verificado em API_REFERENCE.md como sem auth, mas precisa garantir no `manifest.json` `allowedDomains`.

### FASE F — Deploy Modal
**Objetivo**: tela de deploy literal §7.
**Entregas**:
1. `src/ui/components/deploy/DeployModal.jsx` — modal full-overlay (resize 460×800).
2. `DeployDiff.jsx` reaproveitado/refatorado para aceitar `pageDiff` no novo shape.
3. `NonFigmaFieldsForm.jsx` (renomear de `NodeFieldsForm.jsx`) — usa `editableInModal` (§7.5).
4. `JsonViewer.jsx` — read-only, syntax-highlight, copy/download.
5. `deployStore.js` — adicionar `mergedPayload`, `pageDiff`, `excludedModules`, `nonFigmaFieldValues`, `validation`.
6. Botão Deploy em `BoundState.jsx` abre o modal e passa `linkedNid`.
**Dependências**: B, C, D.
**Riscos**: ambiguidade na semântica "excluir módulo" (§7.4); resolver com 2 botões distintos.

### FASE G — Deploy Submission
**Objetivo**: submissão real do payload sempre completo.
**Entregas**:
1. `drupalClient.js` ganha `deployFullPage(nid, fullPayload, env_host, env)` → `POST /api/pages` (síncrono).
2. Fallback assíncrono: `submitDeployJob(payload)` → `POST /api/jobs/figma-deploy` + polling em `GET /api/jobs/{job_id}` até `done|failed`.
3. Após sucesso: `setLinkedNid(new_nid)` se `mode === 'newPage'`; toast verde; fechar modal.
4. Após falha: surface `error.detail` no modal; manter estado para retry.
**Dependências**: F.
**Riscos**: backend devolver shape de erro inesperado; tratar `{detail: string | {errors: []}}` defensivamente.

### FASE H — Validation & Polish
**Objetivo**: regras §7.6 e empty/loading/error states.
**Entregas**:
1. Implementar todas as 5 validações antes do Confirmar.
2. Skeleton loading no modal enquanto `getSyncPayload` não retorna.
3. Error boundary específico para o modal.
4. Telemetria local (console + log file) de cada deploy: `{nid, modules_count, status, duration}`.
**Dependências**: G.
**Riscos**: nenhum significativo; é polish.

### FASE I — Regression & Acceptance
**Objetivo**: validar fluxo end-to-end no Figma Desktop.
**Entregas**:
1. Checklist manual cobrindo cada item de §1 (Settings, Scan, Templates, Deploy).
2. Teste em arquivo real com NID existente (update) e sem NID (createPage).
3. Verificação de que o JSON enviado em update parcial **contém** módulos não modificados (consultar logs do middleware).
**Dependências**: H.
**Riscos**: descoberta tardia de divergência API/plugin; reservar buffer de tempo.

---

## 9. CROSS-CUTTING NOTES

### 9.1 Endpoint Map (atual → usado pelo plano)
- `GET /api/templates` (default e `?variants_only=true`) — catálogo.
- `GET /api/templates/{name}` — template completo (skeleton).
- `GET /api/content-types/{type}` — schema dos campos.
- `GET /api/nodes/{nid}` — info básica (validação de NID).
- `GET /api/nodes/{nid}/sync-payload` (sem `module_name`) — pull página inteira.
- `GET /api/nodes/{nid}/fields` — campos atuais (PATCH companion).
- `PATCH /api/nodes/{nid}/fields` — atualizar campos sem canvas.
- `POST /api/pages` — deploy síncrono (create ou update).
- `POST /api/jobs/figma-deploy` — deploy assíncrono.
- `GET /api/jobs/{job_id}` — status do job.
- `GET /api/screenshots/{module_name}` — preview PNG (sem auth).
- `GET /api/references/nodes/{bundle}` / `/api/references/taxonomy/{vocab}` — pickers.

### 9.2 Endpoints obsoletos a remover do código (vide Migration Map API_REFERENCE.md §566-585)
`/api/figma/templates`, `/api/figma/pull/{nid}`, `/api/figma/page`, `/api/variants/preview`, `/api/variants/clear-preview`, `/api/nodes/{nid}/content-type`, `/api/debug/worker-stats`. Substituir todas as chamadas em [drupalClient.js](src/api/drupalClient.js) e [templateClient.js](src/api/templateClient.js) pelos paths v2.

### 9.3 Auth Header
- Sempre `X-TIM-Key: {apiKey}` (literal API_REFERENCE.md §14).
- `apiKey` lida primeiro de `figma.clientStorage`, fallback para `import.meta.env.VITE_API_KEY`.
- Em Settings, salvar via handler `save-api-key` no sandbox.

### 9.4 Multi-env
- `env` ∈ `{ambiteste, stage, prod}`, default `ambiteste`.
- GET endpoints recebem `?env=`; POST/PUT/PATCH recebem `env` no body.
- Settings precisa de selector de env (chip group). Persistido em `clientStorage['env']` com default `ambiteste`.

### 9.5 Estados terminais conhecidos
- `linkedNid` válido + `apiKey` válida → fluxo normal.
- `linkedNid` ausente → UnboundState; deploy força modo `newPage`.
- `apiKey` ausente → bloqueia tudo exceto Settings.
- Module sem match no catálogo → bloqueia deploy do módulo (mas não da página inteira; permite excluir o módulo do payload).

---

## 10. DELIVERABLE CHECKLIST (uso futuro como SSOT)

Quando uma nova tarefa chegar, consultar nesta ordem:
1. §1 — está dentro do escopo aprovado?
2. §3 — naming alinhado ao API_REFERENCE?
3. §2 — em qual etapa do pipeline a tarefa se encaixa?
4. §5 — afeta Local Sync? aplicar regras de precedência.
5. §7 — afeta Deploy? respeitar JSON RULE (sempre página inteira).
6. §8 — qual fase do plano contém a entrega? quais dependências precisam estar resolvidas?

---
*Documento gerado a partir de `docs/API_REFERENCE.md` (v2, 2026-05) e `docs/CODE_ARCHITECTURE.md` (v4.0, 2026-05-06). Não cobre nada fora dessas fontes e da descrição funcional aprovada do ciclo atual.*
