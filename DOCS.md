# Documentação Técnica — Figma-Drupal Sync Plugin v2.0

Guia completo da arquitetura refatorada. O plugin foi migrado de um monolito (ui.html + code.ts) para uma arquitetura modular com **Vite + React**.

---

## Visão Geral da Arquitetura

O plugin opera em **duas camadas isoladas** que se comunicam via `postMessage`:

| Camada | Ambiente | Acesso à Rede | Arquivos |
|--------|----------|----------------|----------|
| **Sandbox** (`dist/code.js`) | Processo isolado do Figma | ❌ Não | `src/plugin/main.js`, `src/utils/*` |
| **UI** (`dist/index.html`) | iframe dentro do Figma | ✅ Sim | `src/ui/*`, `src/api/*` |

O sandbox lê/escreve nos nós do Figma mas **não pode fazer fetch**. A UI faz as requisições HTTP e repassa os dados para o sandbox via mensagens.

---

## Build System

### Duas Configurações Vite

#### `vite.config.js` — Build da UI

Usa `vite-plugin-singlefile` para gerar um único `index.html` com todo CSS e JS embutidos inline. O Figma exige que a UI seja um único arquivo HTML.

- **Input:** `index.html` → `src/ui/main.jsx` → React tree
- **Output:** `dist/index.html` (~167KB, tudo inline)
- **`emptyOutDir: true`** — limpa dist/ antes do build

#### `vite.config.plugin.js` — Build do Sandbox

Compila o backend como IIFE (o sandbox do Figma não suporta ES modules).

- **Input:** `src/plugin/main.js` → importa `nodeMapper.js` e `colorMap.js`
- **Output:** `dist/code.js` (~7.5KB, IIFE)
- **`emptyOutDir: false`** — não apaga o `index.html` já gerado

#### Ordem de Build

O script `npm run build` executa `build:ui` primeiro, depois `build:plugin`. A ordem é crítica porque `build:ui` limpa o `dist/` e `build:plugin` preserva o conteúdo existente.

---

## src/plugin/main.js — Backend Figma (Sandbox)

Roda no sandbox isolado do Figma. Não tem acesso a rede, DOM ou browser.

### Inicialização

```js
figma.showUI(__html__, { width: 460, height: 720 });
```

Na inicialização, o plugin:
1. Abre a UI com dimensões fixas
2. Envia o estado do NID para a UI (`sendNidState()`)
3. Recupera a API Key salva no `clientStorage` e envia para a UI
4. Registra listener de `selectionchange` para re-extrair dados automaticamente

### NID Persistence

| Função | Descrição |
|--------|-----------|
| `getLinkedNid()` | Lê NID de `figma.root.getPluginData('linked_nid')` |
| `setLinkedNid(nid)` | Salva NID no documento + notifica UI (`nid-saved`) |
| `clearLinkedNid()` | Remove NID + notifica UI (`nid-cleared`) |
| `sendNidState()` | Envia estado atual do NID para a UI |

O NID é salvo em `figma.root` (raiz do documento), portanto persiste entre sessões e é compartilhado por todas as páginas do arquivo Figma.

### Extração de Dados

#### `lerTextosDaTela()`

Entry point da extração. Chamada automaticamente a cada mudança de seleção via `figma.on('selectionchange')`.

1. Verifica se há seleção
2. Constrói o **nodeMap** via `buildNodeMap(selection)` — ★ multi-mapeamento
3. Se há schema carregado → `extractWithSchema(nodeMap, schema)`
4. Se não → `extractDataFromNodeMap(nodeMap)` (modo livre)
5. Envia resultado para a UI com `{ status: 'success', data, meta, moduleName }`

#### `readFullPage()`

Lê a página inteira (todos os top-level frames) e retorna árvore hierárquica de módulos ordenada por posição Y. Usado para deploy completo da página.

### Sync Reverso (Drupal → Figma)

#### `syncFromPayload(payload)`

Aplica dados do Drupal nos nós do Figma.

