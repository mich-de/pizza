# Pizza Penisola — Agent Guide

## Dev commands

- **Start dev**: `./launch.sh` (kills stale ports, installs deps, starts Vite + Express --watch). Windows: `launch.bat`.
- **Frontend only**: `npm run dev` (Vite :5173, proxies `/api` to :3000)
- **Backend only**: `npm run server:dev` (Express --watch :3000)
- **Test**: `npm test` (vitest run — config inherited from `vite.config.js`, no separate vitest config)
- **Lint**: `npm run lint` (ESLint 10 flat config — `src/` + `server/` + `*.test.js` scopes)
- **Build**: `npm run build` (Vite → `dist/`)
- **Production**: `npm start` (Express serves `dist/` + API :3000)
- **No typecheck**, no formatter, no CI

## Tests

Tests use **vitest** + **supertest** (`server/**/*.test.js`):
- `server/api.test.js` — integration (imports `{ app }` from `server/index.js`)
- `server/utils/jwt.test.js`, `password.test.js`, `totp.test.js` — unit
- Set `NODE_ENV=test` + `JWT_SECRET` in `beforeAll`
- `vitest run` — no `--watch` or coverage by default

## Architecture

- **Monolithic backend**: all Express routes in `server/index.js` (~1605 lines). Exports `{ app }` for supertest. No router splitting.
- **File-based JSON storage**: no database. Data in `server/private/*.json` with atomic writes (tmp + renameSync) + per-file promise locking. Public data in `public/data/*.json`.
- **SPA frontend**: React 19 + React Router v7, lazy-loaded via `React.lazy()` + `Suspense`. State via Context API (no Redux/Zustand).
- **i18n**: custom React Context (`src/i18n/I18nContext.jsx`). Strings in `public/data/i18n/{it,en}.json`.
- **Styling**: Tailwind v4 (`@import "tailwindcss"` + `@theme` directive in `src/index.css`). Fonts: Playfair Display (headlines) + DM Sans (body).
- **No TypeScript**: JSDoc for type hints, Zod v4 for runtime validation (client + server).

## Data flow

```
Browser → Vite proxy (:5173) → Express API (:3000) → JSON files (server/private/)
                                ↓
                          Static JSON (public/data/) fetched directly by frontend
```

## Key conventions

- **Backend is ESM** (`"type": "module"`). Exception: `scratch/fix_maps.cjs`, `server/healthcheck.cjs` (CJS).
- **Security**: Argon2 hashing, JWT in HttpOnly SameSite=Strict cookies, TOTP 2FA, CSRF double-submit cookie, rate limiting (100/min API / 3 per 5min comments / 5 login attempts per 15min IP + account lockout), `sanitize-html` + regex input sanitization, login rate limiting + account lockout, honeypot + math captcha (server-signed HMAC token) on comment/feed forms, banned words filter, per-file promise locking, atomic writes.
- **Captcha**: GET `/api/comments/captcha` returns `{ question, captchaToken }`. The answer is HMAC-signed server-side (`createCaptchaToken()`). POST expects both `mathAnswer` + `captchaToken`. Token expires after 10 min.
- **Admin auth**: JWT access (15min) + refresh (7d rotation + revocation) in cookies.
- **Env**: `.env.example` is template. `.env` is gitignored. Two password vars: `ADMIN_PASSWORD` (plain, hashed at startup) and `ADMIN_PASSWORD_HASH` (pre-hashed, takes priority).
- **JSON in `public/`** is served statically (towns, venues, prices, i18n). `server/private/` is never served. Note: nginx production config blocks `/data/` with `deny all`.
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
