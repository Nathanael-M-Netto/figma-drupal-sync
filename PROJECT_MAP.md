# Project Map — Figma-Drupal Sync v3.0

Este documento serve como um guia mestre para entender a função de cada arquivo no projeto e como eles se conectam. Use este mapa para navegar pela arquitetura e realizar manutenções.

---

## 🏗️ Core & Entry Points

| Arquivo | Função |
| :--- | :--- |
| `manifest.json` | Arquivo de configuração do Figma. Define o nome do plugin, permissões de rede e aponta para os binários de build em `dist/`. |
| `index.html` | Template HTML para a interface. O Vite o utiliza para injetar o React. Contém a div `#root`. |
| `package.json` | Gerencia dependências e scripts de build (`npm run build`, `npm run dev`). |
| `tsconfig.json` | Configuração do TypeScript (usado apenas para Intellisense, já que o código é JS/JSX). |
| `vite.config.js` | Configuração de build da **UI**. Gera o `dist/index.html` com CSS/JS inline. |
| `vite.config.plugin.js`| Configuração de build do **Plugin**. Gera o `dist/code.js` (IIFE). |

---

## 🛠️ Backend do Plugin (Sandbox)

| Arquivo | Função |
| :--- | :--- |
| `src/plugin/main.js` | **O Cérebro do Plugin.** Roda no ambiente isolado do Figma. Lê nós, gerencia o NID persistente, e responde a mensagens da UI. Não tem acesso à rede. |

---

## 🎨 UI Core (React)

| Arquivo | Função |
| :--- | :--- |
| `src/ui/main.jsx` | Ponto de entrada do React. Monta o componente `<App />`. |
| `src/ui/App.jsx` | **Orquestrador da UI.** Gerencia rotas, autenticação e a comunicação entre as telas. |
| `src/ui/App.css` | **Design System.** Contém todas as variáveis de cores, estilos Glassmorphism e classes globais. |

---

## 💾 State Management (Zustand)

Localizados em `src/ui/stores/`:

| Arquivo | Função |
| :--- | :--- |
| `authStore.js` | Gerencia estado de login, perfil do usuário (UX/DEV) e persistência de token. |
| `appStore.js` | Controla a navegação entre telas e o sistema de notificações (Toasts). |
| `scanStore.js` | Armazena o progresso do scanner, o relatório de erros e o estado do deploy. |
| `templateStore.js`| Faz o cache do catálogo de templates vindo da API do Drupal. |

---

## 🌐 API Layer

Localizados em `src/api/`:

| Arquivo | Função |
| :--- | :--- |
| `authClient.js` | Comunicação com o endpoint de login. |
| `drupalClient.js` | Cliente principal para Deploy e Sync de dados. Implementa o **Single-Call Deploy**. |
| `templateClient.js` | Busca o catálogo de templates e campos permitidos no Drupal. |

---

## 🧠 Business Logic & Utils

Localizados em `src/utils/`:

| Arquivo | Função |
| :--- | :--- |
| `nodeMapper.js` | **Lógica Crítica.** Agrupa nós do Figma por nome, identifica Desktop/Mobile e extrai dados estruturados. |
| `colorMap.js` | Traduz cores HEX do Figma para os nomes de cores esperados pelo Drupal. |
| `scanValidator.js` | Regras de validação que comparam o que está no Figma vs o que o Drupal permite. |

---

## ⚓ Hooks Customizados

Localizados em `src/ui/hooks/`:

| Arquivo | Função |
| :--- | :--- |
| `useFigmaMessages.js`| Facilita a conversa entre React e Sandbox (`postMessage`). |
| `useScan.js` | Encapsula toda a lógica de análise de página e disparo de deploy. |
| `useAuth.js` | Abstrai a lógica de login e proteção de rotas. |
| `useTemplates.js` | Hook para buscar e filtrar o catálogo de templates. |

---

## 🧱 Componentes de UI

Divididos por contexto em `src/ui/components/`:

- **`auth/`**: `LoginScreen.jsx` (Tela inicial).
- **`home/`**: `BoundState.jsx` (Ações rápidas com NID) e `UnboundState.jsx` (Vincular NID).
- **`layout/`**: `Header.jsx`, `NavBar.jsx`, `ResizableContainer.jsx`.
- **`scan/`**: `ScanReport.jsx`, `ModuleStatusItem.jsx`, `JsonPreview.jsx`.
- **`templates/`**: `TemplateList.jsx`, `FieldList.jsx`, `VariationCard.jsx`.
- **`shared/`**: `ProgressBar.jsx`, `Toast.jsx`.

---

## 🔗 Interconexões e Fluxo

1. **Ação do Usuário:** Clica em um botão em um **Componente**.
2. **Hook/Store:** O componente chama um **Hook** ou uma ação na **Store**.
3. **API/Figma:** A Store/Hook faz uma chamada via **API Client** (rede) ou via **useFigmaMessages** (Sandbox).
4. **Sandbox:** O `main.js` no sandbox recebe a mensagem, executa a ação no Figma e devolve o resultado.
5. **UI Update:** A Store atualiza o estado e o React re-renderiza a tela.

---
**Status:** Atualizado v3.0