**★ Multi-mapeamento em ação:**
1. Para cada `key` no payload, busca **TODOS** os nós com `figma.currentPage.findAll(n => n.name === key)`
2. Itera sobre o **array inteiro** — atualiza Desktop, Mobile, e qualquer outra instância
3. Para cada TextNode, carrega a fonte necessária antes de alterar (`loadFontAsync`)
4. Suporta fontes mistas (mixed fonts)
5. Retorna contagem total de nós atualizados

#### `syncPageFromPayload(modules)`

Sync de página inteira. Recebe array de módulos e aplica `syncFromPayload` para cada um. Retorna contagem por módulo.

### Atualização de Propriedades

#### `atualizarPropriedades(schema)`

Injeta as propriedades do schema como `componentProperties` no Component selecionado:

1. Se o selecionado for um Frame, converte para Component via `convertFrameToComponent()`
2. Para cada propriedade do schema (exceto SLOT):
   - **TEXT:** Cria propriedade + tenta linkar ao TextNode filho com mesmo nome
   - **BOOLEAN:** Cria como toggle
   - **VARIANT:** Cria como TEXT com o primeiro valor das opções
3. Renomeia o Component para `schema.componentName`

### Message Handler

| Mensagem (UI → Sandbox) | Ação |
|--------------------------|------|
| `get-nid` | Envia estado do NID para a UI |
| `set-nid` | Salva NID no documento |
| `clear-nid` | Remove NID do documento |
| `load-schema` | Carrega schema + re-extrai dados |
| `clear-schema` | Remove schema + re-extrai dados |
| `update-props` | Injeta propriedades no Component |
| `run-sync-api` | Pede à UI que faça fetch de sync |
| `apply-sync-data` | Aplica dados do Drupal nos nós (★ multi-map) |
| `apply-sync-page` | Aplica dados de página inteira (múltiplos módulos) |
| `run-sync-manual` | Aplica JSON colado manualmente |
| `read-full-page` | Lê a página inteira para deploy hierárquico |
| `save-api-key` | Salva API Key no `clientStorage` |

---

## src/utils/nodeMapper.js — ★ Multi-Mapeamento

Este é o módulo mais crítico do plugin. Resolve o problema Desktop/Mobile.

### O Problema (v1.0)

Na versão monolítica, o código usava `findOne()` para buscar nós por nome. Se existiam dois nós com o mesmo nome (ex: `TXT_TITULO` no Desktop e no Mobile), apenas o primeiro era encontrado. O segundo era silenciosamente ignorado.

### A Solução (v2.0)

`buildNodeMap()` percorre a árvore recursivamente e agrupa **todos** os nós pelo nome em um `Map<string, SceneNode[]>`:

```
TXT_TITULO    → [TextNode(Desktop), TextNode(Mobile)]
TXT_SUBTITULO → [TextNode(Desktop), TextNode(Mobile)]
VAR_CORES     → [FrameNode(Desktop), FrameNode(Mobile)]
```

### Funções Exportadas

#### `buildNodeMap(rootNodes) → Map<string, SceneNode[]>`

Percorre recursivamente todos os filhos e agrupa nós pelo `node.name.trim()`. Cada nome mapeia para um **array** de nós.

#### `buildModuleTree(page) → Array<Module>`

Lê a página inteira do Figma e retorna módulos na **ordem visual** (sorted by Y position, de cima para baixo):

1. Filtra top-level children que sejam FRAME, COMPONENT ou INSTANCE
2. Ordena por `node.y` (ascending)
3. Para cada frame, constrói nodeMap e extrai dados
4. Retorna array com `{ name, order, y, nodeId, nodeMap, data }`

#### `extractDataFromNodeMap(nodeMap) → Object`

Extração em modo livre (sem schema). Regras:
- **Textos:** Nomes em `CAIXA_ALTA` com `_` → extrai `node.characters`
- **Componentes:** Prefixo `MOD_`, `COMP_`, ou contendo "botao" → extrai component properties
- **Cores:** Prefixo `VAR_CORES` → extrai cor mapeada via `extractMappedColor()`
- Converte strings `"true"`/`"false"` para boolean automaticamente

