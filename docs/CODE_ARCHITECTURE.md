# Project Map — Figma-Drupal Sync v4.0

Documento mestre do projeto: arquitetura, telas, fluxos, decisões, roadmap, verificação, segurança e design system.

---

## 📋 Visão Geral

Plugin Figma que conecta designers e desenvolvedores ao CMS Drupal+Cohesion, permitindo sincronização bidirecional de conteúdo, deploy de páginas, e gerenciamento de módulos — tudo de dentro do Figma.

**Stack**: React 18 + Vite + Zustand + Framer Motion  
**Ambiente**: Plugin Figma (iframe Chromium isolado)  
**Backend**: Azure Container Apps (middleware Node.js → Drupal)  
**Versão atual**: v3.0 (Fases 1-4 concluídas) → evoluindo para v4.0

---

## 🏗️ Core & Entry Points

| Arquivo | Função |
| :--- | :--- |
| `manifest.json` | Configuração do Figma. Define permissões de rede (`networkAccess.allowedDomains`) e aponta para `dist/`. |
| `index.html` | Template HTML com div `#root` para o React. |
| `package.json` | Dependências e scripts (`build:ui`, `build:plugin`, `dev`). |
| `vite.config.js` | Build da UI → `dist/index.html` com CSS/JS inline (singlefile). |
| `vite.config.plugin.js` | Build do Plugin → `dist/code.js` (IIFE para sandbox Figma). |
| `.env` | `VITE_API_KEY` e `VITE_API_URL` (build time). |

---

## 🛠️ Backend do Plugin (Sandbox)

| Arquivo | Função |
| :--- | :--- |
| `src/plugin/main.js` | **O Cérebro do Plugin.** Roda no sandbox isolado do Figma. Sem acesso à rede/DOM. Responsável por: NID persistence, extração de dados, sync reverso, multi-mapeamento Desktop/Mobile, scan de página, e property loading com linking. |

### Regras do Sandbox
- **SEM acesso à rede** — todas as chamadas API ocorrem na UI (React)
- **Comunicação**: `figma.ui.postMessage()` ↔ `window.onmessage`
- **Persistência**: `figma.root.setPluginData()` (NID) + `figma.clientStorage` (sessão, API Key)
- **Resize**: UI deve enviar `postMessage({ type: 'resize-ui', width, height })` ao trocar de tela

### Handlers de Mensagem (main.js)

| Handler | Ação |
| :--- | :--- |
| `get-nid` / `set-nid` / `clear-nid` | CRUD do NID no documento Figma |
| `load-schema` / `clear-schema` | Gerencia schema de módulo para extração guiada |
| `update-props` | Injeta component properties no componente Figma selecionado |
| `apply-sync-data` | Aplica dados recebidos da API nos nós de texto |
| `run-sync-manual` | Sync manual via JSON colado |
| `sync-props-local` | Sync local Desktop↔Mobile nos nós selecionados |
| `read-full-page` | Lê página inteira para payload hierárquico de deploy |
| `scan-and-load-props` | **[v4.0]** Escaneia tudo, faz match com catálogo, cria properties e linka Desktop↔Mobile |
| `full-page-scan-report` | **[v4.0]** Scan somente-leitura para preview |
| `auto-sync-check` | **[v4.0]** Enviado na inicialização se NID existir |
| `save-session` / `get-session` / `clear-session` | Persistência de auth no clientStorage |
| `resize-ui` | Redimensiona iframe do plugin |
| `save-api-key` | Persiste API Key no clientStorage |

---

## 🎨 UI Core (React)

| Arquivo | Função |
| :--- | :--- |
| `src/ui/main.jsx` | Ponto de entrada React. Monta `<App />`. |
| `src/ui/App.jsx` | **Orquestrador da UI.** Rotas, auth guards, auto-sync, deploy handlers, e renderização de telas. |
| `src/ui/App.css` | **Design System.** Variáveis CSS, Glassmorphism, classes globais, responsividade. (~1450 linhas) |

---

## 💾 State Management (Zustand)

Localizados em `src/ui/stores/`:

| Store | Estado |
| :--- | :--- |
| `authStore.js` | `user` (id, name, email, role: 'ux'\|'dev'), `token`, `apiKey`, `isAuthenticated` |
| `appStore.js` | `currentScreen`, `previousScreen`, `toasts[]`, `isLoading`. Inclui `SCREEN_SIZES` para resize automático. |
| `scanStore.js` | `status` (idle→scanning→validating→done), `modules[]`, `report`, `jsonPreview`, `progress` |
| `templateStore.js` | `templates[]`, `searchQuery`, `typeFilter`, cache com TTL de 1h |
| `deployStore.js` | **[v4.0 Fase 8]** Estado do deploy: modo, diff, campos do content-type |

---

## 🌐 API Layer

Localizados em `src/api/`:

| Arquivo | Função |
| :--- | :--- |
| `authClient.js` | Login/logout com mock (UX: user/12345, DEV: dev/12345). Pronto para auth real quando backend implementar. |
| `drupalClient.js` | Cliente principal: `deployModule()`, `deployPage()`, `createPage()`, `syncPull()`. Implementa Single-Call Deploy via `/api/variants/preview`. |
| `templateClient.js` | `fetchTemplates()`, `fetchTemplateByName()`. Normaliza respostas complexas do Drupal. |

