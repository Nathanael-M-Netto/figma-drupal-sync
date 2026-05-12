# 📋 BOARD — Figma-Drupal Sync v3.1

**Timeline**: 12 mai → 31 ago 2026 · 16 semanas · 8 sprints de 2 semanas
**Versão deste doc**: 3 · **Última atualização**: 12 mai 2026

---

## 📍 Onde estamos agora

```
   ✅ PRE-01 (manifest fix)        ─── feito, plugin destravado
   ▶️ TS-01 (setup TS)             ─── próximo: Nathanael
   ▶️ TS-02 (api+utils pra TS)     ─── próximo: Leonardo
   ▶️ TYPES-01 (bug tipos)         ─── próximo: Nathanael
   ▶️ AUTH-01 (portal Azure)       ─── próximo: Leonardo, paralelo
   ▶️ CACHE-01 (cache backend)     ─── próximo: Matheus, paralelo

   26 tasks restantes · 8 sprints · todos podem começar S1
```

---

## 🎯 Objetivo do projeto

Plugin Figma que conecta o design ao Drupal automaticamente. O catálogo de templates do Drupal já sabe o que cada módulo precisa ter — o plugin escaneia o Figma, bate com esse catálogo, carrega as propriedades necessárias no painel direito (TXT_, BOOL_, URL_, VAR_), e permite publicar a página inteira no Drupal com um clique.

Resolve duas dores:
1. **Pro UX**: deixa de digitar o mesmo conteúdo no Figma e depois no CMS — design vira fonte da verdade
2. **Pro DEV**: deixa de revisar manualmente o que o UX produziu — plugin garante que cada módulo tem o que o template espera

### Roles e acessos

| Role | Home (scan, carregar props, deploy, criar página) | Templates (catálogo) | Settings (config) |
|---|:---:|:---:|:---:|
| **UX** | ✅ | ✅ | ❌ |
| **DEV** | ✅ | ✅ | ✅ |

UX faz **tudo** que tem a ver com produzir uma página: cria do zero, nomeia as layers (consultando o catálogo de templates), carrega as propriedades, vincula a um NID existente OU faz deploy gerando NID novo. DEV faz tudo isso **e** mais a aba de Settings (cache, env, schema manual, debug).

### Jornada principal (mesma para UX e DEV)

```
1. Abre plugin no Figma
2. Login Microsoft (se primeira vez)
3. Boot carrega catálogo (cache)
4. Home detecta arquivo
   ├── Já tem NID vinculado → mostra status atual
   └── Sem NID → pronto pra escanear
5. Botão principal grande, contextual:
   ├── Estado inicial    → "🔍 Escanear página"
   ├── Erros de nome     → "⚠ Resolva nomes inválidos" (disabled)
   ├── Sem propriedades  → "⚡ Carregar Propriedades"
   ├── Tudo OK + sem NID → "🔗 Vincular ou Criar Página"
   │                         └→ modal com 2 opções:
   │                            (a) input NID existente → vincula
   │                            (b) criar página nova no Drupal → recebe NID gerado, auto-vincula
   └── Tudo OK + com NID → "🚀 Deploy"
                              └→ tela de review com diff
```

O botão é sempre o mesmo no rodapé. O label/cor/ação mudam conforme o estado da página. User não pensa, só clica.

---

## 👥 Time

| Pessoa | Papel |
|---|---|
| Nathanael | Frontend |
| Pedro | Frontend |
| Leonardo | Fullstack |
| Matheus | Devops/Backend |

---

## ✅ Status atual (o que já está pronto)

Trabalho de sessões anteriores que já está no DEV:

### Lógica e API
| Funcionalidade | Estado |
|---|---|
| API key como `password` com toggle eye/eye-off | ✅ |
| Persistência de NID por arquivo (`figma.root.setPluginData`) | ✅ |
| Comunicação sandbox ↔ UI por mensagens | ✅ |
| `buildModuleTree` com ordenação por Y + unificação desk/mobile | ✅ |
| `identifySharedProps` (detecta props compartilhadas desk/mobile) | ✅ |
| `atualizarPropriedades` (injeta no painel direito do Figma) | ✅ |
| Multi-page scan via `loadAllPagesAsync` | ✅ |
| `templateClient` normalizando v1/v2 + `humanizeModuleName` | ✅ |
| `drupalClient.deployPage` com N chamadas sequenciais Mode 2 | ✅ |
| `pageDiffer` — diff campo-a-campo Figma vs Drupal | ✅ |
| Env settings (env_host + env) com persistência em clientStorage | ✅ |
| Auto-sync ao abrir plugin com NID vinculado | ✅ |

