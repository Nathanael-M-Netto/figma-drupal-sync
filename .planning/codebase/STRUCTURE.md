# Directory Structure

**Date:** 2026-04-30

## Project Layout

```
.
├── src/
│   ├── api/                 # External HTTP clients (Drupal API)
│   │   ├── authClient.js
│   │   ├── drupalClient.js
│   │   └── templateClient.js
│   ├── plugin/              # Figma Sandbox code
│   │   └── main.js          # Entrypoint for Figma backend logic
│   ├── ui/                  # React UI Application
│   │   ├── components/      # React components grouped by feature
│   │   │   ├── auth/        # Login and authentication UI
│   │   │   ├── home/        # Dashboard and bound state views
│   │   │   ├── layout/      # Layout wrappers (ResizableContainer, NavBar)
│   │   │   ├── scan/        # Module scanning and validation UI
│   │   │   ├── shared/      # Reusable UI elements (Toasts, Badges, Modals)
│   │   │   └── templates/   # Template catalog viewer
│   │   ├── hooks/           # Custom React hooks (useFigmaMessages, useScan)
│   │   ├── stores/          # Zustand state stores
│   │   │   ├── appStore.js
│   │   │   ├── authStore.js
│   │   │   ├── scanStore.js
│   │   │   └── templateStore.js
│   │   ├── App.jsx          # Main React router and orchestrator
│   │   ├── App.css          # Global Design System and styling tokens
│   │   └── main.jsx         # React DOM entrypoint
│   └── utils/               # Shared logic between UI and Sandbox
│       ├── colorMap.js      # Color extraction and mapping
│       ├── nodeMapper.js    # Logic for grouping Figma nodes by name
│       ├── scanValidator.js # Validation rules for node prefixes
│       └── schemaParser.js  # Drupal schema parsing
├── package.json             # Dependencies and build scripts
├── vite.config.js           # UI Vite configuration (Singlefile plugin)
└── vite.config.plugin.js    # Sandbox Vite configuration
```

## Naming Conventions
- **Components:** PascalCase (e.g., `TemplateList.jsx`, `BoundState.jsx`).
- **Stores:** camelCase with `Store` suffix (e.g., `appStore.js`).
- **Hooks:** camelCase with `use` prefix (e.g., `useFigmaMessages.js`).
- **API Clients:** camelCase with `Client` suffix (e.g., `drupalClient.js`).
- **CSS Classes:** kebab-case, heavily utilizing BEM-lite conventions (`.btn-primary`, `.module-chip`).

## Key Locations
- **CSS Design System:** All design tokens (colors, sizing, shadows) are defined as CSS variables at the top of `src/ui/App.css`.
- **Figma Sandbox Logic:** All Figma-specific API calls (`figma.currentPage.selection`, `figma.clientStorage`) reside within `src/plugin/main.js`.
- **Global State:** All cross-component state is managed in `src/ui/stores/`.