### Endpoints Disponíveis

| Endpoint | Método | Uso |
| :--- | :--- | :--- |
| `/api/variants/templates` | GET | Lista todos módulos + variantes |
| `/api/variants/templates/{name}` | GET | Template completo com `figma_properties`, `figma_component_schema`, `drupal_skeleton` |
| `/api/figma/templates` | GET | Schemas mínimos para injeção no Figma |
| `/api/figma/pull/{nid}` | GET | Sync: ler valores atuais do Drupal |
| `/api/figma/page` | POST | Deploy: escrever canvas no Drupal |
| `/api/variants/preview` | POST | Deploy unificado: canvas + `node_field_values` |
| `/api/nodes/{nid}/content-type` | GET | Descobrir tipo do NID |
| `/api/content-types/{type}` | GET | Schema dos campos do content type |

### Endpoints Futuros (solicitados ao backend)
- `/api/auth/*` — Auth real com JWT
- Listagem de NIDs de FAQs/Ofertas com nomes para busca funcional
- `Field_tag` como checkbox no plugin
- Campos essenciais marcados nos templates
- Foto/preview de variantes
- Translate de JSONs API↔Plugin

### Autenticação
- **Atual**: Mock — header `X-TIM-Key` com API Key do `.env` ou `clientStorage`
- **Futuro**: `Bearer Token` (JWT) com refresh token. Endpoints `/api/auth/login`, `/refresh`, `/logout`.

---

## 🧠 Business Logic & Utils

Localizados em `src/utils/`:

| Arquivo | Função |
| :--- | :--- |
| `nodeMapper.js` | **Lógica Crítica.** `buildNodeMap()`, `buildModuleTree()`, `extractDataFromNodeMap()`, `extractWithSchema()`, `applyTextToNode()`. **[v4.0]**: `matchModuleToTemplate()`, `identifySharedProps()`, `buildFullPageScanReport()`. |
| `colorMap.js` | Converte cores float do Figma (0-1) para nomes semânticos do Drupal (ex: "azul-escuro"). |
| `scanValidator.js` | Valida prefixos (`TXT_`, `MOD_`, `BOOL_`, `VAR_`, `URL_`), cruza com catálogo de templates. |
| `essentialFields.js` | **[v4.0 Fase 10]** Mapeamento de campos Drupal → layers Figma. Auto-detecção com fallback manual. |

### Convenção de Nomenclatura de Layers

| Prefixo | Tipo | Exemplo |
| :--- | :--- | :--- |
| `TXT_` | Texto editável | `TXT_TITULO`, `TXT_DESCRICAO` |
| `BOOL_` | Toggle (visibilidade) | `BOOL_MOSTRAR_BOTAO` |
| `VAR_` | Variante de componente | `VAR_COR_FUNDO` |
| `URL_` | Link / imagem | `URL_IMAGEM_DESKTOP`, `URL_BUTTON_MOBILE` |
| `MOD_` | Módulo (agrupador) | `MOD_HERO_PRINCIPAL` |
| `COMP_` | Componente interno | `COMP_CARD_ITEM` |

### Multi-Mapeamento Desktop/Mobile
- Dentro de um módulo, subcamadas com sufixo `_desk`/`_desktop` e `_mobile`/`_mob` são detectadas
- Props com **mesmo nome** em ambos → linkadas a UMA ÚNICA component property
- Alterar TXT_TITULO no desktop altera automaticamente no mobile (Figma nativo via `componentPropertyReferences`)
- Props únicas (ex: `URL_BUTTON_MOBILE`) → property individual

---

## ⚓ Hooks Customizados

Localizados em `src/ui/hooks/`:

| Hook | Estado / Função |
| :--- | :--- |
| `useFigmaMessages.js` | `linkedNid`, `extractedData`, `currentModuleName`, `schemaStatus`, `pageModules`. **[v4.0]**: `syncStatus`, `syncDiff`, `autoSyncNid`, `setSyncResult()`. Gerencia toda comunicação React↔Sandbox. |
| `useAuth.js` | `login()`, `logout()`, `checkSession()`, `isDevRole`. Restaura sessão do clientStorage. |
| `useScan.js` | `runScan()`, `processModules()`, `deployFullPage()`. Cruza scan com catálogo, gera relatório. |
| `useTemplates.js` | `loadTemplates()`, `loadVariation()`, `downloadSchema()`. Cache com TTL. |

---

## 🧱 Componentes de UI

Divididos por contexto em `src/ui/components/`:

### `auth/`
| Componente | Função |
| :--- | :--- |
| `LoginScreen.jsx` | Tela de login com username/senha. Logo, form, footer. Mock auth com roles UX/DEV. |

### `home/`
| Componente | Função |
| :--- | :--- |
| `BoundState.jsx` | Home com NID vinculado. NID badge, **[v4.0]** sync banner (checking/synced/outdated/error), módulo selecionado, PropertyList, ações (Deploy, Sync, Scan, Templates, JSON). |
| `UnboundState.jsx` | Home sem NID. CTA para vincular NID existente ou criar página nova. |