#### `extractWithSchema(nodeMap, schema) → { data, meta }`

Extração guiada pelo schema. Para cada propriedade definida:
- **TEXT:** Busca TextNode pelo nome, fallback para component properties
- **BOOLEAN:** Busca component property BOOLEAN
- **VARIANT:** Para `VAR_CORES_*`, extrai cor; para outros, busca em component properties
- Retorna `meta` com `{ type, found }` para cada propriedade

#### `applyTextToNode(node, value) → Promise<boolean>`

Atualiza o conteúdo de um TextNode:
1. Verifica se é tipo TEXT
2. Se a fonte é uniforme, carrega com `loadFontAsync(node.fontName)`
3. Se tem fontes mistas, carrega cada fonte character-by-character
4. Seta `node.characters = String(value)`

---

## src/utils/colorMap.js — Mapeamento de Cores

#### `COLOR_MAP`

Tabela estática HEX → string Drupal:

| HEX | Drupal | HEX | Drupal |
|-----|--------|-----|--------|
| `FFFFFF` | `white` | `000A3D` | `dark_blue` |
| `000000` | `black` | `0041E6` | `blue` |
| `F2F2F2` | `grey` | `FF0000` | `red` |

#### `rgbToHex(r, g, b) → string`

Converte RGB float (0–1, formato do Figma) para string HEX maiúscula. Multiplica cada canal por 255.

#### `extractMappedColor(node) → string`

Lê o primeiro fill sólido do nó e traduz via `COLOR_MAP`. Retorna `"transparent"` se não há fill ou `"cor_nao_mapeada_XXXXXX"` se a cor não está na tabela.

---

## src/api/drupalClient.js — Cliente de API

Roda na UI (iframe). Implementa a **Regra de Ouro**: evitar múltiplas requisições.

### `createDrupalClient(apiKey) → client`

Factory que retorna um objeto com métodos de API. Todos os métodos usam o wrapper interno `request()` que:
- Injeta header `X-TIM-Key` automaticamente
- Valida presença da API Key antes de cada chamada
- Lê body de erro do servidor para mensagens descritivas
- Detecta erros de rede (DNS, conexão) com mensagem amigável

### Métodos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `deployPage(nid, modules)` | `POST /api/figma/page` | ★ Envia **todos** os módulos em um único POST |
| `deployModule(nid, name, data)` | `POST /api/figma/page` | Fallback: envia um módulo por vez |
| `syncPage(nid, moduleName?)` | `GET /api/figma/pull/{nid}` | ★ Busca JSON completo em um único GET |
| `createPage(name, data)` | `POST /api/figma/page` | Cria página nova (sem NID) |
| `fetchSchema(moduleName)` | `GET /api/figma/templates` | Busca schema de módulo |

### Payloads

**Deploy hierárquico (★ chamada única):**
```json
{
  "target_nid": "140421",
  "modules": [
    { "module_name": "modulo_hero", "order": 0, "data": { "TXT_TITULO": "Olá" } },
    { "module_name": "modulo_cards", "order": 1, "data": { "TXT_CARD_1": "Card" } }
  ]
}
```

**Deploy módulo único (compatibilidade):**
```json
{
  "target_nid": "140421",
  "module_name": "modulo_hero",
  "data": { "TXT_TITULO": "Olá" }
}
```

---

## src/ui/ — Interface React

### Entry Point

`main.jsx` monta `<App />` no `#root` com `React.StrictMode`.

### App.jsx — Componente Raiz

Orquestra a comunicação entre o hook `useFigmaMessages` e o `drupalClient`. É a "ponte" entre o sandbox (que não pode fazer HTTP) e a API do Drupal.

