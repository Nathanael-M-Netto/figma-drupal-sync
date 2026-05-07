# 🚀 Pitch de Apresentação: Figma → Drupal — Deploy Direto do Design

---

## A Dor Que Estamos Resolvendo

Hoje, o ciclo de vida de uma página web na nossa operação segue um caminho longo e propenso a erros:

```
Designer cria no Figma → Entrega assets → Desenvolvedor monta no Drupal/Cohesion → QA valida → Correções → Repeat
```

**O problema não é a habilidade do time — é o processo.**

| Problema | Impacto Real |
|----------|-------------|
| Montagem manual no Cohesion | **~2-4h por página**, dependendo da complexidade |
| Ruído entre design e implementação | Fontes trocadas, espaçamentos errados, variantes incorretas — **retrabalho constante** |
| Dependência de desenvolvedor front-end | O designer não tem autonomia; **time-to-market atrasado** |
| Sem fonte única de verdade | Figma diz uma coisa, Drupal diz outra — **quem está certo?** |

> **Nossa proposta:** eliminar esse gap inteiro com um **Plugin de Figma profissional** que transforma o próprio design em uma fonte de verdade operacional, capaz de ler, mapear e deployar conteúdo diretamente no Drupal.

---

## A Solução: Um Plugin Inteligente com 4 Etapas

O plugin funciona como uma **ponte direta e bidirecional** entre o Figma e o nosso CMS Drupal+Cohesion, através da API REST que o DevOps já está construindo no Azure.

### Etapa 1 — Autenticação Segura

O plugin abre com uma tela de login limpa e profissional.

- **Hoje (MVP):** Login interno com API Key gerenciada, suficiente para validação e desenvolvimento
- **Futuro imediato:** OAuth/JWT integrado com o sistema corporativo (endpoints `/api/auth/*` já desenhados com o DevOps)
- O plugin diferencia automaticamente dois perfis:
  - **UX Designer** — foco em visualização e deploy de conteúdo
  - **DEV** — acesso a ferramentas avançadas (schemas, JSON, configuração de templates)

### Etapa 2 — Reconhecimento de Contexto Automático (NID Intelligence)

Após autenticar, o plugin **entende onde está** lendo o arquivo Figma atual:

1. Verifica se o documento Figma já possui um **NID** (Node ID do Drupal) vinculado (persistido via `pluginData`)
2. Se existir NID → **sincronização silenciosa em background**:
   - Faz `GET /api/figma/pull/{nid}` para ler os valores atuais no servidor
   - Compara com o que está no Figma local
   - Exibe um banner inteligente: `"✅ Sincronizado"` ou `"⚠️ 3 campos desatualizados — Clique para ver"`
3. Se não existir → apresenta a Home "desvinculada", guiando o usuário a vincular um NID existente ou criar uma página nova

> **O resultado:** ao abrir o plugin, em **menos de 2 segundos** o designer já sabe se o design está alinhado com a produção.

### Etapa 3 — Mapeamento Inteligente de Módulos

Aqui está o coração técnico do plugin. O designer seleciona um grupo ou frame no Figma, e o motor de scan faz o resto:

**O que o scanner faz:**
1. **Identifica módulos** — Varre as subcamadas procurando frames que batem com nossos templates do Cohesion (match por nome com tolerância fuzzy)
2. **Extrai propriedades** — Reconhece prefixos padronizados:

   | Prefixo | Tipo | Exemplo |
   |---------|------|---------|
   | `TXT_` | Texto editável | `TXT_TITULO_HERO`, `TXT_DESCRICAO` |
   | `BOOL_` | Toggle (visibilidade) | `BOOL_MOSTRAR_BOTAO` |
   | `VAR_` | Variante de componente | `VAR_COR_FUNDO` |
   | `URL_` | Link / imagem | `URL_IMAGEM_DESKTOP` |
   | `MOD_` | Frame de módulo | `MOD_HERO_PRINCIPAL` |

3. **Multi-mapeamento Desktop↔Mobile** — Se um módulo tem subcamadas `_desktop` e `_mobile`, props com o **mesmo nome** em ambos são linkadas a **uma única Component Property do Figma**. Alterar o título no desktop altera automaticamente no mobile — **zero trabalho duplicado**
4. **Campos essenciais** — O sistema verifica campos obrigatórios do Drupal (como `PAGE_TITLE`, `META_DESCRIPTION`, `FIELD_TAG`). Se algum não for encontrado no design, mostra um formulário inline para o designer preencher na hora

