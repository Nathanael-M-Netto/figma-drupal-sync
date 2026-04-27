# TIM Cohesion Export — Figma-Drupal Sync Plugin

Plugin do Figma para sincronização bidirecional entre design (Figma) e conteúdo (Drupal CMS). Extrai dados visuais de módulos no Figma e envia para o Drupal via API, e permite puxar dados do Drupal de volta para atualizar a tela do Figma instantaneamente.

## Arquitetura v2.0

O projeto foi construído com **Vite + React** e compilado para o formato que o Figma exige: um único `code.js` (backend sandbox) e um único `index.html` com todo CSS e JS embutidos inline (frontend UI).

```
┌──────────────────────────────────────────────────────────────────┐
│  FIGMA DESKTOP                                                   │
│                                                                  │
│  ┌───────────────┐   postMessage    ┌──────────────────────────┐ │
│  │   Sandbox     │ ◄──────────────► │   UI (iframe)            │ │
│  │   code.js     │                  │   index.html (React)     │ │
│  │               │                  │                          │ │
│  │  • NID        │                  │  • Componentes React     │ │
│  │  • Extração   │                  │  • drupalClient.js ──────┼─┼──► Drupal API
│  │  • Sync       │                  │  • useFigmaMessages.js   │ │
│  │  • nodeMapper │                  │  • Design System (CSS)   │ │
│  └───────────────┘                  └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Por que o fetch roda na UI?** O sandbox do Figma é isolado — não tem acesso à rede, DOM ou browser. Toda requisição HTTP é feita pelo iframe (UI), que repassa os dados para o sandbox aplicar nos nós do Figma.

---

## Funcionalidades

### NID Persistence Global

O plugin vincula o **arquivo inteiro do Figma** a uma página do Drupal pelo NID (Node ID). O NID fica salvo na raiz do documento (`figma.root`) via `pluginData`. Independentemente de qual página ou tela do Figma você esteja editando, todos os deploys e syncs apontarão para o mesmo NID.

### Autenticação via API Key

A comunicação com o Drupal exige uma API Key (`X-TIM-Key`), configurada na aba **Dev Settings** e salva de forma persistente no aplicativo local do usuário via `figma.clientStorage`.

### Interface Dupla

| Aba              | Público         | Funcionalidades                                              |
| ---------------- | --------------- | ------------------------------------------------------------ |
| **Designer**     | Designers       | Criar página, deploy, sync, download JSON                    |
| **Dev Settings** | Desenvolvedores | Schema management, forçar NID, JSON manual, preview extração |

### Dois Estados UX

| Estado               | Descrição                                                                    |
| -------------------- | ---------------------------------------------------------------------------- |
| **Unbound (sem NID)**| Card "Página Nova" + campo para vincular NID                                 |
| **Bound (com NID)**  | Badge do NID vinculado + botões diretos de Deploy, Sync e Download           |

### ★ Multi-Mapeamento (Desktop/Mobile)

Se existem dois elementos com o mesmo nome de propriedade (ex: `TXT_TITULO` na versão Desktop e na versão Mobile), o plugin os agrupa em um array e aplica o valor em **todos** durante o Sync. Nenhum nó é ignorado silenciosamente.

### Leitura Hierárquica de Módulos

O plugin lê a árvore de camadas da página e identifica a ordem visual dos módulos (de cima para baixo, pelo eixo Y). Isso garante que o JSON enviado para o Drupal respeite a ordem dos blocos na página.

### Extração de Dados

| Tipo de Layer             | Regra de Extração                                        |
| ------------------------- | -------------------------------------------------------- |
| Textos (`CAIXA_ALTA_COM_`)| Extrai conteúdo textual                                  |
| Componentes (`MOD_`, `COMP_`)| Extrai VARIANTs e BOOLEANs das instâncias             |
| Cores (`VAR_CORES`)       | Lê o fill RGB e traduz para string Drupal (ex: `white`)  |

### Sync Bidirecional

| Direção                       | Descrição                                                     |
| ----------------------------- | ------------------------------------------------------------- |
| **Deploy (Figma → Drupal)**   | Envia dados extraídos do Figma para a API                     |
| **Sync (Drupal → Figma)**     | Puxa dados do Drupal e atualiza todos os nós correspondentes  |
| **Duplicatas**                | Se existirem nós com o mesmo nome, todos são atualizados      |

---

## Setup

### Pré-requisitos

- **Node.js** v18 ou superior
- **npm** v9 ou superior
- **Figma Desktop** (o plugin não funciona no browser)

### Instalação

```bash
# Clonar o repositório
git clone <repo-url> figma-drupal-sync
cd figma-drupal-sync

# Instalar dependências
npm install

# Compilar o plugin (gera dist/code.js + dist/index.html)
npm run build
```

### Comandos Disponíveis

| Comando             | Descrição                                                  |
| ------------------- | ---------------------------------------------------------- |
| `npm run build`     | Build completo (UI + plugin)                               |
| `npm run build:ui`  | Compila apenas a UI React → `dist/index.html` (inline)     |
| `npm run build:plugin` | Compila apenas o sandbox → `dist/code.js` (IIFE)       |
| `npm run dev`       | Dev server Vite (preview local da UI)                      |

### Carregar no Figma

1. Execute `npm run build`
2. Abra o **Figma Desktop**
3. Menu → Plugins → Development → **Import plugin from manifest...**
4. Selecione o `manifest.json` deste repositório
5. O plugin carregará `dist/code.js` e `dist/index.html` automaticamente

### Workflow de Desenvolvimento

```bash
# Terminal 1: Watch da UI (recompila a cada mudança)
npm run build:ui -- --watch

