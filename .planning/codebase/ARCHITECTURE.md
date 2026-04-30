# System Architecture

**Date:** 2026-04-30

## High-Level Architecture
The application is a Figma Plugin built with a modular architecture that separates the Figma Sandbox (backend logic) from the User Interface (React frontend).

### The Figma Sandbox (`src/plugin/main.js`)
This layer runs in a locked-down JavaScript environment provided by Figma.
- **Responsibilities:**
  - Listening to selection changes in the Figma editor.
  - Recursively mapping nodes and identifying modular components using `nodeMapper.js`.
  - Reading and writing node properties (characters, fills, etc.).
  - Managing plugin UI window resizing and state persistence (`figma.clientStorage`).
- **Communication:** Sends messages via `figma.ui.postMessage` to the UI thread.

### The UI Thread (`src/ui/App.jsx`)
This layer runs in an iframe and hosts a full React application.
- **Responsibilities:**
  - Presenting the UI to the user (Login, Deploy, Templates, Scan).
  - Communicating with external APIs (Drupal CMS).
  - Managing application state globally.
- **State Management:** Uses Zustand stores (`appStore.js`, `authStore.js`, `templateStore.js`, `scanStore.js`) for decoupled, reactive data flow.
- **Communication:** Uses `window.parent.postMessage` to send commands back to the Figma Sandbox (wrapped by `useFigmaMessages.js`).

## Data Flow
1. **Selection:** User selects a frame in Figma.
2. **Extraction:** `main.js` triggers `selectionchange`, parses the node tree using `nodeMapper.js` and `scanValidator.js`, and posts the extracted data to the UI.
3. **Store Update:** The UI receives the message via `useFigmaMessages.js` and updates the React state.
4. **API Integration:** The user initiates a sync/deploy. The UI uses `drupalClient.js` to send the payload to the CMS API.
5. **Feedback:** The UI displays success/error toasts and updates the status badges.

## Key Abstractions
- **Node Mapper (`src/utils/nodeMapper.js`):** Abstracts the complex Figma node tree into a flattened, queryable map of components. Handles naming conventions (e.g., matching `_desktop` and `_mobile` variants).
- **Scan Validator (`src/utils/scanValidator.js`):** Validates Figma layers against predefined prefix rules (`TXT_`, `URL_`, `VAR_`, etc.).
- **API Clients (`src/api/*`):** Isolate all `fetch` logic, header management, and error handling away from the UI components.