**Responsabilidades:**
- Gerencia estado de abas (Designer / Dev)
- Instancia `createDrupalClient(apiKey)` via `useMemo`
- Escuta o evento `do-sync-fetch` do sandbox e executa o fetch via `client.syncPage()`
- Implementa todos os handlers de ação (deploy, sync, bind NID, schema, etc.)
- Implementa `downloadJSON()` para backup local
- Implementa `buildCleanData()` para filtrar nulls antes de enviar

### useFigmaMessages.js — Hook de Comunicação

Hook React que gerencia toda comunicação bidirecional com o sandbox.

**Estado reativo:**

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `linkedNid` | `string \| null` | NID vinculado ao arquivo |
| `apiKey` | `string` | Chave de autenticação |
| `extractedData` | `Object` | Dados extraídos da seleção atual |
| `currentMeta` | `Object \| null` | Metadados (tipo + found) por propriedade |
| `currentModuleName` | `string` | Nome do módulo selecionado |
| `schemaStatus` | `{ loaded, name, propCount }` | Estado do schema |
| `status` | `{ text, type, visible }` | Status bar global |
| `pageModules` | `Array` | Módulos da página inteira |

**Ações exportadas:** `bindNid`, `clearNid`, `loadSchema`, `clearSchema`, `updateProps`, `requestSync`, `applySyncData`, `applySyncManual`, `saveApiKey`, `readFullPage`, `showStatus`, `hideStatus`, `buildCleanData`, `onceMessage`

**Mensagens tratadas (Sandbox → UI):**

| Mensagem | Efeito no Estado |
|----------|------------------|
| `nid-state` / `nid-saved` | Atualiza `linkedNid` |
| `nid-cleared` | Seta `linkedNid = null` |
| `init-api-key` | Atualiza `apiKey` |
| `schema-status` | Atualiza `schemaStatus` |
| `status: 'success'` | Atualiza `extractedData`, `currentMeta`, `currentModuleName` |
| `status: 'error'` | Mostra erro no `status` |
| `update-done` | Mostra resultado da injeção de props |
| `sync-done` | Mostra contagem de campos atualizados |
| `page-modules` | Atualiza `pageModules` |

### Componentes

#### `TabBar.jsx`

Barra de abas (Designer / Dev Settings). A aba Dev tem border-bottom roxo via classe `.active-dev`.

#### `DesignerTab.jsx`

Dois estados visuais:

**Unbound (sem NID):**
- Card "Página Nova" com botão deploy (borda roxa)
- Área central com campo para digitar NID + botão "Vincular e Continuar"

**Bound (com NID):**
- Header com badge do NID
- Module chip com nome do módulo selecionado
- PropertyList com dados extraídos
- Botões: Deploy, Sync, Download JSON

#### `DevSettingsTab.jsx`

Seções:
1. **NID Binding** — Badge do NID, campo para forçar NID, botão desvincular
2. **Autenticação** — Campo de API Key (type=password)
3. **Schema de Módulos** — Indicador de modo, busca na API, carregar JSON manual, injetar props
4. **Conteúdo JSON** — Abre modal para sync manual via JSON
5. **Preview de Extração** — PropertyList, campo de NID override, botões deploy/download

Inclui dois modais inline (Schema e JSON de Conteúdo) usando o componente `Modal`.

#### `NidBadge.jsx`

Badge com dot animado (pulse) e texto `NID {nid}`. Suporta variante `small` para a aba Dev.

#### `PropertyList.jsx`

Renderiza `data` como lista com badges de tipo (TEXT verde, BOOLEAN azul, VARIANT roxo). Valores null são exibidos como `[N/A]` em vermelho. Objetos são serializados como JSON.

#### `StatusBar.jsx`

Barra de status com três variantes: `info` (azul), `success` (verde), `error` (vermelho). Animação `fadeIn`.

#### `Modal.jsx`

Modal genérico com backdrop blur, overlay click-to-close, e animação `slideUp`. Props: `show`, `onClose`, `title`, `description`, `children`.

### App.css — Design System