# Terminal 2: Watch do plugin (recompila a cada mudança)
npm run build:plugin -- --watch

# No Figma: Ctrl+Shift+R para recarregar o plugin
```

---

## Estrutura do Projeto

```
figma-drupal-sync/
├── manifest.json               # Config do plugin Figma (aponta para dist/)
├── package.json                # Dependências e scripts
├── vite.config.js              # Build da UI (React → HTML inline via singlefile)
├── vite.config.plugin.js       # Build do sandbox (JS → IIFE)
├── index.html                  # Entry HTML do Vite
│
├── src/
│   ├── plugin/
│   │   └── main.js             # Backend Figma (sandbox isolado)
│   │
│   ├── api/
│   │   └── drupalClient.js     # Cliente HTTP otimizado (chamada única)
│   │
│   ├── utils/
│   │   ├── colorMap.js         # Mapeamento de cores HEX → string Drupal
│   │   └── nodeMapper.js       # ★ Multi-mapeamento + hierarquia de módulos
│   │
│   └── ui/
│       ├── main.jsx            # Entry point React
│       ├── App.jsx             # Componente raiz (orquestrador)
│       ├── App.css             # Design system (Figma-native vars)
│       ├── hooks/
│       │   └── useFigmaMessages.js  # Hook de comunicação bidirecional
│       └── components/
│           ├── TabBar.jsx           # Barra de abas (Designer / Dev)
│           ├── DesignerTab.jsx      # Aba Designer (Bound/Unbound)
│           ├── DevSettingsTab.jsx   # Aba Dev Settings
│           ├── NidBadge.jsx         # Badge animada do NID
│           ├── PropertyList.jsx     # Lista de propriedades extraídas
│           ├── StatusBar.jsx        # Barra de status
│           └── Modal.jsx           # Modal genérico
│
├── dist/                       # Output de build (gerado)
│   ├── index.html              # UI completa (CSS+JS inline) ~167KB
│   └── code.js                 # Sandbox IIFE ~7.5KB
│
├── _backup/                    # Arquivos originais (v1.0)
├── DOCS.md                     # Documentação técnica detalhada
└── .gitignore
```

---

## Schema JSON

O schema define as propriedades esperadas de cada módulo:

```json
{
  "componentName": "modulo_1_hero_para_carrossel",
  "properties": [
    { "name": "TXT_TITULO", "type": "TEXT" },
    { "name": "PHOTO_CIRCLE", "type": "BOOLEAN" },
    { "name": "VAR_CORES", "type": "VARIANT" },
    { "name": "SLOT_DESKTOP_BUTTON", "type": "SLOT" }
  ]
}
```

**Tipos suportados:**

| Tipo      | Descrição                                                 |
| --------- | --------------------------------------------------------- |
| `TEXT`     | Texto editável (linkado ao TextNode pelo nome da camada)  |
| `BOOLEAN`  | Toggle on/off                                            |
| `VARIANT`  | Opção de variante (cores, estilos)                       |
| `SLOT`     | Marcador estrutural — ignorado na extração               |

---

## Mapeamento de Cores

| HEX Figma | String Drupal |
| ---------- | ------------- |
| `FFFFFF`   | `white`       |
| `000000`   | `black`       |
| `F2F2F2`   | `grey`        |
| `000A3D`   | `dark_blue`   |
| `0041E6`   | `blue`        |
| `FF0000`   | `red`         |

Cores não mapeadas retornam `cor_nao_mapeada_XXXXXX`.

---

## API Endpoints

| Método | Rota                              | Descrição                       |
| ------ | --------------------------------- | ------------------------------- |
| `POST` | `/api/figma/page`                 | Deploy (com ou sem NID)         |
| `GET`  | `/api/figma/pull/{nid}`           | Sync — busca dados pelo NID     |
| `GET`  | `/api/figma/templates`            | Busca schema de módulo          |

### Payload de Deploy (módulo único)

```json
{
  "target_nid": "140421",
  "module_name": "modulo_1_hero_para_carrossel",
  "data": {
    "TXT_TITULO": "Bem-vindo",
    "VAR_CORES": "dark_blue",
    "PHOTO_CIRCLE": true
  }
}
```

### Payload de Deploy (página inteira — hierárquico)

```json
{
  "target_nid": "140421",
  "modules": [
    {
      "module_name": "modulo_1_hero",
      "order": 0,
      "data": { "TXT_TITULO": "Bem-vindo" }
    },
    {
      "module_name": "modulo_2_cards",
      "order": 1,
      "data": { "TXT_CARD_1": "Card 1" }
    }
  ]
}
```

---

## Stack

| Tecnologia                | Uso                                      |
| ------------------------- | ---------------------------------------- |
| Figma Plugin API (v1)     | Comunicação com o Figma Desktop          |
| React 18                  | Interface do plugin (UI)                 |
| Vite 6                    | Build tool (dev server + bundler)        |
| vite-plugin-singlefile    | Embute CSS+JS inline no HTML             |
| @figma/plugin-typings     | Tipagens do Figma para desenvolvimento   |