**O que o designer vê:**
- Lista visual dos módulos detectados com badges de status (✅ OK, ⚠️ Parcial, ❌ Faltando)
- Sugestões inteligentes: *"Renomeie 'Título Principal' para 'TXT_TITULO_HERO' para vincular ao template Hero"*
- Contagem de propriedades identificadas vs esperadas
- Preview do JSON que será enviado (modo DEV)

### Etapa 4 — Review Inteligente e Deploy

Antes de qualquer alteração no servidor, o plugin apresenta uma **tela de confirmação completa**:

**Cenário A — Página Nova:**
```
Plugin → Pede URL/Título/Metatags → POST /api/figma/page → Drupal cria o NID → Plugin vincula automaticamente
```
- O designer define título, URL slug e meta description
- O plugin gera o payload completo e faz o deploy em uma única chamada
- O novo NID é vinculado automaticamente ao arquivo Figma

**Cenário B — Atualização (Diff Engine):**
```
Plugin → GET /api/figma/pull/{nid} → Compara local vs servidor → Mostra diff visual → POST /api/variants/preview
```
- Motor de diff visual mostra **apenas o que mudou** (✏️ alterado, ➕ adicionado, ➖ removido)
- Cada campo pode ser incluído/excluído individualmente do deploy
- Campos do content-type Drupal (metatags, flags booleanas) podem ser editados na mesma tela
- Um clique → tudo vai para o Drupal em **uma única chamada API** (`/api/variants/preview`)

> **Resultado final:** O designer que criou a página é o mesmo que faz o deploy. Sem intermediários, sem interpretação, sem retrabalho.

---

## Design System: Estética "Liquid Glass"

Como estamos criando uma ferramenta **para designers**, a interface não pode ser apenas funcional — **precisa ser uma referência visual**.

### Princípios do Design System

| Princípio | Implementação |
|-----------|--------------|
| **Glassmorphism Premium** | Painéis translúcidos com `backdrop-filter: blur(16px)`, bordas com gradientes sutis e separação em camadas visuais |
| **Responsividade Nativa** | O plugin se adapta automaticamente ao formato da sidebar do Figma (vertical/horizontal) enviando `postMessage` de resize |
| **Micro-animações** | Transições de tela, badges pulsantes, efeitos de hover — tudo com Framer Motion para suavidade a 60fps |
| **Hierarquia de Superfícies** | 4 níveis de profundidade (Level 0 = fundo → Level 3 = destaque), cada um com blur e opacidade distintos |
| **Dark Mode First** | Integração com as variáveis nativas do Figma (`--figma-color-bg`, `--figma-color-text`) para se adaptar ao tema do usuário |

### Componentes-Chave

- **`<GlassSurface />`** — Componente base com filtro SVG `feDisplacementMap` para refração cromática orgânica. Sem dependências externas — puro CSS + SVG
- **`<GlassCard />`** — Wrapper para cards de módulos, templates e status — glassmorphism consistente em toda a interface
- **Skeleton Loaders** — Animações shimmer durante carregamentos de API, mantendo a percepção de performance mesmo em chamadas de ~2s ao Drupal

---

## Arquitetura Técnica

### Stack Atual

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **UI Framework** | React 18 + Vite | Ecossistema maduro, hot-reload, build inline via `vite-plugin-singlefile` |
| **State Management** | Zustand | Stores modulares (auth, scan, templates, deploy, app) — leve e sem boilerplate |
| **Animações** | Framer Motion | Transições de tela, badges animados, micro-interações fluidas |
| **Design System** | CSS Vars + SVG Filters | Zero dependências externas, máxima compatibilidade com o Chromium do Figma |
| **Build** | Vite (dual config) | UI → `dist/index.html` (inline) / Plugin → `dist/code.js` (IIFE) |

### Arquitetura de Comunicação

