# Implementation Plan - PizzaRadar Sorrentum

## Goal
Fix deployment issues on Coolify (root domain) by resolving 404 errors related to asset loading and base paths.

## Proposed Changes

### [FRONTEND] Build Configuration
#### [MODIFY] [vite.config.js](file:///d:/nodejs/pizza/vite.config.js)
- Changed `base` from `'/pizza/'` to `'/'` (or `VITE_BASE_PATH`).
- This ensures assets are referenced relative to the root, which is the default for Coolify deployments.

### [DEVOPS] Deployment Strategy
#### [MODIFY] [Dockerfile](file:///d:/nodejs/pizza/Dockerfile)
- Ensure environment variables can be passed during build if needed.
- (Optional) Add `ARG VITE_BASE_PATH` if we want to support non-root subpaths at build time.

#### [MODIFY] [.env.example](file:///d:/nodejs/pizza/.env.example)
- Update `ALLOWED_ORIGINS` hint to include production domains.

## Verification Plan
1. Run a local production build: `npm run build`.
2. Check `dist/index.html` to see if asset paths start with `/assets/` instead of `/pizza/assets/`.
3. Start the server in production mode: `NODE_ENV=production node server/index.js`.
4. Access `http://localhost:3001` and verify assets load.
