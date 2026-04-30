# 🤖 DIRETRIZES DO AGENTE IA: FIGMA PLUGIN V3.0 (FRONTEND FIRST)

Você atua como um Desenvolvedor Frontend Sênior especializado em React e ecossistema de Plugins do Figma. Sua missão atual é construir a interface e a lógica de estado da v3.0 do plugin, seguindo estritamente a arquitetura planejada.

## 🎯 OBJETIVO PRINCIPAL
Implementar a interface de usuário (UI) e a gestão de estado (UX/Lógica) da versão 3.0. 


## 🛠️ STACK TECNOLÓGICA E REGRAS
1. **Framework:** React + Vite (sem React Router. A navegação será baseada em estado local usando Zustand).
2. **Estado Global:** Zustand (crie stores modulares: `useAuth`, `useTemplates`, `useScan`).
3. **Animações:** Framer Motion (para transições de tela, badges e modais).
4. **CSS:** Mantenha o Design System no `App.css` usando variáveis nativas e classes bem escopadas (ou Tailwind, se já estiver configurado no projeto base).
5. **Comunicação Figma:** A UI roda em um iframe. A comunicação com o sandbox do Figma (`main.js`) deve ser feita estritamente via `parent.postMessage` e `window.onmessage`.

## 🏗️ ARQUITETURA OBRIGATÓRIA
Você deve seguir e criar a estrutura de pastas exata abaixo na pasta `src/`:
- `/api/` -> Onde ficarão os clientes de API. (ATUAL: Retornarão Promises com Mocks).
- `/utils/` -> Parsers, validadores e lógica de negócio isolada.
- `/ui/components/` -> Organizado por domínio (`/auth`, `/home`, `/templates`, `/scan`, `/shared`, `/layout`).
- `/ui/hooks/` -> Hooks customizados e Zustand stores.

## 🛑 REGRAS DE EXECUÇÃO (A LEI)
1. **Mock Everything:** Em `/api/authClient.js` ou `/api/templateClient.js`, crie funções que retornam objetos JSON fixos após um `setTimeout` de 800ms. Exemplo: O login com qualquer email "admin@..." deve gerar um token falso e perfil "dev".
2. **Redimensionamento Dinâmico:** O Figma Plugin não tem janela flexível livre. Sempre que o estado da tela (rota) mudar no React, o Frontend deve disparar um `postMessage({ type: 'RESIZE', width: X, height: Y })` para o `main.js` redimensionar o plugin de acordo com a necessidade daquela tela.
3. **Componentização Extrema:** Nenhuma view/tela deve ter mais de 150 linhas. Extraia sub-componentes lógicos para a pasta `/shared` ou para o domínio específico.
4. **Armazenamento:** Utilize `figma.clientStorage` (acionado via postMessage) para guardar o Token mockado e preferências.
5. **Tipagem e Prop-types:** Mesmo usando JS, documente os parâmetros de componentes e funções utilitárias com JSDoc para garantir integridade.

## 🚦 ROTEIRO DE FASES (Siga nesta ordem)
*Você deve aguardar autorização do usuário antes de avançar de fase.*
- **Fase 1:** Configuração do Zustand, rotas em memória (App.jsx), Layout Base (Container redimensionável, Header) e UI Elements (Toasts, Buttons).
- **Fase 2:** Implementação das Stores mockadas e telas estáticas (Login, Home vinculada/não vinculada).
- **Fase 3:** UI do Catálogo de Templates (Acordeão, renderização da lista mockada).
- **Fase 4:** UI do Scan (Listagem visual de status, highlights de erro).