```
┌─────────────────────────┐     postMessage     ┌──────────────────────┐
│   SANDBOX (main.js)     │◄───────────────────►│   UI (React App)     │
│                         │                      │                      │
│ • Leitura de nós Figma  │                      │ • Interface visual   │
│ • Extração de dados     │                      │ • Chamadas HTTP/API  │
│ • Property injection    │                      │ • State management   │
│ • NID persistence       │                      │ • Deploy/Sync flows  │
│                         │                      │                      │
│ ⚠️ SEM acesso à rede    │                      │ ✅ Acesso à rede     │
└─────────────────────────┘                      └─────────┬────────────┘
                                                           │
                                                     fetch (HTTPS)
                                                           │
                                                 ┌─────────▼────────────┐
                                                 │  API Middleware       │
                                                 │  (Azure Container)   │
                                                 │                      │
                                                 │ • /api/variants/*    │
                                                 │ • /api/figma/*       │
                                                 │ • /api/nodes/*       │
                                                 │ • /api/content-types │
                                                 └─────────┬────────────┘
                                                           │
                                                       SSH / Drush
                                                           │
                                                 ┌─────────▼────────────┐
                                                 │  Drupal + Cohesion   │
                                                 │  (Acquia Cloud)      │
                                                 └──────────────────────┘
```

### Endpoints da API (já implementados pelo DevOps)

| Endpoint | Uso no Plugin |
|----------|--------------|
| `GET /api/variants/templates` | Catálogo completo de módulos e variantes |
| `GET /api/variants/templates/{name}` | Template com skeleton Cohesion completo |
| `GET /api/figma/templates` | Schemas mínimos para injeção de propriedades |
| `GET /api/figma/pull/{nid}` | Sync: lê valores atuais da página no Drupal |
| `POST /api/figma/page` | Deploy: escreve canvas no Drupal |
| `POST /api/variants/preview` | Deploy unificado: canvas + campos do node |
| `GET /api/nodes/{nid}/content-type` | Identifica o tipo do content-type do NID |
| `GET /api/content-types/{type}` | Schema dos campos editáveis |

### Estrutura do Projeto

```
src/
├── plugin/              # Sandbox Figma (sem acesso à rede)
│   └── main.js          # Leitura de nós, extração, property injection
├── api/                 # Clientes HTTP modulares
│   ├── authClient.js    # Login/logout (mock → OAuth futuro)
│   ├── drupalClient.js  # Deploy, sync, page management
│   └── templateClient.js # Catálogo de templates
├── utils/               # Lógica de negócio isolada
│   ├── nodeMapper.js    # Motor de scan, fuzzy match, multi-mapeamento
│   ├── colorMap.js      # Cores Figma → nomes semânticos Drupal
│   ├── scanValidator.js # Validação de prefixos
│   └── essentialFields.js # Campos obrigatórios do Drupal
└── ui/                  # Frontend React
    ├── components/      # Organizados por domínio (auth/, home/, scan/, deploy/, etc.)
    ├── hooks/           # useFigmaMessages, useAuth, useScan, useTemplates
    └── stores/          # Zustand: authStore, appStore, scanStore, templateStore, deployStore
```

---

## Próximos Passos e Evolução

### Curto Prazo (Em andamento)
- [ ] Autenticação OAuth real (aguardando endpoints do backend)
- [ ] Listagem funcional de NIDs de FAQs e Ofertas com busca por nome
- [ ] `field_tag` como checkbox nativo no plugin
- [ ] Preview visual de variantes dentro do catálogo

### Médio Prazo
- [ ] Suporte a taxonomias regionais (DDD, regiões) via relationships do Drupal
- [ ] Histórico de deploys com rollback
- [ ] Mode batch: deploy de múltiplas páginas em sequência
- [ ] Notificações push quando alguém altera a página no Drupal

### Longo Prazo (Visão)
- [ ] AI-assisted: sugestões automáticas de conteúdo baseado em templates similares
- [ ] Integração com pipeline CI/CD: deploy do Figma → staging → aprovação → produção
- [ ] Métricas de uso: quais templates são mais usados, tempo médio de deploy, etc.

---

## Resultados Esperados

| Métrica | Antes | Depois |
|---------|-------|--------|
| Tempo para deployar uma página | 2-4 horas | **~15 minutos** |
| Intermediários no processo | Designer + Dev + QA | **Apenas o Designer** |
| Fidelidade design ↔ produção | ~85% (variável) | **100%** (mesma fonte) |
| Retrabalho por comunicação | Frequente | **Zero** |
| Autonomia do designer | Nenhuma sobre CMS | **Total** |

> **Com essa ferramenta, não estamos apenas otimizando tempo. Estamos dando ao designer o controle completo do ciclo de vida da página — do conceito ao deploy — com uma interface que ele vai ter prazer em usar.**

---

*Plugin Figma-Drupal Sync v4.0 — Production Ready*
