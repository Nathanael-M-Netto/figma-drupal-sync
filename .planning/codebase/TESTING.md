# Testing Practices

**Date:** 2026-04-30

## Overview
Currently, the codebase does not have an automated testing framework (e.g., Jest, Vitest, Cypress) configured. The `package.json` contains no `test` scripts.

## Validation
- **Manual QA:** Testing is done manually by running the plugin in Figma Desktop using `npm run build` and observing the UI and console logs.
- **Mock Fallbacks:** API clients (`templateClient.js`, `drupalClient.js`, `authClient.js`) originally had `FORCE_MOCK` toggles to bypass external API requirements during offline development. Some mocks (like Login) remain active or are used for UX flows.

## Continuous Integration
- No automated CI/CD pipeline is currently configured in the repository.

## Recommendations for Testing
1. **Unit Testing:** Adopt Vitest for testing utility functions, specifically `nodeMapper.js` and `scanValidator.js`, as these contain critical business logic for parsing Figma trees.
2. **Component Testing:** Use React Testing Library for verifying complex UI state (e.g., the Scanner flow or Template catalog).
