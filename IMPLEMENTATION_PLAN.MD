# Implementation Plan: Coolify Deployment & Frontend Design Upgrades

This implementation plan covers the strategy for preparing the codebase for deployment on Coolify (resolving reverse proxy session issues) and enhancing the frontend design's styling, responsiveness, and interactivity.

---

## 1. Coolify Deployment & Docker Support

### Problem
* Coolify uses a reverse proxy (like Traefik) that terminates SSL/TLS and routes requests internally to HTTP containers.
* Secure and HttpOnly cookies (SameSite=Strict) are used for JWT authentication. If the app is unaware it's behind a reverse proxy, Express might fail to read/set these cookies correctly.
* The default admin username in the JSON file was previously hardcoded or persisted on the volume, leading to mismatches when resetting credentials using `ADMIN_USERNAME` environment variables.

### Solution
1. **Trust Proxy**: Enabled Express `trust proxy` setting using `process.env.TRUST_PROXY || 1` to correctly read forwarded headers (`X-Forwarded-Proto`, `X-Forwarded-For`).
2. **Environment Configuration**: Set `PORT=3000`, `HOST=0.0.0.0`, and `TRUST_PROXY=1` in `docker-compose.yaml`.
3. **Dynamic User Synchronization**: Updated the backend's startup initialization (`seedAdmin`) to:
   * Sync the admin username from `ADMIN_USERNAME` dynamically.
   * Auto-detect if credentials have changed and flag the user with `mustChangePassword: true` if an update has occurred.

---

## 2. Security Flow Enhancements

### Forced Password Change
* Added a `mustChangePassword` flag to admin database objects.
* If `mustChangePassword` is `true`, the login API returns this state to the client.
* The frontend `Login.jsx` intercepts the response and presents an inline form requesting a password change before unlocking access to the admin dashboard.
* The `/api/auth/change-password` endpoint clears `mustChangePassword` upon successful password update.

### Authentication Bypass Fixes
* Identified and removed a custom/insecure alternate login form in `AdminPanel.jsx` that bypassed the secure CSRF, 2FA, and forced-password-change flows via `/api/admin/verify-login`.
* Restored standard redirection to `/login` for unauthenticated sessions accessing `/admin`.

---

## 3. Frontend Design & Responsiveness Upgrades

### UI/UX Refinement (Brutalist Design & HSL Colors)
* Upgraded page headers and sections to leverage dynamic gradients and micro-animations.
* Integrated responsive CSS layout classes ensuring visual stability across mobile, tablet, and desktop views.
* Added modern CSS variables, transition animations, tilt hover effects, and radial gradient glow elements to card layouts in `src/index.css`.

---

## 4. Verification Plan

### Automated Tests
* Fix the Vitest integration suite to prevent port-listening conflicts when importing the Express app in `server/api.test.js`.
* Run test suite: `npm test`
* Run standard production build: `npm run build`

### Manual Verification
* Deploy the Docker Compose stack using Coolify.
* Verify cookie settings (Secure, SameSite=Strict, HttpOnly) are set and preserved across pages.
* Verify login, 2FA prompt, forced password change on first login, and dashboard access.
