# Project Roadmap

**Phase 1: Foundation & Role-Based Access Control (RBAC)**
- Refatorar o estado global de autenticação para suportar perfis (UX Designer vs DEV).
- Implementar a lógica de permissões: restringir acesso da UX à visualização de schemas, templates e payloads JSON.
- Remover branding restrito ("TIM") e estabelecer textos e variáveis agnósticas (White-label).
- Configurar base do novo design system no `App.css` (variáveis e utilitários Glassmorphism).

**Phase 2: UI Overhaul & Responsive Layout**
- Transformar todas as telas (Login, Home, Scanner) para a nova identidade visual (Glassmorphism, transições fluidas, botões nítidos).
- Implementar o redimensionamento manual da janela do plugin no Figma (`ResizableContainer`).
- Polir feedback visual (toasts, progress bars, e modais).

**Phase 3: Smart Scanner & Template Catalog Integration**
- Refinar o `nodeMapper.js` e `scanValidator.js` para captura flexível de prefixos (`TXT_`, `URL_`, `VAR_`).
- Desenvolver a interface do Catálogo de Templates (exclusivo para DEV).
- Integrar chamadas da API do Drupal para listagem de templates e download de skeletons/schemas.
- Habilitar preview de JSON interativo para o perfil DEV antes do Deploy.

---
*Roadmap gerado em: 2026-04-30*
