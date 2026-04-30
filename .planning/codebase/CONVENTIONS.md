# Coding Conventions

**Date:** 2026-04-30

## General Style
- **ES Modules:** Used exclusively across the project (`import`/`export`).
- **Functional Components:** React components use the functional paradigm and standard React hooks (`useEffect`, `useState`, `useCallback`).
- **State Management:** Zustand is used for global state to avoid deep prop-drilling.

## Figma Specific Patterns
- **Sandbox vs UI:** Code strictly separates Figma sandbox logic (`src/plugin/`) from browser-based UI logic (`src/ui/`).
- **Message Passing:** 
  - Sandbox sends messages via `figma.ui.postMessage`.
  - UI receives them via `window.onmessage`.
  - UI sends messages via `parent.postMessage`.
  - All UI-to-Sandbox messaging is centralized in `src/ui/hooks/useFigmaMessages.js` using a `postToFigma` utility.

## Naming Rules
- **Component Variables (Figma):** Fields inside Figma must adhere to strict prefixes (`TXT_`, `URL_`, `VAR_`, `BOOL_`, etc.) to be captured by `nodeMapper.js`.
- **Drupal Synchronization:** Modules are matched using their base names (e.g., `m01_hero`), stripping responsive suffixes like `_desktop` or `_mobile` to combine variants into a single data payload.

## Error Handling
- **API Clients:** Errors are caught in `try/catch` blocks inside the API clients (`src/api/`). Failed requests throw standard `Error` objects that are caught by the calling React component or Zustand action.
- **UI Feedback:** Errors trigger a global Toast notification system via `useAppStore((s) => s.addToast)`.

## Code Formatting
- Code is generally un-linted via strict config files, but follows modern Prettier/ESLint standard JavaScript formatting.
- JSDoc comments are used extensively for complex logic in `nodeMapper.js` and `scanValidator.js`.
