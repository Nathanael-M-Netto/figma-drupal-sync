# Codebase Tech Stack

**Date:** 2026-04-30
**Last Mapped Commit:** N/A (Initial Map)

## Core Technologies
- **Runtime:** Node.js (for build), Figma Plugin Sandbox (for execution)
- **Framework:** React 18
- **Language:** JavaScript (ES Modules), some TypeScript (`code.ts` exists, but mostly JS `App.jsx`)
- **Build Tool:** Vite 6 with `vite-plugin-singlefile`
- **State Management:** Zustand 5
- **Animation:** Framer Motion 12
- **CSS:** Vanilla CSS (`App.css`) with custom tokens/variables

## Application Architecture Layers
1. **Figma Sandbox (`src/plugin/main.js`):** Runs in the Figma main thread. Accesses the Figma DOM, extracts node data, handles selections.
2. **UI Thread (`src/ui/App.jsx`):** Runs in an iframe. Handles user interface, state management, and external HTTP requests.
3. **Bridge Communication:** The two threads communicate via `postMessage`. Custom hooks like `useFigmaMessages.js` wrap this communication.

## Infrastructure & Configuration
- **Package Manager:** npm
- **Build Configurations:**
  - `vite.config.js`: Builds the React UI into a single HTML file (`ui.html`).
  - `vite.config.plugin.js`: Builds the sandbox code into `code.js`.
- **TypeScript Config:** `tsconfig.json` provides typings for `@figma/plugin-typings` and React.

## Key Dependencies
- `react`, `react-dom` - UI rendering.
- `zustand` - Global state management (stores for Auth, App, Scan, Templates).
- `framer-motion` - UI transitions and animations.
- `@figma/plugin-typings` - Type definitions for Figma Plugin API.