### `layout/`
| Componente | Função |
| :--- | :--- |
| `Header.jsx` | Avatar com iniciais, nome, role badge (UX azul / DEV roxo), botão logout. |
| `NavBar.jsx` | Navegação fixa no rodapé: Home, Scan, Templates (DEV), Settings (DEV). |
| `ResizableContainer.jsx` | Container redimensionável com handle de drag. |

### `scan/`
| Componente | Função |
| :--- | :--- |
| `ScanReport.jsx` | Relatório do scanner: resumo (OK/WARN/FAIL), lista de módulos, JSON preview, deploy em massa. |
| `ModuleStatusItem.jsx` | Item individual do relatório com status, sugestões, campos faltantes. |
| `JsonPreview.jsx` | Preview do JSON que será enviado no deploy, com botão copiar. |
| `PropertyLoadingWizard.jsx` | **[v4.0]** Wizard de setup: Scan → Review matches → Carregar props → Done. |

### `templates/`
| Componente | Função |
| :--- | :--- |
| `TemplateList.jsx` | **[v4.0]** Catálogo como MAPA DE REFERÊNCIA. Stats header, expand/collapse all, usage guide, prop counts por módulo. |
| `VariationCard.jsx` | **[v4.0]** Guide steps ("1. Renomeie o Frame..."), copy-all-props, preview placeholder, type badges. |
| `FieldList.jsx` | **[v4.0]** Ícones por tipo (📝/🔘/🎨/🔗), copy-to-clipboard em cada propriedade. |
| `TemplateSearch.jsx` | Busca com debounce + filtros por tipo (hero, cards, banner). |

### `shared/`
| Componente | Função |
| :--- | :--- |
| `ProgressBar.jsx` | Barra de progresso com variantes (brand/success/purple) e modo indeterminado. |
| `Toast.jsx` | Sistema de notificações (success/error/info/warning) com auto-dismiss. |

### Componentes raiz (em `components/`)
| Componente | Função |
| :--- | :--- |
| `DevSettingsTab.jsx` | Aba exclusiva DEV: NID binding, API Key, Schema management, JSON de conteúdo, preview de extração. |
| `NidBadge.jsx` | Badge com NID, dot pulsante verde, fonte mono. |
| `PropertyList.jsx` | Lista de propriedades extraídas com type badges (TEXT/BOOLEAN/VARIANT/SLOT). |
| `StatusBar.jsx` | Barra de status contextual (info/success/error). |
| `Modal.jsx` | Modal genérico com overlay blur. |

---

## 🖥️ Telas & Navegação

### Telas Existentes (v3.0)

| Tela | Rota | Resize (w×h) | Acesso |
| :--- | :--- | :--- | :--- |
| Login | `login` | 400×520 | Todos |
| Home (Bound) | `home` | 460×620 | Autenticado |
| Home (Unbound) | `home` | 460×520 | Autenticado |
| Templates | `templates` | 460×680 | DEV only |
| Scan | `scan` | 460×700 | Autenticado |
| Settings | `settings` | 460×720 | DEV only |

### Telas Novas (v4.0)

| Tela | Rota | Resize | Fase | Status |
| :--- | :--- | :--- | :--- | :--- |
| Deploy (Confirmação) | `deploy` | 460×750 | 8 | 🔴 Pendente |
| Inspeção de Módulos | `inspect` | 460×680 | 9 | 🔴 Pendente |

### Fluxo Principal

```
Plugin Abre → Tem sessão? → [Não] → Login → [OK] → Tem NID?
                             [Sim] ────────────────→ Tem NID?
    [Sim] → Auto-Sync → Home (Bound) → Seleciona Layer → Inspeção
    [Não] → Home (Unbound) → Vincular NID ou Criar Página
```

---

## 🔄 Fluxos Críticos v4.0

### Fluxo A — First-Time Property Loading (Setup Inicial)

Acontece **uma vez** quando o dev configura um novo arquivo Figma:

1. Dev abre plugin → aba **Templates**
2. Vê todos os módulos e variantes com propriedades esperadas
3. Usa como referência para renomear layers no Figma
4. Renomeia Frame pai como `m01_hero_destaque_full_image_v01`
5. Renomeia layers internas com prefixos corretos
6. Clica **"Escanear & Carregar Propriedades"**
7. Plugin escaneia TODO o Figma:
   - Encontra frames cujo nome bate com algum template
   - Identifica subcamadas `_desk` e `_mobile`
   - Props duplicadas (TXT_TITULO em desk E mobile) → **UMA ÚNICA component property**, ambos linkados
   - Props únicas (URL_BUTTON_MOBILE) → property individual
8. Propriedades aparecem no painel direito do Figma (Component Properties)
9. Setup concluído — sync e deploy funcionam normalmente

### Fluxo B — Deploy Inteligente

1. Dev seleciona módulo → Plugin extrai dados → Clica "Deploy"
2. **Com NID**: `GET /figma/pull/{nid}` → compara → mostra diff → `POST /variants/preview`
3. **Sem NID**: resumo completo → campos do content-type → `POST /figma/page` → vincula NID automaticamente

