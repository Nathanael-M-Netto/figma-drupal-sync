# Project Roadmap

**Phase 1: Foundation & Role-Based Access Control (RBAC)** ✅
- Refatorar o estado global de autenticação para suportar perfis (UX Designer vs DEV).
- Implementar a lógica de permissões.
- White-label e design system base.

**Phase 2: UI Overhaul & Responsive Layout** ✅
- Glassmorphism, transições fluidas, ResizableContainer.
- Feedback visual (toasts, progress bars, modais).

**Phase 3: Smart Scanner & Template Catalog Integration** ✅
- nodeMapper.js, scanValidator.js, catálogo de templates.
- Integração API Drupal para templates e schemas.

**Phase 4: API Realignment & Node Metadata Support** ✅
- Azure Container Apps, autenticação via header, endpoint unificado.

**Phase 5: Templates como Mapa de Referência (DEV)** ✅
- TemplateList com stats header, expand/collapse all, usage guide.
- VariationCard com guide steps, copy-all-props, preview placeholder.
- FieldList com ícones por tipo e copy-to-clipboard.

**Phase 6: Scan & Property Loading Engine** ✅
- matchModuleToTemplate(), identifySharedProps(), buildFullPageScanReport().
- scan-and-load-props handler: cria component properties e linka Desktop↔Mobile.
- PropertyLoadingWizard.jsx: wizard de setup em 4 etapas.

**Phase 7: Auto-Sync ao Abrir** ✅
- auto-sync-check na inicialização do plugin.
- Diff engine: compara Figma com Drupal, gera lista de alterações.
- BoundState sync banner: checking/synced/outdated/error.

**Phase 8: Tela de Deploy Completa** ✅
- DeployScreen com dois modos (update com diff / newPage com resumo).
- DeployDiff: diff visual campo a campo com checkboxes de inclusão/exclusão.
- NodeFieldsForm: formulário dinâmico de campos do content-type.
- deployStore.js: estado completo do deploy.

**Phase 9: Inspeção de Módulos** ✅
- InspectScreen: scan de página com lista de módulos detectados.
- ModuleDetail: expansível com Desktop/Mobile breakdown e props.

**Phase 10: Campos Essenciais & Auto-Detecção** ✅
- essentialFields.js: mapeamento Figma layers → Drupal fields com fuzzy match.
- Integração com NodeFieldsForm para indicar auto-detected fields.

**Phase 11: Design System Liquid Glass** ✅
- GlassSurface.jsx: componente base com SVG feDisplacementMap.
- GlassSurface.css: levels, hover, glow com conic-gradient animado.
- GlassCard.jsx: wrapper pré-configurado para cards.

**Phase 12: Polish & Estabilidade** 🔴 Em progresso
- [ ] Empty states com ícones em todas as telas
- [ ] Skeleton loading para chamadas API
- [ ] Error boundaries em componentes críticos
- [ ] White-label: remover referências residuais
- [ ] Debounce em chamadas API
- [ ] Logging estruturado

---
*Roadmap atualizado em: 2026-05-06*
