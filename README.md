# PizzaRadar Sorrento — Sorrento Price Dashboard

**Monitoraggio prezzi della pizza Margherita | 6 città della Penisola Sorrentina**

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/)
[![Node](https://img.shields.io/badge/node-18%2B-339933?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-19-61DAFB?logo=react)](https://react.dev)
[![Express](https://img.shields.io/badge/express-5-000000?logo=express)](https://expressjs.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## Table of Contents

1. [Project Metadata & Context](#1-project-metadata--context)
2. [Technical Stack Matrix](#2-technical-stack-matrix)
3. [Annotated Directory Tree](#3-annotated-directory-tree)
4. [Architecture & Logic Flow](#4-architecture--logic-flow)
5. [API & Interface Definitions](#5-api--interface-definitions)
6. [State Management & Frontend Routes](#6-state-management--frontend-routes)
7. [Security Protocols](#7-security-protocols)
8. [Developer Operations & Commands](#8-developer-operations--commands)
9. [Deployment & GitHub Actions](#9-deployment--github-actions)
10. [AI Reference Guide](#10-ai-reference-guide)

---

## 1. Project Metadata & Context

| Field | Value |
|---|---|
| **Name** | PizzaRadar Sorrento |
| **Version** | 0.0.0 |
| **Value Proposition** | Dashboard per confrontare i prezzi della pizza Margherita nelle 6 città della Penisola Sorrentina (Massa Lubrense, Sorrento, Sant'Agnello, Piano di Sorrento, Meta, Vico Equense) con funzionalità social, segnalazioni prezzi e feed comunitario. |
| **Domain** | Food & Beverage Pricing Intelligence, Community Reviews |
| **Audience** | Turisti, residenti, appassionati di pizza, ristoratori |
| **Data Freshness** | User-submitted price proposals + admin-verified updates |

---

## 2. Technical Stack Matrix

### Backend

| Layer | Technology | Details |
|---|---|---|
| **Runtime** | Node.js 18+ | ESM modules (`"type": "module"`) |
| **Framework** | Express 5 | Path-to-regexp v8 named wildcards (`*path`) |
| **Auth** | JWT (access 15min + refresh 7d rotation) | `jsonwebtoken` library |
| **Password** | Argon2 | `@node-rs/argon2`, memoryCost: 19456, timeCost: 2 |
| **2FA** | TOTP | `otplib` + QR code setup |
| **CSRF** | Double-submit cookie pattern | Per-request token, signed cookies |
| **Validation** | Zod 4 | Schemas in `server/` (backend reuse) |
| **Sanitization** | `sanitize-html` | Allowed: `b`, `i`, `em`, `strong`, `a[href]` |
| **Logging** | Winston | JSON structured in prod, colorized in dev |
| **Storage** | File-based JSON | Atomic writes (tmp + rename), per-file locking |
| **CSP** | Helmet | Restrictive directives, no inline scripts |

### Frontend

| Layer | Technology | Details |
|---|---|---|
| **Framework** | React 19 | Vite 8 build tool |
| **Routing** | React Router DOM 7 | Client-side, lazy-loaded pages |
| **Styling** | Tailwind CSS 4 | Brutalist design, offset shadows, Space Grotesk + Inter |
| **Icons** | Material Symbols | Variable font icons (`fontVariationSettings`) |
| **i18n** | Custom React Context | JSON files in `/public/data/i18n/` (it/en) |
| **State** | Local state + Context API | `ThemeContext`, `I18nContext` |

### Infrastructure

| Layer | Technology |
|---|---|
| **Container** | Docker + docker-compose |
| **Reverse Proxy** | Nginx (TLS 1.3 only, HSTS, security headers) |
| **Memory Limit** | 512MB RAM, 1 CPU |
| **User** | Non-root (`appuser`), read-only filesystem |
| **Healthcheck** | `GET /health` |

---

## 3. Annotated Directory Tree

```
pizza/
├── index.html                          # SPA entry HTML (Vite inject)
├── package.json                        # npm scripts, dependencies
├── vite.config.js                      # Vite: React + Tailwind plugins
├── docker-compose.yml                  # App + nginx services
├── Dockerfile                          # Multi-stage: build + production
├── nginx.conf                          # Reverse proxy, TLS 1.3, CSP
├── launch.sh                           # Dev launcher (server + vite)
├── .env.example                        # Template for secrets
│
├── src/                                # ─── React Frontend ───
│   ├── main.jsx                        # Entry: renders App with providers
│   ├── App.jsx                         # Router: 7 lazy-loaded pages
│   ├── index.css                       # Tailwind layers + custom fonts
│   │
│   ├── config/                         # App configuration & validation
│   │   ├── navigation.js               # Nav items + admin tab definitions
│   │   ├── schemas.js                  # Zod schemas: towns, venues, prices, comments
│   │   ├── exploreConfig.js            # Pagination, price tiers, formatDate
│   │   ├── pricesConfig.js             # Price matrix config
│   │   └── adminConfig.js              # Admin categories, city IDs, ID gen
│   │
│   ├── components/
│   │   ├── ui/index.jsx                # StatCard, Card, Badge, Button, PageHeader
│   │   ├── admin/                      # PizzeriaRow, AddModal
│   │   ├── explore/                    # ExploreCards, ExploreTable, ExploreNetwork, PriceProposalForm
│   │   ├── prices/                     # PricesTable, PricesDetail, PricesFilters
│   │   ├── Layout.jsx                  # Sidebar + TopBar + Outlet
│   │   ├── Sidebar.jsx                 # Desktop nav (5 items)
│   │   ├── TopBar.jsx                  # Mobile top bar + drawer
│   │   ├── SocialActions.jsx           # Like/comment/share/save (Web Share API)
│   │   ├── CommentForm.jsx             # Review form (honeypot + captcha)
│   │   ├── CommentList.jsx             # Approved comments display
│   │   ├── LoadingSpinner.jsx          # Loading indicator
│   │   ├── ErrorBoundary.jsx           # React error boundary
│   │   └── ProtectedRoute.jsx          # Auth guard (unused)
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx               # / — Stats, cheapest, new openings, reviews
│   │   ├── Feed.jsx                    # /feed — Social feed, CreatePost modal, comments
│   │   ├── Explore.jsx                 # /explore — Cards/Table/Network views + filters
│   │   ├── Directory.jsx               # /directory — Full pizzeria listing with filters
│   │   ├── Prices.jsx                  # /prices — Sortable matrix, admin edit mode
│   │   ├── Network.jsx                 # /network — City cluster visualization
│   │   ├── Admin.jsx                   # /admin/pizzerias — CRUD pizzerias
│   │   ├── AdminProposals.jsx          # /admin/proposals — Approve prices/comments/feed
│   │   ├── AdminPanel.jsx              # /admin — Tab wrapper (auth check)
│   │   ├── Settings.jsx                # /admin/settings — Profile, 2FA, theme, language
│   │   └── Login.jsx                   # /login — Username + password + 2FA
│   │
│   ├── hooks/
│   │   ├── useDataFetch.js             # Data fetching with stitching
│   │   └── useComments.js              # Comment CRUD hook
│   │
│   ├── services/
│   │   ├── authService.js              # Auth check/logout
│   │   └── DataFetchService.js          # Data API service
│   │
│   ├── i18n/I18nContext.jsx             # Lang state, translate function
│   ├── theme/ThemeContext.jsx           # Dark/light toggle
│   └── utils/groupByCity.js             # Data grouping utility
│
├── server/                             # ─── Express Backend ───
│   ├── index.js                        # ALL routes (~1250 lines): auth, data, comments,
│   │                                   #   proposals, feed, admin CRUD, audit, production SPA
│   ├── middleware/
│   │   ├── auth.js                     # JWT verification + PUBLIC_ROUTES whitelist + requireRole
│   │   └── csrf.js                     # CSRF token generation + validation
│   ├── utils/
│   │   ├── password.js                 # Argon2 hash/verify
│   │   ├── jwt.js                      # Access + refresh token generation/verification
│   │   ├── refreshTokens.js            # Token rotation + revocation store
│   │   ├── totp.js                     # TOTP secret/keyUri/qr/verify
│   │   └── auditLog.js                 # Admin action audit trail
│   ├── private/                        # NOT SERVED — sensitive runtime data
│   │   ├── admins.json                 # Admin accounts (passwordHash, 2FA secret)
│   │   ├── comments.json               # User comments + reviews
│   │   ├── price-proposals.json        # Price change proposals
│   │   ├── feed-posts.json             # User-created feed posts
│   │   ├── refresh-tokens.json         # Active refresh token store
│   │   └── audit-log.json              # Admin action history
│   └── logs/                           # Winston output (tmpfs in Docker)
│
├── public/data/                        # Public static JSON (served)
│   ├── towns.json                      # 6 towns with id, name, region
│   ├── venues.json                     # Pizzeria data: name, address, cityId, category, rating
│   ├── prices.json                     # Margherita prices per pizzeriaId
│   ├── feed-data.json                  # Static feed posts (admin-generated)
│   └── i18n/                           # Translations
│       ├── it.json                     # Italian (~300 keys)
│       └── en.json                     # English (~320 keys)
│
└── public/images/pizzerias/            # Pizza placeholder images (pizza-1..4.png)
```

---

## 4. Architecture & Logic Flow

### Request-Response Cycle

```
┌──────────────┐        1. GET /explore         ┌──────────────────┐
│   Browser    │ ──────────────────────────────► │   Express 5     │
│  (React SPA) │                                 │   (:3000)       │
│              │                                 │                 │
│  API calls   │    ┌─── Request Flow ───┐       │ Middleware Stack │
│  via fetch() │    │                    │       │                 │
└──────────────┘    │                    │       ├─────────────────┤
                    │                    │       │ 1. Helmet (CSP) │
                    │                    │       │ 2. CORS         │
                    │                    │       │ 3. Compression  │
                    │                    │       │ 4. JSON parser  │
                    │                    │       │ 5. CookieParser │
                    │                    │       ├─────────────────┤
                    │                    │       │ 6. authMiddleware│
                    │                    │       │    (PUBLIC_ROUTES│
                    │                    │       │     skip auth)  │
                    │                    │       │ 7. csrfMiddleware│
                    │                    │       │    (POST/PUT/   │
                    │                    │       │     DELETE only) │
                    │                    │       ├─────────────────┤
                    │                    │       │ 8. Route handler│
                    │                    │       │    (apiRateLimit)│
                    │                    │       └─────────────────┘
                    │                    │                │
┌──────────────┐    │                    │                ▼
│   Response   │ ◄───────────────────────────  ┌──────────────────┐
│  (JSON data) │                               │  File System     │
│              │    └─── Response ────┘        │                  │
│  Stitched    │                               │  public/data/    │
│  data from   │                               │  server/private/ │
│  server/index│                               │                  │
└──────────────┘                               │  Atomic write    │
                                               │  + file locking  │
                                               └──────────────────┘
```

### Data Flow for a Write Operation (e.g., submitting a comment)

```
1. Browser GET /api/csrf-token          → CSRF cookie set
2. Browser POST /api/comments           → X-CSRF-Token header + JWT cookie (if admin)
   │
   ├── csrfMiddleware: validate token match
   ├── apiRateLimit: check 3/5min, 10/hour
   ├── Validate: author (2-30 chars, regex), content (5-500 chars)
   ├── honeypot check: must be empty
   ├── math captcha: answer must match server-generated question
   ├── Banned words filter
   ├── Duplicate detection
   ├── Write to server/private/comments.json (atomicWriteJSON)
   └── If proposedPrice present → also write to price-proposals.json
```

### Error Handling Strategy

| Layer | Strategy |
|---|---|
| **Route handlers** | `try/catch` → `res.status(500).json({ error: prodError(msg) })` |
| **prodError()** | Returns generic message in production, real error in dev |
| **Uncaught exceptions** | Winston logs with stack trace |
| **Graceful shutdown** | `SIGTERM`/`SIGINT` → `server.close()` → `process.exit(0)` after 10s timeout |
| **Validation** | Zod schemas on frontend, manual validation + sanitize-html on backend |

---

## 5. API & Interface Definitions

### Public Endpoints (no auth required, rate limited)

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| `GET` | `/health` | Health check | None |
| `GET` | `/api/data/stitched` | Stitched venues + prices + towns | 100/min |
| `GET` | `/api/data/towns` | Towns list | 100/min |
| `GET` | `/api/data/venues` | Venues list | 100/min |
| `GET` | `/api/data/prices` | Prices list | 100/min |
| `GET` | `/api/csrf-token` | CSRF token (call before any POST/DELETE) | 100/min |
| `GET` | `/api/comments` | Approved comments (?postId=&type=) | 100/min |
| `POST` | `/api/comments` | Create comment (honeypot + captcha) | 3/5min, 10/hr |
| `GET` | `/api/comments/captcha` | Math captcha `{ question, answer }` | 100/min |
| `GET` | `/api/feed/posts` | Approved user feed posts | 100/min |
| `POST` | `/api/feed/posts` | Create feed post (honeypot + captcha) | 3/5min, 10/hr |

### Auth Endpoints (JWT cookie-based)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | Public | Login → JWT cookies |
| `POST` | `/api/auth/refresh` | Public | Auto refresh tokens |
| `POST` | `/api/auth/logout` | Public | Revoke session |
| `POST` | `/api/auth/2fa/verify-login` | Public | 2FA code after login |
| `GET` | `/api/auth/2fa/status` | admin | Check 2FA status |
| `POST` | `/api/auth/2fa/setup` | admin | Generate TOTP secret |
| `POST` | `/api/auth/2fa/verify-setup` | admin | Verify + enable 2FA |
| `POST` | `/api/auth/2fa/disable` | admin | Disable 2FA (requires password) |
| `GET` | `/api/admin/me` | admin | Current user info |

### Admin Endpoints (JWT + role=admin required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/proposals` | Pending price proposals + comments |
| `GET` | `/api/admin/feed-posts` | All feed posts (including unapproved) |
| `POST` | `/api/admin/approve-price` | Approve price proposal → update prices.json |
| `DELETE` | `/api/admin/reject-proposal/:id` | Reject price proposal |
| `POST` | `/api/admin/approve-comment/:id` | Approve comment |
| `DELETE` | `/api/admin/reject-comment/:id` | Delete comment |
| `POST` | `/api/admin/approve-feed-post/:id` | Approve feed post |
| `DELETE` | `/api/admin/reject-feed-post/:id` | Delete feed post |
| `GET` | `/api/admin/audit-log` | Admin action log |
| `PUT` | `/api/admin/profile` | Update display name/email |
| `PUT` | `/api/pizzerias/:id` | Update pizzeria |
| `POST` | `/api/pizzerias/single` | Create pizzeria |
| `DELETE` | `/api/pizzerias/:id` | Delete pizzeria (cascades to prices) |
| `PUT` | `/api/prices/:pizzeriaId` | Set price directly |
| `DELETE` | `/api/prices/:pizzeriaId` | Delete price entry |
| `GET` | `/api/feed/export` | Regenerate feed-data.json from approved comments |

### Example: Login Request/Response

```json
// POST /api/auth/login
// Request:
{ "username": "peninsula-ovserver", "password": "PizzaAdmin2024!" }

// Response (no 2FA):
{ "success": true, "user": { "id": 1, "username": "peninsula-ovserver", "role": "admin" } }

// Response (2FA required):
{ "success": true, "requires2FA": true, "tempToken": "a1b2c3..." }
```

### Example: Create Feed Post

```json
// POST /api/feed/posts
// Headers: { "X-CSRF-Token": "<from /api/csrf-token>" }
// Request:
{
  "author": "Marco R.",
  "title": "Margherita fantastica a Vico",
  "description": "Crosta leggera e pomodoro dolcissimo, rapporto qualità prezzo eccellente.",
  "honeypot": "",
  "mathAnswer": 7
}

// Response (201):
{ "success": true, "message": "Scoperta condivisa! In attesa di approvazione." }
```

---

## 6. State Management & Frontend Routes

### Route Map

| Path | Page Component | Auth | Description |
|------|---------------|------|-------------|
| `/` | `Dashboard` | Public | Stats, cheapest, new openings, latest reviews |
| `/feed` | `Feed` | Public | Social feed with CreatePost, comments, likes |
| `/explore` | `Explore` | Public | Cards/Table/Network views + price proposals |
| `/directory` | `Directory` | Public | Full pizzeria listing with filters |
| `/prices` | `Prices` | Public | Sortable price matrix, admin edit mode |
| `/network` | `Network` | Public | City cluster graph visualization |
| `/admin` | `AdminPanel` | Admin (JWT) | Tabbed: pizzerias, proposals, settings |
| `/admin/pizzerias` | `Admin` | Admin | CRUD pizzerias (default tab) |
| `/admin/proposals` | `AdminProposals` | Admin | Approve prices, comments, feed posts |
| `/admin/settings` | `Settings` | Admin | Profile, 2FA, language, theme |
| `/login` | `Login` | Public | Login form with optional 2FA |

### State Providers (Context API)

| Provider | File | Purpose |
|----------|------|---------|
| `I18nProvider` | `src/i18n/I18nContext.jsx` | Language state (`it`/`en`), `t()` translate function |
| `ThemeProvider` | `src/theme/ThemeContext.jsx` | Dark/light mode toggle |

No global state library (Redux, Zustand) — all component state is local via `useState`/`useEffect`. Data fetching is done per-page with `fetch()` directly.

### Component Naming Conventions

- **Pages**: PascalCase, one file per page, lazy-loaded in `App.jsx`
- **Components**: PascalCase, organized by feature folder (`admin/`, `explore/`, `prices/`, `ui/`)
- **Hooks**: camelCase with `use` prefix (`useDataFetch`, `useComments`)
- **Config**: camelCase, default exports for config objects
- **i18n Keys**: dot-notation (e.g., `feed.whatsNew`, `comments.yourName`)

---

## 7. Security Protocols

| Category | Implementation |
|---|---|
| **Authentication** | JWT access token (15min) + refresh token (7d rotation) in HttpOnly, SameSite=Strict, signed cookies |
| **Password Hashing** | Argon2 (`@node-rs/argon2`), memoryCost: 19456, timeCost: 2 |
| **2FA** | TOTP (otplib), QR code setup, per-login verification |
| **CSRF** | Double-submit cookie: random token in non-HttpOnly cookie + `X-CSRF-Token` header, single-use |
| **CSP** | Helmet: `default-src 'self'`, no inline scripts, `frame-ancestors 'none'`, strict `connect-src` |
| **HSTS** | 1 year, `includeSubDomains`, `preload` (production only) |
| **CORS** | Whitelist via `ALLOWED_ORIGINS` env var, credentials: true |
| **Rate Limiting** | 100 req/min API-wide, 3 comments/5min, 10 comments/hour per IP |
| **Input Sanitization** | `sanitize-html` (whitelist tags), HTML entity encoding, regex name validation |
| **Banned Words** | 20+ patterns (spam, URLs, gambling, pharma) |
| **Math Captcha** | Random addition/subtraction, server-generated per-request |
| **Honeypot** | Hidden field, must be empty on submission |
| **File Locking** | Per-file promise chain prevents concurrent write corruption |
| **Atomic Writes** | Write to `.tmp.{timestamp}.{pid}` → atomic `renameSync` |
| **Error Handling** | Generic messages in production (`prodError()`), full details in dev |
| **Data Separation** | `server/private/` not served by Express, no public access to unapproved data |
| **Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: restricted` |
| **Docker Hardening** | Non-root user, read-only rootfs, tmpfs for `/tmp` and logs, `no-new-privileges`, resource limits |

### Session Management Rules

- Access tokens: 15min, never stored server-side (stateless JWT)
- Refresh tokens: 7 days, stored in `server/private/refresh-tokens.json`, rotated on each use
- Concurrent login: refresh tokens are additive (no invalidation on new login)
- Logout: immediately revokes the specific refresh token
- Admin session check: middleware checks JWT + role on every `/api/admin/*` request

---

## 8. Developer Operations & Commands

### Prerequisites

- Node.js 18+
- npm

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (port 5173) with HMR |
| `npm run server:dev` | Express backend with `--watch` auto-reload (port 3000) |
| `npm run server` | Express without file watching |
| `npm run build` | Production build: Vite → `dist/` |
| `npm start` | Express production mode (serves `dist/` + API) |
| `npm run lint` | ESLint on all source files |
| `npm run preview` | Vite preview of production build |

### Development

```bash
# Terminal 1 — Backend
npm run server:dev

# Terminal 2 — Frontend
npm run dev

# Or use the launcher (runs both):
./launch.sh
```

### Coolify / Docker (Root Domain)

Per far girare il sito su Coolify o in qualsiasi ambiente dove l'app è servita alla radice del dominio (es. `https://pizza.tuodominio.it`):

1. **Vite Base Path**: Il progetto è ora configurato con `base: '/'` di default in `vite.config.js`.
2. **Variabili d'Ambiente**: Su Coolify, configura le seguenti variabili:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `JWT_SECRET=tuo-segreto-molto-forte`
   - `JWT_REFRESH_SECRET=altro-segreto-molto-forte`
   - `ALLOWED_ORIGINS=https://tuo-dominio.it` (IMPORTANTE per il CORS)
3. **Volume**: Se usi Docker Compose, assicurati che i volumi per `public/data` e `server/private` siano persistenti.

```bash
# Build & Start manuale
npm run build
npm start
```

### Environment Variables

```env
NODE_ENV=production
PORT=3000

# Generate with: openssl rand -base64 32
JWT_SECRET=change-me-to-a-strong-jwt-secret
JWT_REFRESH_SECRET=change-me-to-a-strong-refresh-secret

ADMIN_USERNAME=peninsula-ovserver
ADMIN_PASSWORD=PizzaAdmin2024!

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Testing

The project currently has **no automated tests**. Manual testing flow:
1. Start dev servers
2. Navigate to `http://localhost:5173`
3. Verify all pages render (Dashboard, Feed, Explore, Directory, Prices, Network)
4. Test comment submission (name + captcha)
5. Test feed post creation ("Condividi la tua scoperta" button)
6. Login at `/login` with default credentials
7. Test admin CRUD (pizzerias, prices, approvals)

### Docker Production Checklist

- [ ] Generate `JWT_SECRET` and `JWT_REFRESH_SECRET` with `openssl rand -base64 32`
- [ ] Change `ADMIN_PASSWORD` to a strong password
- [ ] Configure `ALLOWED_ORIGINS` with real domain
- [ ] Obtain TLS certificate (Let's Encrypt)
- [ ] Never commit `.env` or `server/private/`

---

## 9. Deployment & GitHub Actions

### GitHub Pages (Frontend Only)
Il progetto è configurato per il deployment automatico su GitHub Pages.

1. **Build Automatico**: Ad ogni push sul branch `main`, l'Action `.github/workflows/deploy.yml` compila il progetto.
2. **Supporto SPA**: Un file `404.html` personalizzato e uno script di redirect in `index.html` gestiscono le rotte di React Router.
3. **Modalità Statica**: Poiché GitHub Pages non supporta backend Node.js, l'app opera in **modalità statica**, leggendo i dati delle pizzerie e dei prezzi direttamente dai file JSON pubblici.

### Server Deployment (Full Stack)
Per far girare il backend Express (necessario per CRUD Admin, moderazione Feed e 2FA):
1. **Docker**: Utilizza il file `docker-compose.yml` fornito.
2. **Manuale**: Esegui `npm run build` e poi `npm start` su una VPS (Render, Fly.io, ecc.).
3. **CI/CD**: Il workflow `.github/workflows/server-check.yml` verifica che il backend si avvii correttamente ad ogni push.

---

## 10. AI Reference Guide

### Coding Style Preferences

- **Functional components** with hooks (`useState`, `useEffect`, `useCallback`) — no class components
- **No comments in code** unless the comment explains a non-obvious business rule or workaround
- **Early returns** for guard clauses and error handling
- **Desctructured imports** for React hooks and utility functions
- **Named exports** for hooks, **default exports** for pages and components
- **Arrow functions** for component definitions
- **Template literals** for string interpolation

### Forbidden / Deprecated Patterns

| Pattern | Reason |
|---------|--------|
| `redux`, `zustand`, `mobx` | Not used — use Context API + local state |
| Database libraries (Prisma, Sequelize, etc.) | Not used — file-based JSON only |
| `class` components | Legacy — use functional + hooks |
| Inline `<style>` tags or CSS imports outside `index.css` | Breaks CSP — Tailwind classes only |
| `dangerouslySetInnerHTML` | Security risk — use sanitized text |
| `eval()` or `new Function()` | CSP block + security risk |
| `window.location` redirects | Use React Router's `useNavigate` |
| Direct DOM manipulation | Use React refs + state |

### Architecture Rules for New Modules

1. **New API routes** → add to `server/index.js`. If public, add path to `PUBLIC_ROUTES` in `server/middleware/auth.js`.
2. **New pages** → create file in `src/pages/`, import lazily in `src/App.jsx` with `React.lazy()` + `Suspense`.
3. **New components** → place in `src/components/` under feature folder if page-specific, or `src/components/ui/` if reusable.
4. **New data files** → public data in `public/data/`, sensitive data in `server/private/`. Never serve private data via Express static.
5. **New i18n keys** → add to both `it.json` and `en.json` in `public/data/i18n/`. Use dot-notation keys.
6. **New config** → add to `src/config/` with descriptive filename.
7. **New hooks** → add to `src/hooks/` with `use` prefix, named export.
8. **New services** → add to `src/services/` for API interaction logic.
9. **Write operations** → always fetch CSRF token first via `GET /api/csrf-token`, include `X-CSRF-Token` header.
10. **Anti-spam** — every public write endpoint must include: honeypot field, math captcha validation, rate limiting, and banned words filter.
