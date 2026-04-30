# Figma Drupal Sync

## Core Value
A professional, white-label Figma plugin for bidirectional synchronization with Drupal CMS. It transforms Figma into an active CMS staging environment using a modern, fluid, and responsive Glassmorphism interface.

## Context
The plugin is evolving to v3.0 to become a mature, market-ready product. It moves away from a prototype look towards a highly polished tool with Role-Based Access Control (RBAC), separating UX Designers (minimalist sync interface) from Developers (full catalog, schema, and debug access). It handles intelligent scanning of Figma layers and dynamic JSON payload construction for Drupal.

## Requirements

### Validated

- ✓ Basic Figma node tree extraction — existing
- ✓ Sandbox and UI thread communication — existing
- ✓ Dual authentication support (API Key / Bearer Token) — existing
- ✓ Basic API sync capability with Drupal — existing

### Active

- [ ] **Modern UI/UX:** Implement a Glassmorphism design system with fluid animations, reactive effects, and sharp buttons.
- [ ] **Responsive Plugin Window:** Allow manual, user-adjustable window resizing within Figma.
- [ ] **Strict RBAC (UX vs DEV):**
  - **UX Profile:** Clean interface focused on Scan and Deploy. No access to JSON payloads, Template Catalog, or schemas.
  - **DEV Profile:** Full access including NID modification, Template Catalog, JSON debug, and schemas.
- [ ] **Smart Scanning:** Enhanced validation and extraction of Figma layers using prefixes (`TXT_`, `URL_`, `VAR_`).
- [ ] **Template Catalog:** API integration to fetch, view, and download Drupal skeletons (DEV only).
- [ ] **White-labeling:** Ensure the plugin contains no hardcoded "TIM" branding, making it agnostic.

### Out of Scope

- [Specific TIM Branding] — The tool is used by TIM but is a white-label product owned independently.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Glassmorphism UI** | Avoid the "AI-generated" look and deliver a premium, fluid user experience. | — Pending |
| **Strict RBAC enforcement** | Prevent UX designers from being overwhelmed by DEV tools while protecting backend schemas. | — Pending |
| **Agnostic Branding** | Allows the plugin to be marketed or utilized across different enterprises beyond the current client. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-30 after initialization*