### Fluxo C — Auto-Sync ao Abrir

1. Plugin abre → verifica NID no pluginData
2. Se existe: `GET /figma/pull/{nid}` → compara com Figma
3. Mostra banner: "3 campos desatualizados" ou "✅ Sincronizado"
4. Opção de aplicar sync automático

---

## 📊 Decisões Confirmadas

| Decisão | Escolha | Motivo |
| :--- | :--- | :--- |
| Prioridade | Funcionalidades primeiro, design depois | UX > Visual neste momento |
| Auth | Mock por agora | Backend não tem endpoints `/api/auth/*` |
| Design System | `<GlassSurface />` (SVG puro) | Leve, zero dependências, funciona em Chromium do Figma |
| FluidGlass (Three.js) | Descartado | Pesado demais para iframe do plugin |
| Campos essenciais | Plugin define, depois atualiza doc da API | Backend vai se adaptar |
| Nomes de layers | Plugin define convenções | Será base para API futura |
| White-label | Remover referências "TIM" | Plugin deve ser agnóstico |

---

## 📅 Roadmap v4.0

| Fase | Nome | Status | Descrição |
| :--- | :--- | :--- | :--- |
| 1-4 | Core v3.0 | ✅ Concluída | Extração, sync, deploy, catálogo, multi-mapeamento |
| 5 | Templates como Mapa | ✅ Concluída | Catálogo como guia de referência para renomear layers |
| 6 | Scan & Property Loading | ✅ Concluída | Motor de scan com match fuzzy + linking Desktop↔Mobile |
| 7 | Auto-Sync ao Abrir | ✅ Concluída | Verificação automática de sincronização com diff |
| 8 | Tela de Deploy Completa | 🔴 Pendente | Confirmação com diff, campos do content-type, dois modos |
| 9 | Inspeção de Módulos | 🔴 Pendente | Tela dedicada para inspecionar módulos selecionados |
| 10 | Campos Essenciais | 🔴 Pendente | Auto-detecção no Figma com fallback manual |
| 11 | Design Liquid Glass | 🔴 Pendente | Upgrade visual com `<GlassSurface />` |
| 12 | Polish & Estabilidade | 🔴 Pendente | Empty states, skeleton, error boundaries, white-label |

### Ordem de execução
```
F5 → F6 → F7 → F8 → F9 → F10 → F11 → F12
```

---

## 🔐 Segurança

| Aspecto | Estado | Detalhe |
| :--- | :--- | :--- |
| API Key storage | ⚠️ | Em `.env` (build time) + `figma.clientStorage` (runtime) |
| Auth tokens | ⚠️ | Mock tokens sem expiração |
| Network access | ✅ | `networkAccess.allowedDomains` no manifest limita domínios |
| XSS | ✅ | React sanitiza; sem `dangerouslySetInnerHTML` |
| CSRF | ✅ | Plugin roda em iframe isolado do Figma |
| Data exposure | ⚠️ | JSON preview mostra dados ao DEV |

### Recomendações futuras
- JWT com refresh token (15min access, 7d refresh)
- API Key exclusivamente em clientStorage (não no bundle)
- Validação: NID numérico, module_name com regex whitelist
- Rate limiting client-side + debounce
- Audit log: quem fez deploy e quando

---

## 🎨 Design System

### Atual (v3.0) — Glassmorphism Básico
- Variáveis CSS com fallback para variáveis nativas do Figma (`--figma-color-*`)
- `.glass-panel` com `backdrop-filter: blur(16px)`
- Paleta: azul (`--brand: #0d99ff`), roxo (`--purple: #a371f7`), success/danger/warning
- Tipografia: Inter + SF Mono
- Micro-animações: Framer Motion instalado mas pouco usado