CSS que usa **variáveis nativas do Figma** (`--figma-color-bg`, `--figma-color-text`, etc.) para que o plugin se adapte ao tema claro/escuro do usuário. Fallbacks em cores escuras para preview fora do Figma.

---

## Fluxos de Dados

### 1. Extração (seleção muda no Figma)

```
Figma: selectionchange
  → main.js: lerTextosDaTela()
    → nodeMapper.js: buildNodeMap(selection)  ★ agrupa nós por nome
    → nodeMapper.js: extractDataFromNodeMap() ou extractWithSchema()
  → main.js → UI: { status: 'success', data, meta, moduleName }
    → useFigmaMessages: setExtractedData(), setCurrentModuleName()
      → React re-render: PropertyList atualiza
```

### 2. Deploy (Figma → Drupal)

```
UI: usuário clica "Deploy"
  → App.jsx: handleDeploy()
    → drupalClient.js: deployModule(nid, name, data)  ★ chamada única
      → fetch POST /api/figma/page
    → API responde { target_nid }
  → App.jsx: figma.bindNid(nid) se necessário
    → useFigmaMessages: postToFigma({ type: 'set-nid' })
      → main.js: setLinkedNid()
```

### 3. Sync (Drupal → Figma)

```
UI: usuário clica "Sync"
  → App.jsx: handleSync()
    → useFigmaMessages: postToFigma({ type: 'run-sync-api', nid })
      → main.js: postMessage({ type: 'do-sync-fetch', nid })
        → App.jsx: useEffect listener
          → drupalClient.js: syncPage(nid)  ★ chamada única
            → fetch GET /api/figma/pull/{nid}
          → App.jsx: postToFigma({ type: 'apply-sync-data', data })
            → main.js: syncFromPayload(data)  ★ multi-mapeamento
              → findAll(n => n.name === key)  ★ array de nós
              → applyTextToNode() para CADA nó do array
            → main.js → UI: { type: 'sync-done', updatedCount }
```

### 4. Sync Manual (JSON colado)

```
UI: usuário cola JSON no modal
  → DevSettingsTab: onApplyManualJson(data)
    → useFigmaMessages: postToFigma({ type: 'run-sync-manual', data })
      → main.js: syncFromPayload(data)  ★ mesmo fluxo do sync API
```

---

## Referência de Erros — Deploy & Sync API

| Status | Nome | Causa Provável |
|--------|------|----------------|
| **400** | Bad Request | JSON mal-formado ou campos obrigatórios ausentes |
| **401** | Unauthorized | API Key não enviada ou inválida |
| **403** | Forbidden | Sem permissão para editar o conteúdo |
| **404** | Not Found | NID não existe ou endpoint incorreto |
| **405** | Method Not Allowed | Método HTTP incorreto |
| **422** | Unprocessable Entity | Dados não passam na validação do servidor |
| **429** | Too Many Requests | Rate limiting — aguardar e tentar novamente |
| **500** | Internal Server Error | Bug no servidor |
| **502** | Bad Gateway | Backend indisponível (reiniciando) |
| **503** | Service Unavailable | Servidor fora do ar |

### Causas comuns do 422

| Causa | Solução |
|-------|---------|
| `module_name` inválido | Verificar nome exato no Drupal |
| `data` vazio | Verificar se módulo está selecionado no Figma |
| Campo desconhecido em `data` | Conferir nomes das camadas vs field names do Drupal |
| Tipo de valor incorreto | Revisar conversão (string vs boolean) |
| Valor fora das opções | Verificar `COLOR_MAP` e adicionar cor faltante |
| `cor_nao_mapeada_XXXXXX` | Adicionar cor ao mapeamento em `colorMap.js` |

### Como Debugar

1. **Ver o payload:** Na aba Dev Settings, clique "JSON" para baixar o payload
2. **Console do Figma:** Menu → Plugins → Development → Open Console
3. **Testar fora do Figma:** Copie o JSON e envie via curl/Postman
4. **O `drupalClient.js` já lê o body de erro** e exibe na status bar
