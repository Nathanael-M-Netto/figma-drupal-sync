# External Integrations

**Date:** 2026-04-30

## APIs and Services
### 1. Drupal CMS API
- **Endpoint:** `https://tim-agentic-cms-api-dev.gentlebeach-a211275a.eastus.azurecontainerapps.io/api`
- **Authentication:** Dual support:
  - `X-TIM-Key` for standard API Key access.
  - `Authorization: Bearer` for JWT tokens (used by Mock/DEV logins).
- **Clients:** 
  - `src/api/drupalClient.js`: Handles data deployment, synchronization, schema fetching, and UI validation.
  - `src/api/templateClient.js`: Fetches the template catalog and variations (`/variants/templates`).
  - `src/api/authClient.js`: Manages authentication flows (currently using a mock strategy locally, but designed for API integration).

## Browser / Sandbox APIs
- **Figma Plugin API (`figma.*`):**
  - Accesses Figma Document Object Model (DOM).
  - Uses `figma.clientStorage` for persisting user sessions and API keys.
  - Uses `figma.ui.postMessage` for sandbox-to-iframe communication.

## External Formats & Protocols
- **JSON:** Primary format for schema definitions (`drupal_skeleton`), data synchronization, and template responses.
