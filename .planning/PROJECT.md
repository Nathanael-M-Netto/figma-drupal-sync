# Figma Drupal Sync

## Core Value
Plugin Figma profissional para sincronização bidirecional com Drupal CMS + Cohesion. Transforma o Figma em ambiente de staging ativo com scan inteligente, deploy com diff, auto-sync, e Design System Liquid Glass.

## Context
O plugin evoluiu da v3.0 (core + RBAC + scanner + API) para a v4.0 que adiciona:
- Templates como mapa de referência para devs renomearem layers
- Motor de scan & property loading com linking Desktop↔Mobile
- Auto-sync automático ao abrir o plugin
- Deploy inteligente com tela de confirmação e diff
- Inspeção de módulos com breakdown Desktop/Mobile
- Campos essenciais com auto-detecção
- Design System Liquid Glass (GlassSurface/GlassCard)

## Requirements

### Validated
- ✓ Extração de nós do Figma e sync bidirecional
- ✓ Comunicação Sandbox ↔ UI thread
- ✓ Autenticação dual (API Key / Bearer Token) — mock ativo
- ✓ RBAC (UX vs DEV) com restrição de telas
- ✓ Glassmorphism design system com animações
- ✓ ResizableContainer (resize manual)
- ✓ Scanner inteligente com prefixos (TXT_, URL_, VAR_, BOOL_)
- ✓ Catálogo de templates como mapa de referência (DEV)
- ✓ Scan & Property Loading com linking Desktop↔Mobile
- ✓ Auto-Sync ao abrir (diff engine)
- ✓ Tela de Deploy com confirmação e diff visual
- ✓ Inspeção de módulos com Desktop/Mobile breakdown
- ✓ Campos essenciais com auto-detecção
- ✓ Liquid Glass design system (GlassSurface/GlassCard)
- ✓ White-label (branding agnóstico)

### Active
- [ ] Auth real (JWT com refresh) — aguardando backend
- [ ] Listagem de NIDs de FAQs/Ofertas com nomes
- [ ] Field_tag como checkbox funcional
- [ ] Campos essenciais marcados na API do backend
- [ ] Fotos/preview de variantes nos templates
- [ ] Translate de JSONs API↔Plugin

### Out of Scope
- [Branding TIM] — White-label, plugin é agnóstico
- [FluidGlass/Three.js] — Pesado demais para iframe do Figma, substituído por SVG puro

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Glassmorphism UI | Premium UX, evitar look genérico | ✅ Implementado |
| RBAC (UX/DEV) | UX não precisa ver debug tools | ✅ Implementado |
| White-label | Plugin reutilizável entre clientes | ✅ Implementado |
| GlassSurface (SVG) | Leve, sem deps, funciona em Chromium | ✅ Implementado |
| FluidGlass (Three.js) descartado | Muito pesado para iframe do Figma | ✅ Decidido |
| Funcionalidades antes do design | UX funcional > visual | ✅ Seguido |
| Mock auth | Backend ainda não tem endpoints | ✅ Mock ativo |
| Plugin define campos essenciais | Backend vai se adaptar | ✅ Mapeamento criado |

---
*Last updated: 2026-05-06 — v4.0 (Fases 5-11 concluídas)*