### TypeScript (parcial)
| Item | Estado |
|---|---|
| `tsconfig.json` com `strict: true` + path aliases | ✅ |
| `@figma/plugin-typings`, `@types/react`, `@types/react-dom` instalados | ✅ |
| **15 componentes em `.tsx`**: App, main, layout/* (3), shared/* (10) | ✅ |
| Pacote `typescript` como devDependency | ❌ |
| Script `npm run typecheck` | ❌ |
| Feature components, stores, hooks, plugin/main em `.ts`/`.tsx` | ❌ |

### UI já componentizada (reutilizável)
GlassCard, GlassSurface, Modal, NidBadge, ProgressBar, PropertyList, Skeleton, StatusBar, Toast, ErrorBoundary, ResizableContainer, Header, NavBar. **Base do design system já existe** — precisa expansão e auditoria conforme a Home/Deploy/Scan crescem.

### Testes
| Item | Estado |
|---|---|
| Vitest / jest / testing-library | ❌ não instalado |
| Mock global de `figma` para testar lógica isolada | ❌ |
| Testes unitários dos arquivos `.js` de lógica (maps/diff/normalize) | ❌ |
| Coverage report | ❌ |
| CI rodando testes | ❌ |

Base sólida em lógica e estrutura. As 25 tasks abaixo cobrem o que falta pra fechar o produto.

---

## 🚦 Ordem real de execução + débitos técnicos críticos

Antes de começar Sprints, tem **bloqueios técnicos** que travam testes e validação. Resolver na ordem abaixo evita gastar dias debugando o sintoma errado.

### Pré-requisito absoluto — PRE-01: `manifest.json` allowedDomains

**Sintoma atual**: toda chamada de API devolve `TypeError: Failed to fetch` no console do plugin.

**Causa raiz**: o `manifest.json` tem `"allowedDomains": ["https://api.example.com"]` (placeholder) — mas o código chama `https://tim-agentic-cms-api-dev....azurecontainerapps.io`. O Figma bloqueia request pra domínio fora dessa lista.

**Fix**: trocar pelos domínios reais (dev/stage/prod + portal Azure). Rebuildar e reimportar o plugin (`Plugins → Development → Import plugin from manifest`).

**Por que essa precisa vir antes de TUDO**: sem fetch funcionar, é impossível testar AUTH-02 (login), HOME-04 (sync), CACHE-01 (cache local depende do backend responder), PROPS-* (carregar do catálogo), e por aí vai. Cada task que depende de API trava em silêncio se isso não tiver corrigido.

### Outras armadilhas conhecidas

| Tropeço | Sintoma | Como prevenir |
|---|---|---|
| `documentAccess: "dynamic-page"` exige `loadAllPagesAsync()` antes de iterar pages | Erro `Cannot read property 'children' of undefined` ou pages aparecendo vazias | Já corrigido no `readFullPage` e `scan-and-load-props` — manter o padrão em qualquer função nova que toque múltiplas pages |
| Mudança em `manifest.json` não recarrega no Figma | Plugin parece ignorar a mudança | Sempre reimportar via "Import plugin from manifest" depois de editar |
| Sandbox não tem `fetch` | `fetch is not defined` no main.js | Sandbox = sem rede. **Toda chamada HTTP é UI → API**. Sandbox pede via `postMessage('do-sync-fetch')` e UI faz |
| Vite singleFile com tamanho grande | UI demora pra abrir | Já tá em `assetsInlineLimit: 100000000` (inline tudo). Não otimizar antes de medir |
| `figma.clientStorage` é assíncrono | Race conditions ao ler antes de carregar | Sempre `await figma.clientStorage.getAsync(...)` antes de usar |

### Ordem real (com dependências)

```
✅ FEITO ─────────────────────────────────────────────────
  PRE-01  Fix manifest.allowedDomains              [Nathanael, S]

S1 sem 1 (12-18 mai) ─────────────────────────────────────
  TS-01    Completar setup TypeScript              [Nathanael, S]
  TYPES-01 Bug tipos prefixo                       [Nathanael, S]
  TS-02    utils + api pra TS                      [Leonardo,  M]
  AUTH-01  Portal Azure + endpoint                 [Leonardo,  L] começa
  CACHE-01 Main cache backend                      [Matheus,   L] começa

S1 sem 2 → S2 (19 mai-8 jun) ─────────────────────────────
  TS-03    Migrar feature components               [Pedro,     L] começa
  AUTH-01  (continua)
  AUTH-02  Login no plugin                         [Leonardo,  M] precisa AUTH-01
  CACHE-01 (continua)
  BOOT-01  Boot screen + cache local               [Pedro,     M] precisa CACHE-01 + AUTH-02

S3 (9-22 jun) ────────────────────────────────────────────
  HOME-01  Reestruturar home                       [Pedro,     M]
  HOME-02  Scan engine + lista                     [Pedro,     L]
  HOME-03  State machine + botão condicional       [Nathanael, M]

S4 (23 jun-6 jul) ────────────────────────────────────────
  PROPS-01 Loader no sandbox                       [Pedro,     L]
  PROPS-02 Batch + detecção variante               [Pedro,     M]
  HOME-04  Sync Drupal → Figma                     [Leonardo,  M]

S5 (7-20 jul) ────────────────────────────────────────────
  DEPLOY-01 Polish do deploy                       [Nathanael, S]
  DEPLOY-02 Async + criar página                   [Leonardo,  M]
  NODE-01   Ler campos do node                     [Leonardo,  M]
  NODE-02   Editar campos (começa)                 [Leonardo,  M]

S6 (21 jul-3 ago) ────────────────────────────────────────
  NODE-02   (continua)
  SETTINGS-01 Componentizar settings               [Nathanael, M]
  DS-01     Auditoria + design system              [Pedro,     M]
  TPL-01    Filtros + screenshots                  [Pedro,     S]

S7 (4-17 ago) ────────────────────────────────────────────
  TEST-01 Setup Vitest + testes maps               [Pedro,     L]
  TEST-02 Integração API + CI                      [Leonardo,  M]
  TEST-03 E2E Playwright (começa)                  [Pedro,     L]

S8 (18-31 ago) ───────────────────────────────────────────
  TEST-03 (continua)
  STAB-01 Bug bash + perf                          [Pedro,     M]
  STAB-02 Doc final                                [Nathanael, S]
```

**Caminho crítico** (se algum atrasar, próximo trava):

```
  ✅ PRE-01 ─┐
            ├─→ AUTH-01 → AUTH-02 → BOOT-01 → HOME-01 → HOME-02 → PROPS-01
  CACHE-01 ─┘                          ↑
                                       │
                                  precisa dos dois antes de funcionar
```

---

## 🗓️ Gantt por sprint

```
                      S1   S2   S3   S4   S5   S6   S7   S8
                      ───  ───  ───  ───  ───  ───  ───  ───
TypeScript            ███  ███
Auth Microsoft        ███  ███
Cache + Boot               ███
Home c/ Scan                    ███  ░░░
Props loading                        ███
Deploy compl.                             ███
Node Fields                               ███  ░░░
Settings polish                                ███
Design System                                  ███
Templates polish                               ███
Testes                                              ███  ███
Estabilização                                            ███

LEGENDA:  ███ trabalho ativo   ░░░ rabicho/dependência
```

| Sprint | Período | Foco principal |
|---|---|---|
| S1 | 12-25 mai | Foundation (TS + bug tipos + portal Azure) |
| S2 | 26 mai-8 jun | Cache backend + login Microsoft completo |
| S3 | 9-22 jun | Home reformulada com scan embutido |
| S4 | 23 jun-6 jul | Carregamento de propriedades (peça central) |
| S5 | 7-20 jul | Deploy assíncrono + edição campos Drupal |
| S6 | 21 jul-3 ago | Settings componentizado + design system + polish templates |
| S7 | 4-17 ago | Bateria de testes (unit + integração + e2e) |
| S8 | 18-31 ago | Bug bash, performance, documentação final |

---

## 🎫 Tasks (27 total)

EPICs abaixo estão **organizados por tema, não por ordem cronológica**. Use o Gantt acima pra ver a ordem. Cada task tem **Por quê** (impacto no projeto), **O quê** (escopo) e **Pronto quando** (critério).

---

## EPIC 0 — Pré-requisitos (destrava tudo)

### PRE-01 — Fix `manifest.json` allowedDomains ✅ DONE
**Owner**: Nathanael · **Size**: S · **Sprint**: 1

**Status**: ✅ feito em 12 mai 2026. `manifest.json` atualizado com domínio dev real, build limpo. Falta só importar/reimportar o plugin no Figma local de cada dev do time.

**Por quê foi feito**: Toda chamada de API caía em `Failed to fetch` porque o manifest tinha `https://api.example.com` (placeholder). Figma bloqueia fetch para domínio fora da lista.

**O que foi feito**:
- Trocado `https://api.example.com` por `https://tim-agentic-cms-api-dev.gentlebeach-a211275a.eastus.azurecontainerapps.io`
- Adicionado `http://localhost:5173` em devAllowedDomains pra HMR
- Atualizado `reasoning` mencionando que stage/prod/portal Azure entram quando URLs forem definidas
- `npm run build` valida

**Ainda falta** (acompanhamento, não bloqueador):
- Adicionar URLs de stage e prod quando o devops liberar
- Adicionar URL do portal Azure quando AUTH-01 definir

---

## EPIC 1 — Fundação TypeScript

### TS-01 — Completar setup TypeScript
**Owner**: Nathanael · **Size**: S · **Sprint**: 1

**Por quê**: O projeto já tem `tsconfig.json` strict e 15 componentes em `.tsx`, mas falta o compilador instalado como devDep e os scripts de typecheck/lint. Sem isso ninguém consegue rodar `tsc` localmente nem no CI, e os erros de tipo passam silenciosos.

**O quê**:
- Adicionar `typescript` em devDependencies
- Adicionar script `"typecheck": "tsc --noEmit"` em package.json
- Rodar `tsc` e resolver os erros que aparecerem nos 15 arquivos já tsx
- Documentar path aliases no `vite.config.js` e `tsconfig.json` (verificar consistência)

**Pronto quando**:
- `npm run typecheck` passa sem erros
- `npm run build` continua gerando UI single-file e plugin bundle
- Imports `@/components/...` funcionam tanto no editor quanto no build

---

### TS-02 — Migrar utils + api para TS
**Owner**: Leonardo · **Size**: M · **Sprint**: 1

**Por quê**: A camada de API é o que mais sofre com a falta de tipos. Leonardo conhece os contratos do backend, faz sentido ele migrar e criar os tipos uma vez para todo o front consumir.

**O quê**: Migrar `src/utils/` (5 arquivos) e `src/api/` (3 arquivos). Criar `src/api/types.ts` com interfaces espelhando a API v2 do `API_REFERENCE.md` (`TemplateResponse`, `NodeFieldsResponse`, `SyncPayloadResponse`, `DeployPayload`, etc).

**Pronto quando**:
- Todos os arquivos com extensão `.ts`
- Tipos exportados e usáveis em todo o front
- Zero `any` injustificado

---

### TS-03 — Migrar feature components + stores + hooks + plugin pra TS
**Owner**: Pedro · **Size**: L · **Sprint**: 1-2

**Por quê**: Estabilidade do front. Layout e shared já estão tsx — falta migrar os feature components (deploy, scan, templates, dev, auth, home, inspect), stores, hooks e o sandbox. Mensagens sandbox↔UI tipadas evitam toda uma classe de bugs.

**O quê**: Migrar o que ainda é `.js`/`.jsx`:
- `src/ui/stores/` (5 arquivos Zustand)
- `src/ui/hooks/` (4 arquivos)
- `src/ui/components/auth/`, `home/`, `templates/`, `scan/`, `deploy/`, `dev/`, `inspect/` (~20 arquivos)
- `src/components/ui/` (componentes shadcn base — 7 arquivos)
- `src/plugin/main.js`

Definir `type PluginMessage` como união discriminada em `src/types/messages.ts`, compartilhada entre sandbox e UI.

**Pronto quando**:
- 100% dos arquivos em `.ts`/`.tsx` (zero `.js`/`.jsx` em `src/`)
- `npm run typecheck` zero erros
- `postToFigma()` só aceita tipos de mensagem válidos (validação no editor)

---

## EPIC 2 — Autenticação Microsoft (Opção B: browser externo)

### AUTH-01 — Portal externo Azure + endpoint exchange
**Owner**: Leonardo · **Size**: L · **Sprint**: 1-2

**Por quê**: O Figma não permite OAuth direto dentro do plugin. Solução: usuário loga num site externo, recebe um código curto, cola no plugin. Esse portal é a porta de entrada de todo o sistema de permissão e dele depende todo o controle de roles.

**O quê**: Página web `/azure-login` que faz OAuth Azure AD, gera código curto de 6-8 chars com TTL 5min, armazena `{código → token Azure + claims}` no backend. Endpoint `POST /api/auth/azure/exchange` valida o código e devolve token TIM + role mapeada de grupos Azure.

**Pronto quando**:
- URL fixa acessível (ex: `https://tim-cms-portal/azure-login`)
- Fluxo OAuth completo funcional em browsers principais
- Código único, single-use, 5min TTL
- Mapping Azure groups → role (dev/ux) configurável via env
- Endpoint refresh (`POST /api/auth/refresh`) renova token sem novo login Azure

---

### AUTH-02 — Login + refresh no plugin
**Owner**: Leonardo · **Size**: M · **Sprint**: 2

**Por quê**: O plugin precisa consumir o que AUTH-01 produziu. Mantendo o ciclo todo com o Leonardo evita ping-pong entre roles e garante consistência.

**O quê**: Substituir LoginScreen mock por: botão "Entrar com Microsoft" → `figma.openExternal()` → input do código → `POST /api/auth/azure/exchange` → guarda token. Middleware no `drupalClient` detecta 401, tenta refresh, repete request transparente. Logout limpa clientStorage e volta pra LoginScreen.

**Pronto quando**:
- User loga via Microsoft sem sair do Figma
- Token persiste entre sessões do plugin
- Refresh transparente; se falhar, volta pra login com toast
- Logout não deixa dados de auth no clientStorage
- Validação do formato do código antes de enviar

---

## EPIC 3 — Cache + Boot

### CACHE-01 — Main cache backend + ETag
**Owner**: Matheus · **Size**: L · **Sprint**: 2

**Por quê**: O catálogo de templates raramente muda mas é pedido toda hora. Sem cache, todo login bate em Drupal/Cohesion e o plugin demora pra abrir. Essa task é o que viabiliza a UX de "abriu o plugin → tá pronto".

**O quê**: Camada Redis (ou in-memory) entre API e Drupal. `GET /api/templates` serve do cache, retorna `ETag`, aceita `If-None-Match` e responde 304 quando bate. Cache key inclui `env` (`templates:v2:{env}`). TTL 24h com refresh proativo a cada 1h.

**Pronto quando**:
- Hit rate >95% em condições normais
- Latência <50ms no cache hit
- 304 funciona com `?env=ambiteste` (env é parte da key)
- Invalidação manual via endpoint admin
- Métricas em `/api/admin/worker-stats`

---

### BOOT-01 — Boot screen + cache local
**Owner**: Pedro · **Size**: M · **Sprint**: 2

**Por quê**: Primeira impressão. Hoje o plugin abre na cara do user já bagunçado. Com boot orquestrado, ele entra já com tudo carregado e tem feedback visual claro do que está acontecendo.

**O quê**: Tela de loading entre login e home com steps animados (validando sessão → catálogo → deltas → NID → pronto). Cache local em `figma.clientStorage` com ETag. Hook `useTemplatesCache()` singleton que abstrai o cache. Settings tem card pra invalidar manualmente.

**Pronto quando**:
- Steps visíveis com animação suave (framer-motion)
- Segunda abertura do plugin não baixa templates de novo
- Trocar env invalida o cache automaticamente
- Boot completo <2s no cache hit, <5s no cache miss
- Card de cache no Settings mostra tamanho, idade, ETag

---

## EPIC 4 — Home com scan embutido (a peça central do plugin)

### HOME-01 — Reestruturar home + barra de ações
**Owner**: Pedro · **Size**: M · **Sprint**: 3

**Por quê**: Hoje a home reage à seleção no Figma e fica confusa quando o user seleciona vários módulos (aparece "Múltiplos Módulos" sem detalhe). A nova home é dirigida pelo scan da página inteira, não pela seleção. Isso resolve a maior dor de UX do produto.

**O quê**: Renomear `BoundState` → `HomeScreen`. Layout: header (NID + ações) → barra (Escanear / Sync / Download) → lista de módulos → botão principal condicional. Sem NID, a home não fica num estado separado — escaneia normalmente, e o botão principal no fim do fluxo abre o modal NO_NID com opções de vincular ou criar página (acessível a UX e DEV).

**Pronto quando**:
- Funcionalidade preservada (não regride)
- Componente reutilizado entre bound/unbound
- Botão Download baixa JSON da página completa com nome `{nid}-{timestamp}.json`

---

### HOME-02 — Scan engine + lista de módulos com status
**Owner**: Pedro · **Size**: L · **Sprint**: 3

**Por quê**: O coração do plugin. O scan cruza Figma com catálogo e mostra em cores o estado de cada módulo. Sem isso, o user não sabe se o design está pronto pra publicar — e o catálogo de templates fica decorativo.

**O quê**: Botão "🔍 Escanear" dispara `read-full-page` + cruzamento com catálogo. Lista cada módulo com status visual: ✅ ok (matched + props loaded) / ⚠️ matched sem props / ❌ sem match. Cada item expande detalhe com props esperadas, valores extraídos do Figma, valores do Drupal (se NID vinculado), e diff colorido.

**Pronto quando**:
- 3 estados visualmente distintos com cores claras
- Lista ordenada pela posição visual (top-down)
- Detalhe expandido com diff (verde=igual, amarelo=alterado, azul=novo, cinza=só Drupal)
- Botão "destacar no Figma" funciona (`viewport.scrollAndZoomIntoView`)
- Funciona com arquivos de 50+ módulos sem travar

---

### HOME-03 — State machine + botão condicional
**Owner**: Nathanael · **Size**: M · **Sprint**: 3

**Por quê**: É a peça de UX mais crítica do plugin. O botão grande sempre mostra a próxima ação correta — user não pensa, só clica. Tarefa pequena mas central no fluxo todo, **única do Nathanael no caminho crítico**.

**O quê**: State machine completa:

```
IDLE → SCANNING → SCANNED
                    ├── HAS_ERRORS (nomes sem match no catálogo)
                    ├── NEEDS_PROPS (matched mas sem componentProperty injetada)
                    └── READY
                          ├── HAS_NID → deploy
                          └── NO_NID  → escolha bind/criar
```

Botão principal muda label/cor/handler conforme estado:

| Estado | Label | Variant | Ação |
|---|---|---|---|
| IDLE | 🔍 Escanear página | primary | dispara scan |
| SCANNING | ⏳ Escaneando... | disabled | — |
| HAS_ERRORS | ⚠ Resolva nomes inválidos | disabled | tooltip + lista módulos |
| NEEDS_PROPS | ⚡ Carregar Propriedades | warning | dispara `loadAllProps` |
| READY + HAS_NID | 🚀 Deploy | primary | navega `deployReview` |
| READY + NO_NID | 🔗 Vincular ou Criar Página | primary | abre modal de escolha |

Re-scan automático após carregar props. Modal NO_NID tem 2 opções: (a) input NID existente → vincula; (b) criar página nova no Drupal → fluxo DEPLOY-02.

**Pronto quando**:
- Transições explícitas (estado nunca muda fora do reducer)
- Botão muda dinamicamente sem flash visual
- Disabled state inclui tooltip explicativo
- Click debounced (evita double-trigger)
- Re-scan após carregamento é automático
- Modal NO_NID navega corretamente para os 2 sub-fluxos

---

### HOME-04 — Sync da página inteira (Drupal → Figma)
**Owner**: Leonardo · **Size**: M · **Sprint**: 4

**Por quê**: User precisa puxar dados publicados pro Figma quando vai editar uma página existente. Sem isso, ele edita às cegas. Como envolve API + sandbox, faz sentido ficar com o Leonardo.

**O quê**: Botão "⬇ Sync" chama `GET /api/nodes/{nid}/sync-payload` (full page) e dispara `apply-sync-page` no sandbox. Confirmação antes mostra resumo do que vai mudar. Progress bar durante. Toast final consolidado.

**Pronto quando**:
- Aplica em todos os módulos da página, não só o selecionado
- Confirmação mostra `X campos em Y módulos serão alterados`
- Erros não param o lote (continua e reporta no final)
- Toast: "X campos atualizados em Y módulos"

---

## EPIC 5 — Bug fix de tipos

### TYPES-01 — Inferir tipo pelo prefixo do nome
**Owner**: Nathanael · **Size**: S · **Sprint**: 1

**Por quê**: Bug visível na tela de templates — tudo aparece como TEXT, mesmo `BOOL_MOSTRAR_BOTAO` e `URL_LINK`. User não confia no catálogo. Fix é trivial mas impacto é grande na percepção do produto.

**O quê**: Em `nodeMapper.ts`, exportar `inferPropTypeFromName(name)` retornando TEXT/BOOLEAN/URL/VARIANT/SLOT/MODULE/COMPONENT pelo prefixo. Aplicar em `templateClient.ts` quando API mandar type genérico ou ausente. `VariationCard` mostra badges com cores corretas. Testes unitários cobrindo todos os prefixos.

**Pronto quando**:
- BOOL_ aparece como toggle azul
- URL_ aparece como link amarelo
- VAR_ aparece como variante roxa
- 12+ casos cobertos em teste unitário

---

## EPIC 6 — Carregamento de propriedades

### PROPS-01 — Loader de propriedades no sandbox
**Owner**: Pedro · **Size**: L · **Sprint**: 4

**Por quê**: Esse é o "milagre" do plugin — user clica um botão e o painel direito do Figma se preenche sozinho com as variáveis certas, linkadas onde precisa. Sem isso o catálogo é só referência decorativa, e UX/DEV ainda precisam configurar tudo manualmente.

**O quê**: Função `loadPropsForModule(node, templateSchema)` no sandbox que:
1. Converte Frame/Group em Component se ainda não é
2. Cria componentProperties guiadas pelo catálogo (não pela inferência de nome)
3. Detecta desk+mobile com mesmo nome → cria **uma única** prop linkada em ambos (é o que faz "muda TXT_TITULO no desk → muda no mobile junto")
4. Props exclusivas (só desk ou só mobile) ficam individuais
5. Retorna `{created, linked, errors}`

**Pronto quando**:
- Mudar TXT_TITULO no painel direito muda no desk E mobile simultaneamente
- Não duplica props que já existem
- Funciona para TEXT, BOOLEAN, VARIANT
- Erros logados sem abortar o lote

---

### PROPS-02 — Batch "Carregar Tudo" + detecção de variante
**Owner**: Pedro · **Size**: M · **Sprint**: 4

**Por quê**: User precisa carregar vários módulos sem ficar clicando em cada um. Detecção de variante é o que permite o workflow "renomeio v02 → v03 e o plugin entende qual é o novo template".

**O quê**: Botão "Carregar Tudo" processa todos os módulos com match em sequência, com progress bar mostrando módulo atual. Quando user renomeia um módulo (ex: v02 → v03), o re-scan detecta a mudança e propõe recarregar as props (que podem ter mudado entre variantes).

**Pronto quando**:
- UX e DEV têm acesso (UX vai ser treinado pra criar módulos)
- Progress visível: `2/8 — Carregando m05_faq_sanfona...`
- Erros não param o lote
- Toast final: `X módulos processados, Y props criadas, Z links, W erros`
- Mudança de variante detectada com UI: "v02 → v03, A props novas, B removidas"
- User confirma antes de recarregar (não auto-aplica)

---

## EPIC 7 — Deploy

### DEPLOY-01 — Polish + retry + cache pós-deploy
**Owner**: Nathanael · **Size**: S · **Sprint**: 5

**Por quê**: O `DeployReviewScreen` e `deployPage` já existem. Falta polish — verificar diff expandível, retry de rede, atualizar cache pós-deploy. Task pequena de fechamento, sem complexidade arquitetural.

**O quê**: Revisar fluxo atual. Adicionar retry com backoff em falhas de rede no `drupalClient.request` (3 tentativas: 1s/2s/4s, só pra 5xx e network errors, não 4xx). Após deploy bem-sucedido, atualizar cache local de `syncPage(nid)` com novos valores.

**Pronto quando**:
- Diff expandível funciona em todos os casos
- Retry transparente em network errors
- Cache atualizado pós-deploy (sem refetch desnecessário)
- Cancelar não deixa estado inconsistente
- Toast informando "tentativa N/3" durante retry

---

### DEPLOY-02 — Async deploy + criar página nova
**Owner**: Leonardo · **Size**: M · **Sprint**: 5

**Por quê**: Deploys grandes dão timeout no síncrono — async resolve. Criar página nova é o caminho UnboundState → Bound e é **acessível a UX e DEV** (UX vai montar página do zero, escanear, carregar props, e dali partir pra criar a página no Drupal recebendo NID gerado). Ambos são integração API + plugin, fica com Leonardo.

**O quê**:
- **Async**: checkbox "Deploy assíncrono" no review usa `?async=true` + polling de `GET /api/jobs/{job_id}` a cada 2s até done/failed
- **Criar página**: form com campos essenciais (title, content_type) que aparece no modal NO_NID do HOME-03 → `POST /api/pages` envia primeiro módulo Figma → recebe `new_nid` → vincula automaticamente ao arquivo Figma → redireciona pra home Bound

**Pronto quando**:
- Deploys >10 módulos podem ser async com 1 click
- Progress mostra status do job (queued, processing, done)
- Timeout configurável (default 5min)
- Form de criação acessível a UX e DEV
- Form valida campos antes de enviar
- Após sucesso, NID auto-vinculado e home atualizada

---

## EPIC 8 — Drupal Node Fields (segunda API do mesmo NID)

### NODE-01 — Ler e exibir campos do node
**Owner**: Leonardo · **Size**: M · **Sprint**: 5

**Por quê**: Cada NID tem 2 fontes de dados — canvas (Cohesion, modules) e fields (title, url_alias, metatags). Hoje só lidamos com canvas. User precisa ver e editar fields também, senão volta no Drupal pra editar e quebra o fluxo "tudo no Figma".

**O quê**: Hook `useNodeFields(nid)` chamando `GET /api/nodes/{nid}/fields`. Card na home (quando NID vinculado) mostrando título, url_alias, status. Cache por NID na sessão (invalidado em deploy).

**Pronto quando**:
- Card aparece quando NID vinculado
- Dados visíveis sem precisar abrir o CMS
- Cache evita refetch repetido na mesma sessão
- Retorna dados tipados (depende de TS-02)

---

### NODE-02 — Editar campos + integrar no deploy review
**Owner**: Leonardo · **Size**: M · **Sprint**: 5-6

**Por quê**: Edição completa o ciclo. Sem isso o user volta pro Drupal pra editar url_alias e metatags, quebrando a proposta de "tudo no Figma".

**O quê**: Aproveitar `NodeFieldsForm.jsx` existente. Validações inline (url_alias formato, required). `PATCH /api/nodes/{nid}/fields` separado do canvas. Na tela de review, separar visualmente "alterações no canvas" e "alterações em campos do node". Deploy aplica os dois separadamente em paralelo.

**Pronto quando**:
- Form edita title, url_alias, metatags com validação
- Campos essenciais ordenados no topo (usando `essential: true` da API)
- Deploy aplica PATCH fields + PUT canvas
- Resultado consolidado mostrado ao final

---

## EPIC 9 — Settings (DEV)

### SETTINGS-01 — Componentizar + cards de cache e debug
**Owner**: Nathanael · **Size**: M · **Sprint**: 6

**Por quê**: DevSettingsTab hoje é arquivo monolítico. Componentizar facilita reuso (mesmos componentes na home detail expandido). Card de cache é necessário pro DEV monitorar e invalidar. Refactor leve, sem urgência.

**O quê**: Extrair `NidSection`, `ApiKeySection`, `EnvSection`, `SchemaSection`, `CacheSection`, `DebugSection`. Card Cache mostra tamanho/idade/ETag/botão limpar. Card Debug com raw JSON da última extração + botão copy + info do NID/env/role.

**Pronto quando**:
- Cada section é um arquivo enxuto
- DevSettingsTab compõe sections (fica magro)
- Card Cache atualiza em tempo real
- Componentes (PropertyList, JsonPreview, NidBadge) reutilizados entre Settings e home detail
- Botão "copiar JSON" funciona

---

## EPIC 10 — Templates page (polish)

### DS-01 — Auditoria + extração de design system
**Owner**: Pedro · **Size**: M · **Sprint**: 6

**Por quê**: Conforme Home, Deploy, Scan e Settings crescem, padrões visuais se repetem (cards de módulo, badges de status, list items, modais de confirmação, headers de seção, etc). Sem auditoria, cada feature implementa do zero e o produto vira um patchwork visual. Consolidar agora deixa a UI consistente e acelera as últimas tasks.

**O quê**:
1. **Auditar componentes existentes** em `src/components/ui/` e `src/ui/components/shared/` — listar o que tem, o que tá duplicado, o que falta
2. **Extrair padrões recorrentes** novos:
   - `<ModuleCard>` — card com status colorido + expand (usado em Home, Deploy review, Scan)
   - `<StatusBadge>` — variantes ✅/⚠️/❌ usadas em vários lugares
   - `<DiffField>` — linha de diff (figma vs drupal) usada em DeployReview e Home expandido
   - `<ActionBar>` — barra horizontal de ações primárias (Home, Templates, Settings)
   - `<EmptyState>` — placeholder com ícone + texto + CTA
   - `<ConfirmDialog>` — modal de confirmação padronizado (usado em vincular NID, criar página, limpar cache, deletar módulo)
3. **Garantir reuso real** — refatorar telas existentes pra consumir os novos componentes (não deixar como biblioteca não-usada)
4. **Documentar** em `docs/DESIGN_SYSTEM.md` com props, variantes e exemplos

**Pronto quando**:
- 6 novos componentes extraídos e documentados
- HomeScreen, DeployReviewScreen, ScanReport, Settings consomem os mesmos componentes (zero duplicação de padrão)
- `DESIGN_SYSTEM.md` lista cada um com signature e exemplo de uso
- Storybook (opcional) ou página `/dev/design-system` interna pra preview

---

### TPL-01 — Filtros + screenshots indicator
**Owner**: Pedro · **Size**: S · **Sprint**: 6

**Por quê**: Catálogo com 185 templates fica difícil de navegar sem filtros. Indicar quais têm screenshot evita placeholders quebrados (404 no preview).

**O quê**: TemplateSearch ganha dropdown "filtrar por tipo de propriedade" (múltiplos selecionáveis). Boot busca `GET /api/screenshots` (lista disponível) e marca templates com badge "tem preview". Sem screenshot → ícone genérico.

**Pronto quando**:
- Filtro funciona com seleção múltipla de tipos
- Contador "X templates com BOOL_"
- Templates sem screenshot mostram ícone, não 404

---

## EPIC 11 — Testes

### TEST-01 — Setup Vitest + mock figma + testes de lógica
**Owner**: Pedro · **Size**: L · **Sprint**: 7

**Por quê**: Sem testes, cada PR é roleta-russa. Os arquivos de **lógica pura em `src/utils/` e `src/api/`** (os "maps") são onde mais bugs aparecem porque concentram regras complexas de transformação, mapeamento desk/mobile, e normalização de payload. Testar essas funções isoladamente cobre 80% do risco com 20% do esforço.

**O quê**:
1. Instalar `vitest` + `@vitest/coverage-v8` + `jsdom` + `@testing-library/react` + `@testing-library/jest-dom`
2. Script `npm test` e `npm run test:coverage`
3. Mock global de `figma.*` em `src/test/figmaMock.ts` (cobrindo `currentPage`, `root`, `clientStorage`, `ui`, `loadAllPagesAsync`, `notify`, `loadFontAsync`, etc)
4. **Testes unitários dos maps de lógica** — cobertura por arquivo:

| Arquivo | Funções a testar | Casos mínimos |
|---|---|---|
| `utils/nodeMapper.ts` | `buildNodeMap`, `getBaseModuleName`, `extractMetadataFromName`, `buildModuleTree`, `extractDataFromNodeMap`, `extractWithSchema`, `matchModuleToTemplate`, `identifySharedProps`, `inferPropTypeFromName`, `buildFullPageScanReport` | desk-only, mobile-only, shared, mixed, `{type:...}` annotation, módulos sem prefixo, nomes vazios |
| `utils/pageDiffer.ts` | `diffModuleData`, `diffPage` | igual, alterado, adicionado, removido, valores nulos, diff de página completa |
| `utils/colorMap.ts` | `extractMappedColor` | cor hex, RGB, gradient, sem fill |
| `utils/scanValidator.ts` | (validações de scan) | módulo válido, inválido, parcial |
| `utils/essentialFields.ts` | (filtros de essential) | filtro por flag, ordenação |
| `api/templateClient.ts` | `normalizeTemplateResponse`, `humanizeModuleName`, `inferPropTypeFromName` (uso) | v1 com fields, v2 com figma_properties, mixed payload, CTA/FAQ/acentos |
| `api/drupalClient.ts` | `deployPage` (loop sequencial), `withEnv` (helper) | 1 módulo, N módulos, com/sem env_host, drupal-only filter |

**Pronto quando**:
- `npm test` roda local e em CI
- Coverage >85% em `src/utils/` e >70% em `src/api/`
- Mock cobre 80% da API do `figma` usada pelo plugin
- `docs/TESTING.md` documenta como adicionar novos testes

---

### TEST-02 — Integração API + CI
**Owner**: Leonardo · **Size**: M · **Sprint**: 7

**Por quê**: Leonardo conhece os contratos da API, é quem melhor escreve testes que mockam endpoints. CI fecha o ciclo bloqueando merge se algo quebrar.

**O quê**: `msw` (mock service worker) simulando endpoints `/api/*`. Testes de `drupalClient.deployPage`, `syncPage`, error handling, retry. GitHub Actions rodando `tsc`, `test`, `build` em todo PR pra DEV e main.

**Pronto quando**:
- Happy path + 4xx + 5xx + network errors cobertos
- Retry testado (sucesso após 2 falhas, exaustão após 3)
- CI bloqueia merge em falha
- Coverage report comentado no PR
- Cache de node_modules no CI

---

### TEST-03 — E2E web-based (Playwright)
**Owner**: Pedro · **Size**: L · **Sprint**: 7-8

**Por quê**: Você pediu testes "web-based pra rodar sem Figma". Playwright dirige a UI standalone com `figma` mockado, garantindo que o fluxo end-to-end (login → scan → load props → deploy) funciona sem precisar abrir o Figma real.

**O quê**: Setup que sobe `index.html` como página standalone com mock injection global de `figma`. Playwright dirige o browser cobrindo fluxo principal. Roda em CI headless.

**Pronto quando**:
- Login → scan → load props → deploy roda automaticamente
- Roda em CI sem flakiness
- Documentado em `docs/TESTING.md` com instruções pra adicionar novos cenários

---

## EPIC 12 — Estabilização

### STAB-01 — Bug bash + performance
**Owner**: Pedro · **Size**: M · **Sprint**: 8

**Por quê**: Última quinzena antes do prazo. Tempo dedicado pra resolver o que aparecer nos testes do time e otimizar onde estiver lento. Sem isso, o produto chega em produção com problemas que aparecem no primeiro dia.

**O quê**: Fila de bugs reportados durante sprints 1-7. Profiling do plugin com Figma profiler. Otimizar `buildModuleTree` em arquivos grandes se necessário. Revisar memory leaks em mensagens não-removidas no `window.addEventListener`.

**Pronto quando**:
- Zero bug crítico em aberto
- Plugin abre em <3s em arquivo médio
- Scan completa em <5s em arquivo de 50 módulos
- Memory profile estável (sem leaks visíveis)

---

### STAB-02 — Documentação final + onboarding
**Owner**: Nathanael · **Size**: S · **Sprint**: 8

**Por quê**: Produto entregue precisa de doc pra time crescer e pro user usar. Tarefa estratégica pequena, fechamento natural pro lead da frente.

**O quê**: README atualizado com screenshots e fluxo. `docs/USER_GUIDE.md` (UX) e `docs/DEV_GUIDE.md` (DEV). `docs/ARCHITECTURE.md` resumido em uma página. Instruções de setup pro próximo dev no time.

**Pronto quando**:
- README mostra o que o plugin faz em 30s de leitura
- USER_GUIDE com screenshots do fluxo principal
- DEV_GUIDE explica build, deploy, debug
- ARCHITECTURE descreve as camadas em 1 página

---

# 📊 Distribuição final

## Por pessoa

### Nathanael (7 tasks · 1 done, 6 pendentes)
| Status | Sprint | Task | Size |
|---|---|---|---|
| ✅ | 1 | PRE-01 — Fix manifest allowedDomains | S |
| ⏭️ | 1 | TS-01 — Completar setup TypeScript | S |
| ⏭️ | 1 | TYPES-01 — Bug tipos prefixo | S |
| ⏭️ | 3 | HOME-03 — State machine + botão condicional | M |
| ⏭️ | 5 | DEPLOY-01 — Polish do deploy | S |
| ⏭️ | 6 | SETTINGS-01 — Componentizar settings | M |
| ⏭️ | 8 | STAB-02 — Doc final | S |

**Total restante**: 4 × S + 2 × M ≈ 8-10 dias úteis em 5 sprints. Folga garantida pros outros projetos.

### Pedro (11 tasks)
| Sprint | Task | Size |
|---|---|---|
| 1-2 | TS-03 — Migrar feature components + stores + hooks + plugin pra TS | L |
| 2 | BOOT-01 — Boot screen + cache local | M |
| 3 | HOME-01 — Reestruturar home | M |
| 3 | HOME-02 — Scan engine + lista | L |
| 4 | PROPS-01 — Loader no sandbox | L |
| 4 | PROPS-02 — Batch + detecção variante | M |
| 6 | DS-01 — Auditoria + extração de design system | M |
| 6 | TPL-01 — Filtros + screenshots | S |
| 7 | TEST-01 — Setup + unit (maps) | L |
| 7-8 | TEST-03 — E2E Playwright | L |
| 8 | STAB-01 — Bug bash + perf | M |

### Leonardo (8 tasks)
| Sprint | Task | Size |
|---|---|---|
| 1 | TS-02 — utils + api para TS | M |
| 1-2 | AUTH-01 — Portal Azure + exchange | L |
| 2 | AUTH-02 — Login + refresh no plugin | M |
| 4 | HOME-04 — Sync da página inteira | M |
| 5 | DEPLOY-02 — Async + criar página | M |
| 5 | NODE-01 — Ler campos do node | M |
| 5-6 | NODE-02 — Editar campos + deploy review | M |
| 7 | TEST-02 — Integração API + CI | M |

### Matheus (1 task + suporte CI)
| Sprint | Task | Size |
|---|---|---|
| 2 | CACHE-01 — Main cache backend + ETag | L |
| 7 | (suporte CI em TEST-02) | — |

---

## 🚦 Caminho crítico

Tasks que travam o resto se atrasarem:

```
TS-01 (Nat, S1)
   ↓
TS-02 (Leonardo, S1) — destrava o front todo a usar tipos
   ↓
BOOT-01 (Pedro, S2) — sem boot, não tem Home
   ↓
HOME-01 (Pedro, S3) → HOME-02 (Pedro, S3) → HOME-03 (Nat, S3)
                                              ↓
                                       PROPS-01 (Pedro, S4)
                                              ↓
                                       PROPS-02 (Pedro, S4)
```

E em paralelo (não trava o front, mas precisa estar pronto antes do S2):
```
CACHE-01 (Matheus, S2) ─── viabiliza BOOT-01
AUTH-01 (Leonardo, S1-2) ─── viabiliza AUTH-02
```

**Único item do Nathanael no caminho crítico**: HOME-03 (state machine). É `M` (1-2 dias). Não pode atrasar do Sprint 3.

---

## 🏷️ Como importar no GitLab

Cada section `### XXX-NN` vira uma **Issue** no GitLab. Sugestão de uso:

- **Title da issue** = título da task (ex: `[HOME-03] State machine + botão condicional`)
- **Description** = blocos "Por quê", "O quê", "Pronto quando" copiados desta doc
- **Labels** (criar antes no projeto):
  - `epic::auth` `epic::cache` `epic::home` `epic::props` `epic::deploy` `epic::node` `epic::settings` `epic::templates` `epic::test` `epic::stab` `epic::ts` `epic::types` `epic::ds`
  - `size::s` `size::m` `size::l`
  - `sprint::1` até `sprint::8`
  - `status::todo` `status::wip` `status::review` `status::done`
- **Assignee** = owner da task
- **Milestone** = Sprint N (vincula às datas do Gantt)
- **Weight** = 1 (S) / 3 (M) / 5 (L)

### Fluxo de branch sugerido
- `main` ← merge só de releases
- `DEV` ← branch de integração
- `feature/<TASK-ID>-<slug>` ← branch da task (ex: `feature/HOME-03-state-machine`)

MR sempre pra `DEV` com label da task no título e referência à issue (`Closes #123`). CI rodando typecheck + test + build (ver TEST-02).

---

## 📌 Próximos passos imediatos

1. ✅ **BOARD revisado** (este doc)
2. ✅ **PRE-01 feito** — manifest corrigido, build limpo, plugin destravado
3. ⏭️ **Cada dev do time reimporta o plugin no Figma** (Plugins → Development → Import plugin from manifest) — sem isso ainda dá Failed to fetch no Figma deles
4. ⏭️ **Importar as 26 tasks restantes no GitLab** com labels, milestones e weights
5. ⏭️ **Kick-off com Leonardo + Pedro + Matheus** alinhando S1
6. ⏭️ **Nathanael**: começar TS-01 + TYPES-01 (S1 sem 1)
7. ⏭️ **Leonardo**: começar TS-02 + AUTH-01 em paralelo (S1 sem 1)
8. ⏭️ **Matheus**: começar CACHE-01 (S1 sem 1, lead time pra pronto no S2)
9. ⏭️ **Pedro**: aguardar TS-01 + TYPES-01 fecharem pra começar TS-03 (precisa do tsconfig validado)

---

**Maintainer**: Nathanael
