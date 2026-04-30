# Codebase Concerns

**Date:** 2026-04-30

## Technical Debt & Fragility
1. **API Key Precedence & Mock Overrides:**
   - The application has historically relied heavily on Mock JWT tokens (`mock_jwt_dev_...`) for authentication during local testing. Transitioning to real API keys required forcing overrides in `App.jsx` and `TemplateList.jsx` (`figma.apiKey || token`). Future auth refactoring should clearly separate Mock local flows from genuine production deployments to avoid silent authentication failures.
2. **Node Mapping Constraints:**
   - The logic in `nodeMapper.js` attempts to group variants (e.g., Desktop vs Mobile) by stripping suffixes. This logic is inherently fragile if designers do not strictly follow the naming convention (`_desk`, `_mob`, etc.).
3. **Figma Message Asynchronicity:**
   - Communication between the Figma Sandbox and the UI relies on generic `postMessage`. Type safety is weak here, and race conditions could occur if multiple large tree extractions happen concurrently.

## Missing Features
1. **Automated Testing:** There are zero tests. A breakdown in `scanValidator.js` or `nodeMapper.js` has a high risk of breaking the core extraction pipeline.
2. **Robust TypeScript Types:** While `@figma/plugin-typings` is installed, the bulk of the UI and extraction logic is in pure JavaScript (`.js` and `.jsx`). Adding TypeScript incrementally could prevent runtime errors, particularly with the complex nested schema objects returned by the CMS.

## Potential Performance Bottlenecks
- **Large Figma Documents:** Running `buildModuleTree(figma.currentPage)` processes the entire top-level tree of a page. If a Figma page has hundreds of root nodes, extraction and rendering may freeze the UI thread briefly.
- **Deep Component Trees:** Expanding multiple complex module variations in the Template List could cause React rendering bottlenecks due to deep DOM nesting.

## Security Considerations
- The CMS URL and Keys are hardcoded or passed plainly. The plugin must ensure API keys stored in `figma.clientStorage` are not accidentally leaked or exposed via unintended network requests.