### Futuro (v4.0 Fase 11) — Liquid Glass
- `<GlassSurface />` com SVG `feDisplacementMap` para distorção cromática
- Hierarquia de superfícies: Level 0 (background) → Level 3 (destaque)
- Paleta premium: roxo vibrante (#6C63FF), cyan elétrico (#00D9FF)
- Micro-animações em todos os elementos interativos
- Responsividade completa para formatos vertical e horizontal

---

## ✅ Verificação

### Por Fase
| Fase | Critério de Aceitação |
| :--- | :--- |
| 5 | Abrir Templates → ver módulos com props → copiar nome funciona |
| 6 | Renomear frames → Escanear → props no painel direito → TXT_TITULO linkado desk↔mobile |
| 7 | Abrir plugin com NID → banner "X desatualizados" → sync atualiza |
| 8 | Deploy → tela de confirmação → campos Drupal → confirmar executa |
| 9 | Selecionar layer → módulos detectados → expandir → props |
| 10 | Deploy → campos auto-preenchidos → faltantes com input |
| 11 | UI Liquid Glass → hover effects → animações |
| 12 | Build OK → plugin no Figma Desktop → fluxo completo |

### Build
```bash
npm run build       # Sem erros
npm run dev         # Preview visual
# Carregar no Figma Desktop → testar fluxo completo
```

---

## 🔗 Interconexões e Fluxo

1. **Ação do Usuário:** Clica em um botão em um **Componente**.
2. **Hook/Store:** O componente chama um **Hook** ou uma ação na **Store**.
3. **API/Figma:** A Store/Hook faz chamada via **API Client** (rede) ou via **useFigmaMessages** (Sandbox).
4. **Sandbox:** O `main.js` recebe a mensagem, executa no Figma e devolve o resultado.
5. **UI Update:** A Store atualiza o estado e o React re-renderiza.

---

## 📁 Arquivos Novos v4.0

| Arquivo | Fase | Status |
| :--- | :--- | :--- |
| `src/ui/components/scan/PropertyLoadingWizard.jsx` | 6 | ✅ |
| `src/ui/components/deploy/DeployScreen.jsx` | 8 | 🔴 |
| `src/ui/components/deploy/DeployDiff.jsx` | 8 | 🔴 |
| `src/ui/components/deploy/NodeFieldsForm.jsx` | 8 | 🔴 |
| `src/ui/stores/deployStore.js` | 8 | 🔴 |
| `src/ui/components/inspect/InspectScreen.jsx` | 9 | 🔴 |
| `src/ui/components/inspect/ModuleDetail.jsx` | 9 | 🔴 |
| `src/utils/essentialFields.js` | 10 | 🔴 |

---
**Status:** Atualizado v4.0 — 2026-05-06
# Code Reference — Figma-Drupal Sync v4.0

Documento detalhado de cada arquivo de código: o que ele faz, que funções/componentes exporta, que props recebe, e como se conecta com os demais.

---

## 🛠️ Plugin Sandbox

### `src/plugin/main.js`
**Tipo**: Backend do Plugin (IIFE)  
**Ambiente**: Sandbox isolado do Figma (sem rede, sem DOM)

**Funções internas**:
- `getLinkedNid()` — Lê NID salvo no pluginData do documento
- `setLinkedNid(nid)` — Salva NID e notifica a UI
- `clearLinkedNid()` — Remove NID do documento
- `sendNidState()` — Envia estado atual do NID para a UI
- `lerTextosDaTela()` — Chamada a cada `selectionchange`. Extrai textos dos nós selecionados, identifica variantes Desktop/Mobile, envia para a UI
- `atualizarPropriedades()` — Converte Frame→Component, injeta component properties baseado nas layers com prefixos reconhecidos
- `syncFromPayload(data, nodeMap?)` — Aplica valores em nós de texto (carrega fontes primeiro)
- `syncPageFromPayload(modules)` — Sync em massa: percorre módulos e aplica dados por módulo
- `readFullPage()` — Lê a página inteira usando `buildModuleTree()`, retorna payload hierárquico

**Handlers de mensagem**: 18 handlers (vide PROJECT_MAP.md)

**Eventos**:
- `figma.on('selectionchange', lerTextosDaTela)` — Re-extrai dados a cada seleção
- Na inicialização: envia API Key salva, NID, e `auto-sync-check` se NID existir

---

## 🧠 Utils

### `src/utils/nodeMapper.js`
**Tipo**: Lógica de negócio pura (funciona no sandbox do Figma)

**Funções exportadas**:
- `buildNodeMap(selection)` — Percorre recursivamente todos os filhos da seleção, cria Map de `nome → TextNode[]`. Ignora layers com `#` no início (marcadas para ignorar)
- `buildModuleTree(page)` — Identifica módulos top-level na página inteira. Ordena por posição Y (ordem visual). Retorna `[{name, nodeId, y, order, data}]`
- `extractDataFromNodeMap(nodeMap)` — Converte Map em objeto plano `{nome: texto}`. Se houver múltiplos TextNodes com mesmo nome, pega o primeiro não-vazio
- `extractWithSchema(nodeMap, schema)` — Extrai dados usando schema como guia. Retorna `{data, meta}` onde meta inclui `{foundKeys, missingKeys, extraKeys}`
- `applyTextToNode(node, value)` — Carrega fontes e aplica texto. Trata `figma.mixed` (fontes mistas)
- `matchModuleToTemplate(moduleName, templates)` — **[v4.0]** Match fuzzy com 3 estratégias: exato, contains, segmentos `_`. Retorna `{template, score, matchType}`
- `identifySharedProps(rootNode)` — **[v4.0]** Identifica subcamadas `_desk`/`_mobile`, separa props em shared/deskOnly/mobileOnly
- `buildFullPageScanReport(page, templates)` — **[v4.0]** Scan completo da página: para cada módulo, faz match com catálogo e analisa props Desktop/Mobile

**Funções internas**:
- `buildPrefixedNodeMap(rootNodes)` — Filtra nós com prefixos reconhecidos (TXT_, URL_, VAR_, BOOL_, MOD_, COMP_)
- `inferPropType(name)` — Infere tipo pelo prefixo: BOOL_→BOOLEAN, VAR_→VARIANT, default→TEXT

### `src/utils/colorMap.js`
**Tipo**: Mapeamento de cores

Converte valores RGB float (0-1) do Figma para nomes semânticos do Drupal (ex: `{r:0.06, g:0.22, b:0.53}` → `"azul-escuro"`). Usa distância euclidiana para encontrar a cor mais próxima.

### `src/utils/scanValidator.js`
**Tipo**: Validação de scan

Valida se as layers do Figma seguem as convenções: prefixos corretos, nomes dentro do catálogo, campos obrigatórios presentes. Retorna relatório com `{valid, warnings, errors}`.

### `src/utils/essentialFields.js`
**Tipo**: Auto-detecção de campos do Drupal  
**[v4.0 Fase 10]**

**Constantes exportadas**:
- `ESSENTIAL_FIELD_MAP` — Mapeamento `{layerName → drupalField}` (PAGE_TITLE→field_subtitle_metatag, etc.)
- `ESSENTIAL_FIELD_TYPES` — Tipos esperados por campo Drupal

**Funções exportadas**:
- `detectEssentialFields(nodeMap, contentTypeSchema?)` — Percorre nós, encontra matches no mapeamento, retorna `{autoFilled, missing, suggestions}`
- `mergeEssentialFields(autoFilled, manualValues)` — Mescla auto-detectados com preenchimento manual (manual tem prioridade)

---

## 🌐 API Layer

### `src/api/drupalClient.js`
**Tipo**: Cliente HTTP para o middleware Drupal

**Factory**: `createDrupalClient(apiKey)` → retorna objeto com métodos:
- `deployModule(nid, moduleName, data)` — POST `/api/figma/page` com `{target_nid, module_name, data}`
- `deployPage(nid, modules)` — POST com payload hierárquico completo
- `deployWithPreview(nid, moduleName, canvasData, nodeFields)` — POST `/api/variants/preview` com canvas + node_field_values
- `createPage(moduleName, data, nodeFields?)` — POST `/api/figma/page` sem target_nid (cria novo)
- `syncPull(nid)` — GET `/api/figma/pull/{nid}` → dados atuais do Drupal
- `fetchSchema(name)` — GET `/api/figma/templates` filtrado por nome
- `getContentType(nid)` — GET `/api/nodes/{nid}/content-type`
- `getContentTypeSchema(type)` — GET `/api/content-types/{type}`

**Autenticação**: Header `X-TIM-Key` com a apiKey passada no factory.

### `src/api/templateClient.js`
**Tipo**: Cliente para catálogo de templates

**Funções exportadas**:
- `fetchTemplates(apiKey)` — GET `/api/variants/templates`. Normaliza resposta em `[{module, variations: [{name, fields, nid_origem, component_id}]}]`
- `fetchTemplateByName(name, apiKey)` — GET `/api/variants/templates/{name}`. Retorna template completo com `figma_properties`, `figma_component_schema`, `drupal_skeleton`

### `src/api/authClient.js`
**Tipo**: Cliente de autenticação (mock)

- `login(username, password)` — Mock: `user/12345` → role UX, `dev/12345` → role DEV. Retorna `{user, token}`
- `logout()` — Limpa sessão

---

## 💾 Stores (Zustand)

### `src/ui/stores/appStore.js`
**Estado**: `currentScreen`, `previousScreen`, `toasts[]`, `isLoading`  
**Ações**: `navigate(screen)`, `goBack()`, `addToast(toast)`, `removeToast(id)`, `setLoading(bool)`  
**Constante**: `SCREEN_SIZES` — dimensões por tela para resize automático (login, home, templates, scan, settings, deploy, inspect)

### `src/ui/stores/authStore.js`
**Estado**: `user` (id, name, email, role), `token`, `apiKey`, `isAuthenticated`  
**Ações**: `setUser(user)`, `setToken(token)`, `setApiKey(key)`, `logout()`

### `src/ui/stores/scanStore.js`
**Estado**: `status` (idle→scanning→validating→done), `modules[]`, `report`, `jsonPreview`, `progress`  
**Ações**: `setStatus()`, `setModules()`, `setReport()`, `setProgress()`, `reset()`

### `src/ui/stores/templateStore.js`
**Estado**: `templates[]`, `isLoading`, `error`, `searchQuery`, `typeFilter`, `selectedVariation`, `lastFetched`  
**Ações**: `setTemplates()`, `setSearchQuery()`, `setTypeFilter()`, `clearCache()`  
**Derivados**: `getFilteredTemplates()`, `isCacheValid()` (TTL 1h)

### `src/ui/stores/deployStore.js`
**[v4.0 Fase 8]**  
**Estado**: `mode` (update/newPage), `figmaData`, `drupalData`, `diff`, `contentType`, `contentTypeSchema`, `nodeFields`, `isDeploying`, `result`, `error`  
**Ações**: `prepareDeploy(mode, figmaData, drupalData?, schema?)` — computa diff automático, `setNodeField(name, value)`, `setContentType(type, schema)`, `setDeploying()`, `setResult()`, `reset()`

---

## ⚓ Hooks

### `src/ui/hooks/useFigmaMessages.js`
**Tipo**: Ponte React ↔ Sandbox

**Estado retornado**: `linkedNid`, `apiKey`, `extractedData`, `currentMeta`, `currentModuleName`, `schemaStatus`, `status`, `pageModules`, `syncStatus`, `syncDiff`, `autoSyncNid`

**Ações retornadas**: `bindNid()`, `clearNid()`, `loadSchema()`, `clearSchema()`, `updateProps()`, `requestSync()`, `applySyncData()`, `applySyncManual()`, `syncPropsLocal()`, `saveApiKey()`, `readFullPage()`, `showStatus()`, `hideStatus()`, `buildCleanData()`, `setSyncResult()`, `onceMessage()`

**Função estática**: `postToFigma(msg)` — Envia mensagem para o sandbox via `parent.postMessage()`

### `src/ui/hooks/useAuth.js`
**Retorna**: `login()`, `logout()`, `checkSession()`, `isAuthenticated`, `isDevRole`, `user`, `token`

### `src/ui/hooks/useScan.js`
**Retorna**: `runScan()`, `processModules()`, `deployFullPage()`, `scanStatus`, `scanModules`, `scanReport`

### `src/ui/hooks/useTemplates.js`
**Retorna**: `loadTemplates()`, `loadVariation()`, `downloadSchema()`, `templates`, `filteredTemplates`, `isLoading`, `error`, `searchQuery`, `setSearchQuery`, `typeFilter`, `setTypeFilter`

---

## 🧱 Componentes de UI

### `src/ui/App.jsx`
**Tipo**: Orquestrador raiz  
**Responsabilidades**: Auth guards, auto-sync effect, deploy/sync handlers, renderização condicional de telas  
**Hooks usados**: `useAuth`, `useFigmaMessages`, `useTemplates`, `useAppStore`  
**Cliente API**: `createDrupalClient(apiKey || token)`  
**Telas renderizadas**: login, home (Bound/Unbound), templates, scan, deploy, inspect, settings

### `src/ui/App.css`
**Tipo**: Design System completo (~1650 linhas)  
**Seções**: Variáveis/Reset, Auth, Header, NavBar, Home, Bound/Unbound, Sync Banner, Templates, Fields, Scan, Wizard, Deploy, Diff, Node Fields, Inspect, Module Detail, Utils/Animações

---

### `src/ui/components/auth/LoginScreen.jsx`
**Props**: nenhuma (usa stores diretamente)  
**Função**: Formulário de login com campos username/senha, logo, botão submit, footer com versão. Chama `useAuth().login()` e navega para home.

### `src/ui/components/home/BoundState.jsx`
**Props**: `linkedNid`, `currentModuleName`, `extractedData`, `currentMeta`, `onDeploy`, `onSync`, `onDownload`, `syncStatus`, `syncDiff`, `onApplySync`  
**Função**: Estado principal quando NID vinculado. Mostra: NID badge, sync banner animado (4 estados), módulo selecionado, PropertyList, botões de ação (Deploy, Sync, Scan, Templates, JSON).

### `src/ui/components/home/UnboundState.jsx`
**Props**: `onBind`, `onDeployNewPage`, `currentModuleName`  
**Função**: CTA para vincular NID existente (input numérico) ou criar nova página.

### `src/ui/components/layout/Header.jsx`
**Props**: nenhuma (usa authStore)  
**Função**: Avatar com iniciais, nome do usuário, badge de role (UX azul / DEV roxo), botão logout.

### `src/ui/components/layout/NavBar.jsx`
**Props**: nenhuma (usa appStore, authStore)  
**Função**: Barra de navegação no rodapé com ícones SVG: Home, Scan, Templates (DEV only), Settings (DEV only).

### `src/ui/components/layout/ResizableContainer.jsx`
**Props**: `children`  
**Função**: Container com handle de drag no canto inferior-direito para redimensionar o plugin. Envia `resize-ui` para o sandbox.

### `src/ui/components/templates/TemplateList.jsx`
**Props**: `apiKey`  
**Função**: Catálogo de templates como MAPA DE REFERÊNCIA. Stats header (módulos/variações/props), expand/collapse all, usage guide banner, lista acordeão de módulos com VariationCards.

### `src/ui/components/templates/VariationCard.jsx`
**Props**: `variation`, `onDownloadSchema`  
**Função**: Card expandível de variação. Guide steps para renomear frames, botão copiar nome, botão copiar todas as props, preview placeholder, badges de tipo, ação download schema JSON.

### `src/ui/components/templates/FieldList.jsx`
**Props**: `fields`, `compact?`  
**Função**: Lista de campos com ícones por tipo (📝/🔘/🎨/🔗/📦), botão copy-to-clipboard em cada nome, valor exemplo. Renderiza children recursivamente (SLOT).

### `src/ui/components/templates/TemplateSearch.jsx`
**Props**: `searchQuery`, `onSearchChange`, `typeFilter`, `onTypeChange`  
**Função**: Campo de busca com debounce de 300ms + chips de filtro por tipo (Todos, hero, cards, banner).

### `src/ui/components/scan/ScanReport.jsx`
**Props**: nenhuma (usa scanStore, useScan)  
**Função**: Relatório do scanner com resumo (OK/WARN/FAIL), lista de ModuleStatusItem, JsonPreview, botão deploy em massa.

### `src/ui/components/scan/ModuleStatusItem.jsx`
**Props**: `module`, `status`, `warnings`  
**Função**: Item individual do relatório com ícone de status, nome do módulo, contagem de campos, sugestões de correção.

### `src/ui/components/scan/JsonPreview.jsx`
**Props**: `data`, `title?`  
**Função**: Preview formatado do JSON que será enviado no deploy, com botão copiar e syntax highlighting básico.

### `src/ui/components/scan/PropertyLoadingWizard.jsx`
**Props**: `templates`, `onClose`  
**Função**: Wizard de setup em 4 etapas: idle→scan→review→done. Mostra módulos detectados com indicador de match (✅/⚠️/❓), estatísticas (reconhecidos, sem match, shared, exclusivas), Desktop/Mobile breakdown, botão para executar carregamento de properties.

### `src/ui/components/deploy/DeployScreen.jsx`
**Props**: `linkedNid`, `currentModuleName`, `extractedData`, `client`, `onDeployDone`  
**Função**: Tela completa de confirmação de deploy com dois modos. Modo update: busca dados do Drupal, mostra DeployDiff. Modo newPage: mostra resumo completo. Inclui NodeFieldsForm para campos do content-type. Estados: loading, error, result com NID.

### `src/ui/components/deploy/DeployDiff.jsx`
**Props**: `diff`, `onToggleField`  
**Função**: Diff visual campo a campo. Verde=adicionado, amarelo=modificado, vermelho=removido. Cada campo tem checkbox para incluir/excluir do deploy. Toggle para mostrar/ocultar campos inalterados.

### `src/ui/components/deploy/NodeFieldsForm.jsx`
**Props**: `schema`, `values`, `autoFilledFields?`, `onChange`  
**Função**: Formulário dinâmico renderizado pelo schema do content-type. Renderizadores por tipo: string→input, boolean→toggle, text_formatted→textarea, list_string→select. Campos required com asterisco. Campos auto-detectados com badge "Auto-detectado ✅".

### `src/ui/components/inspect/InspectScreen.jsx`
**Props**: `templates`  
**Função**: Tela de inspeção de módulos da página. Botão scan, spinner, lista de módulos com status icons (✅ exact, ⚠️ fuzzy, ❓ none), stats (total, reconhecidos, sem match), cada módulo expandível para ModuleDetail.

### `src/ui/components/inspect/ModuleDetail.jsx`
**Props**: `module`, `onNavigateDeploy`  
**Função**: Detalhe expandido de módulo escaneado. Desktop/Mobile breakdown com badges coloridos, lista de props compartilhadas (com tag "shared"), Desktop-only e Mobile-only, info de match (tipo + percentual), botão "Deploy este módulo".

### `src/ui/components/shared/GlassSurface.jsx`
**Props**: `level` (0-3), `hover`, `glow`, `className`, `style`, `children`, `as` (component type)  
**Função**: Componente base Liquid Glass. Usa CSS variables para blur/opacity controlados por level. SVG inline com feDisplacementMap em level 2+. Glow border com conic-gradient animado.

### `src/ui/components/shared/GlassCard.jsx`
**Props**: `level` (default: 1), `hover` (default: true), `glow`, `padding`, `className`, `children`  
**Função**: Wrapper pré-configurado de GlassSurface para cards com defaults de padding e hover.

### `src/ui/components/shared/ProgressBar.jsx`
**Props**: `value?`, `indeterminate?`, `label?`, `variant?` (brand/success/purple)  
**Função**: Barra de progresso animada. Modo determinado (0-100%) ou indeterminado (animação contínua).

### `src/ui/components/shared/Toast.jsx`
**Props**: nenhuma (usa appStore)  
**Função**: Container de notificações. Renderiza toasts do appStore com auto-dismiss, ícone por tipo (success/error/info/warning), animação de entrada/saída.

### `src/ui/components/DevSettingsTab.jsx`
**Props**: `linkedNid`, `apiKey`, `currentModuleName`, `extractedData`, `currentMeta`, `schemaStatus`, `onForceNid`, `onUnlinkNid`, `onLoadSchema`, `onClearSchema`, `onUpdateProps`, `onFetchSchema`, `onApplyManualJson`, `onDevDeploy`, `onDevDownload`, `onSyncProps`, `status`  
**Função**: Aba exclusiva DEV com 5 seções: (1) NID binding/unbinding, (2) API Key input com save, (3) Schema management (buscar/carregar/limpar), (4) JSON de conteúdo (colar/aplicar), (5) Deploy manual com NID override. Também mostra preview de dados extraídos e ação Sync Local.

### `src/ui/components/NidBadge.jsx`
**Props**: `nid`  
**Função**: Badge visual com NID, dot pulsante verde, fonte monospace.

### `src/ui/components/PropertyList.jsx`
**Props**: `data`, `meta?`  
**Função**: Lista de propriedades extraídas com type badges coloridos (TEXT verde, BOOLEAN azul, VARIANT roxo, SLOT cinza).

---

*Gerado em: 2026-05-06 — v4.0*
