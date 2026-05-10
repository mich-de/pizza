# Pizza Penisola — Agent Guide

## Dev commands

- **Start dev**: `./launch.sh` (kills stale ports, installs deps, starts Vite + Express with `--watch`)
- **Frontend only**: `npm run dev` (Vite dev server on :5173, proxies `/api` to :3001)
- **Backend only**: `npm run server:dev` (Express with `--watch` on :3001)
- **Lint**: `npm run lint` (ESLint 10 flat config — legacy `.eslintrc.*` ignored)
- **Build**: `npm run build` (Vite → `dist/`)
- **Production**: `npm start` (Express serves `dist/` + API on :3001)
- **No tests**, no typecheck, no formatter, no CI

## Architecture

- **Monolithic backend**: all Express routes in `server/index.js` (~1545 lines). No router splitting.
- **File-based JSON storage**: no database. Data in `server/private/*.json` with atomic writes (tmp + renameSync) + per-file promise locking. Public data in `public/data/*.json`.
- **SPA frontend**: React 19 + React Router v7, lazy-loaded pages via `React.lazy()` + `Suspense`. State via Context API (no Redux/Zustand).
- **i18n**: custom React Context (`src/i18n/I18nContext.jsx`), not react-i18next. Strings in `public/data/i18n/{it,en}.json`.
- **Styling**: Tailwind v4 (no `tailwind.config.js` — uses CSS `@import "tailwindcss"` + `@theme` directive).
- **No TypeScript**: JSDoc for type hints, Zod v4 for runtime validation (both client + server).

## Data flow

```
Browser → Vite proxy (:5173) → Express API (:3001) → JSON files (server/private/)
                                ↓
                          Static JSON (public/data/) fetched directly by frontend
```

## Key conventions

- **Backend is ESM** (`"type": "module"`). Exception: `scratch/fix_maps.cjs` (standalone CJS script).
- **Security**: Argon2 hashing, JWT in HttpOnly SameSite=Strict cookies, TOTP 2FA, CSRF double-submit cookie, rate limiting (100/min API / 3 per 5min comments), `sanitize-html` + regex input sanitization, honeypot + math captcha on comment forms, banned words filter, file locking, atomic writes.
- **Admin auth**: JWT access (15min) + refresh (7d rotation + revocation) in cookies.
- **Env**: `.env.example` is the template. `.env` is gitignored — never commit it.
- **JSON in `public/`** is served statically (towns, venues, prices, i18n). Frontend fetches from `/data/*.json`. `server/private/` is never served. Note: nginx production config blocks `/data/` with `deny all` — these files are only directly accessible in dev.
- **SPA fallback**: Express serves `index.html` for non-API/static routes in production.
- **Docker**: multi-stage build, non-root `appuser`, read-only rootfs, tmpfs for `/tmp` + `/server/logs`.

## Useful file locations

| What | Where |
|------|-------|
| API routes | `server/index.js` |
| Auth middleware | `server/middleware/auth.js` |
| CSRF middleware | `server/middleware/csrf.js` |
| Auth utils (JWT, Argon2, TOTP) | `server/utils/` |
| Frontend entry | `src/main.jsx` |
| Route definitions | `src/App.jsx` |
| Zod schemas | `src/config/schemas.js` |
| Comment form (honeypot + captcha) | `src/components/CommentForm.jsx` |
| Data fetching service | `src/services/DataFetchService.js` |
