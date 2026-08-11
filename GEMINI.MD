# Gemini Project Memory Log

This document preserves the context, architectural decisions, and critical technical details for future development cycles.

---

## Technical Context & Overview

### 1. Reverse Proxy & Trust Proxy Setup
* **Decision**: Configured Express `trust proxy` setting to trust the first proxy hop (`process.env.TRUST_PROXY || 1`).
* **Rationale**: Essential for environments like Coolify where SSL terminates at the reverse proxy (Traefik/Nginx) before reaching the HTTP container. Without this, Express will treat connections as HTTP instead of HTTPS, causing secure-flagged HttpOnly session cookies (`SameSite=Strict`) to be discarded by the client browser.

### 2. Admin Synchronization Strategy
* **Decision**: Synchronize credentials in-memory at startup by parsing database records (`admins.json`) and comparing with container environment configuration (`ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_PASSWORD_HASH`).
* **Rationale**: If the application volume is persistent, changing the `.env` configuration file wouldn't update credentials in the pre-existing JSON DB file. Our updated script ensures that whenever the environment variables change, the persisted user id=1 is updated to match.
* **Security Guard**: Changing credentials via environment variables triggers a `mustChangePassword: true` status flag for the seeded user.

### 3. Password Force-Change UX Flow
* **Decision**: Intercept login attempts on the frontend:
  ```
  POST /api/auth/login -> returns { success: true, mustChangePassword: true }
  -> Login.jsx interrupts navigation to /admin
  -> Displays Password Update form
  -> PUT /api/auth/change-password -> sets mustChangePassword: false
  -> Navigate to /admin
  ```
* **Rationale**: Ensures that default passwords (e.g. `sorrento`) are immediately changed upon first deployment, preventing unauthorized access.

### 4. Integration Test Server Conflict
* **Decision**: Moved test imports of the Express app inside `server/api.test.js` to run dynamically after setting `process.env.NODE_ENV = 'test'`.
* **Rationale**: Standard ESM imports are resolved statically before `beforeAll` triggers. Since `server/index.js` boots and starts listening on port 3000 unless `NODE_ENV === 'test'`, it caused conflicts and timeouts when the test runner attempted to import it. Dynamic imports prevent the server from starting to listen.

### 5. ESLint Cleanups
* **Decision**: Set `'react-hooks/set-state-in-effect': 'off'` in `eslint.config.js` and removed/fixed all remaining unused variables (`API_BASE`, `e`, `_next`, `t`, `useEffect`, `useRef`).
* **Rationale**: Synchronous state updates inside effects on mount are standard React patterns. Other unused variables were obsolete references that generated build warnings.

### 6. Vitest Process Isolation Pool
* **Decision**: Configured `test: { pool: 'forks' }` in `vite.config.js` to replace the default worker-thread pool.
* **Rationale**: Node's worker threads can experience socket binding timeouts (`ETIMEDOUT`) and lockups when loading native bindings (e.g. `@node-rs/argon2` used for secure admin hashing) or spawning ephemeral HTTP listener ports concurrently during unit/integration tests. Forked process isolation runs each suite in its own child process, guaranteeing clean execution and instant response times.


