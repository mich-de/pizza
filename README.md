# Pizza Penisola — Sorrento Price Dashboard

Dashboard per monitorare i prezzi della pizza Margherita nelle 6 città della Penisola Sorrentina: Massa Lubrense, Sorrento, Sant'Agnello, Piano di Sorrento, Meta, Vico Equense.

## Stack

- **Frontend:** React 19 + Vite 8 + React Router 7
- **Styling:** Tailwind CSS 4 (Space Grotesk + Inter, brutalist offset shadows)
- **Backend:** Express 5 con JWT, Argon2, CSRF, CORS, Helmet CSP
- **I18n:** Sistema custom con React Context, file JSON in `/public/data/i18n/` (it/en)
- **Data:** JSON con stitching server-side, atomic writes, file locking
- **Validation:** Zod schemas per validazione dati
- **Security:** JWT + refresh token rotation, Argon2 password hashing, CSRF protection, CSP, HSTS, rate limiting
- **Logging:** Winston (stdout in produzione, JSON strutturato)

## Architettura

```
┌─────────────┐     GET /api/data/*          ┌──────────────┐     readFileSync     ┌──────────────────┐
│   React App │ ───────────────────────────► │  Express API │ ───────────────────► │ public/data/     │
│   (Vite)    │                             │  (:3001)     │                      │   towns.json     │
│             │ ◄────────────────────────── │              │                      │   venues.json    │
└─────────────┘   stitched / fallback       │  JWT + CSRF  │                      │   prices.json    │
        │                                   └──────┬───────┘                      └──────────────────┘
        │  /api/comments (POST)                    │
        │  /api/admin/* (JWT required)             │
        ▼                                   ┌──────┴───────┐                      ┌──────────────────┐
┌──────────────────┐                        │  Private dir │ ───────────────────► │ server/private/  │
│ comments.json    │                        │  (not served)│                      │   admins.json    │
│ proposals.json   │                        │              │                      │   comments.json  │
└──────────────────┘                        │  Audit log   │                      │   proposals.json │
                                            └──────────────┘                      │   refresh-tokens │
                                                                                  │   audit-log.json │
                                                                                  └──────────────────┘
```

Il server effettua **JSON stitching** lato backend (`/api/data/stitched`) con scrittura atomica e file locking per prevenire corruzioni. I dati sensibili sono in `server/private/`, **non serviti pubblicamente**.

## Login Admin

Credenziali di default (cambia in produzione!):

| Campo | Valore |
|---|---|
| **URL** | `http://localhost:3001/login` |
| **Username** | `peninsula-ovserver` |
| **Password** | `PizzaAdmin2024!` |

Al login il server genera:
1. **Access token** (JWT, 15 min) → cookie HttpOnly
2. **Refresh token** (JWT, 7 giorni) → cookie HttpOnly con rotazione

Il frontend gestisce automaticamente il refresh dei token. Se la sessione scade, vieni reindirizzato a `/login`.

## Sviluppo

### Prerequisiti

- Node.js 18+
- npm

### Avvio (dev)

```bash
# Opzione 1: Launcher automatico
chmod +x launch.sh
./launch.sh

# Opzione 2: Terminali separati
npm run server:dev  # Backend Express (localhost:3001)
npm run dev         # Frontend Vite (localhost:5173)
```

### Build produzione

```bash
npm run build      # Compila frontend in dist/
npm start          # Express production mode (serve dist/ + API)
```

### Docker

```bash
cp .env.example .env  # Modifica JWT_SECRET e ADMIN_PASSWORD
docker compose up -d
```

## Scripts

| Comando | Descrizione |
|---|---|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run server:dev` | Express con auto-reload |
| `npm run server` | Express senza watch |
| `npm run build` | Build produzione |
| `npm start` | Express production mode |
| `./launch.sh` | Launcher automatico |

## Struttura

```
src/
├── components/
│   ├── admin/            # PizzeriaRow, AddModal
│   ├── explore/          # Explore cards, proposal form
│   ├── prices/           # PricesTable, PricesDetail
│   ├── ui/               # StatCard, Card, Badge, PageHeader
│   ├── Layout.jsx
│   ├── Sidebar.jsx
│   └── TopBar.jsx
├── pages/
│   ├── Dashboard.jsx
│   ├── Feed.jsx
│   ├── Directory.jsx
│   ├── Prices.jsx
│   ├── Network.jsx
│   ├── Settings.jsx
│   ├── Admin.jsx          # Gestione pizzerie (JWT auth)
│   ├── AdminProposals.jsx # Approvazione prezzi/commenti (JWT auth)
│   ├── Explore.jsx
│   └── Login.jsx          # Login admin
├── services/
│   ├── authService.js     # JWT auth check, logout
│   └── DataFetchService.js
├── hooks/
│   ├── useDataFetch.js
│   └── useComments.js
├── config/
│   ├── navigation.js
│   └── schemas.js         # Zod schemas
├── i18n/
│   └── I18nContext.jsx
├── theme/
│   └── ThemeContext.jsx
├── utils/
│   └── groupByCity.js
├── App.jsx
├── main.jsx
└── index.css

server/
├── index.js               # Express API (JWT, CSRF, audit)
├── middleware/
│   ├── auth.js            # JWT verification + RBAC
│   └── csrf.js            # CSRF token protection
├── utils/
│   ├── password.js        # Argon2 hash/verify
│   ├── jwt.js             # JWT generate/verify
│   ├── refreshTokens.js   # Token rotation + revocation
│   └── auditLog.js        # Audit logging
├── private/               # DATI SENSIBILI - non serviti
│   ├── admins.json
│   ├── comments.json
│   ├── price-proposals.json
│   ├── refresh-tokens.json
│   └── audit-log.json
└── logs/                  # Winston logs (tmpfs in Docker)

public/data/               # Dati pubblici
├── towns.json
├── venues.json
├── prices.json
└── i18n/
```

## API

### Health

| Endpoint | Metodo | Descrizione |
|---|---|---|
| `/health` | GET | Health check leggero (no auth, no dati) |

### Dati (pubblici, rate limited)

| Endpoint | Metodo | Descrizione |
|---|---|---|
| `/api/data/stitched` | GET | Dati joinati (venues + prices + towns) |
| `/api/data/towns` | GET | Lista comuni |
| `/api/data/venues` | GET | Lista pizzerie |
| `/api/data/prices` | GET | Lista prezzi |

### Auth

| Endpoint | Metodo | Descrizione |
|---|---|---|
| `/api/csrf-token` | GET | Ottieni CSRF token (prima di ogni POST/DELETE) |
| `/api/auth/login` | POST | Login (username + password) → JWT cookies |
| `/api/auth/refresh` | POST | Refresh access token (automatico) |
| `/api/auth/logout` | POST | Logout + revoca refresh token |
| `/api/admin/me` | GET | Info utente corrente |

### Commenti (pubblici, rate limited)

| Endpoint | Metodo | Descrizione |
|---|---|---|
| `/api/comments` | GET | Commenti approvati (admin vede tutti) |
| `/api/comments` | POST | Nuovo commento (honeypot + captcha) |
| `/api/comments/captcha` | GET | Genera captcha matematico |

### Admin (JWT richiesto, ruolo `admin`)

| Endpoint | Metodo | Descrizione |
|---|---|---|
| `/api/admin/proposals` | GET | Proposte prezzi + commenti pendenti |
| `/api/admin/approve-price` | POST | Approva proposta → aggiorna prezzo |
| `/api/admin/reject-proposal/:id` | DELETE | Rifiuta proposta |
| `/api/admin/approve-comment/:id` | POST | Pubblica commento |
| `/api/admin/reject-comment/:id` | DELETE | Nascondi commento |
| `/api/admin/audit-log` | GET | Log azioni admin |
| `/api/pizzerias/single` | POST | Crea pizzeria |
| `/api/pizzerias/:id` | DELETE | Elimina pizzeria |

Ogni richiesta POST/DELETE richiede header `X-CSRF-Token` ottenuto da `/api/csrf-token`. I JWT sono cookie HttpOnly gestiti automaticamente dal browser.

## Variabili d'ambiente

```env
NODE_ENV=production
PORT=3001

# JWT Secrets (genera con: openssl rand -base64 32)
JWT_SECRET=change-me-to-a-strong-jwt-secret
JWT_REFRESH_SECRET=change-me-to-a-strong-refresh-secret

# Admin Credentials
ADMIN_USERNAME=peninsula-ovserver
ADMIN_PASSWORD=PizzaAdmin2024!

# CORS - aggiungi solo il tuo dominio in produzione
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
```

## Security

| Livello | Implementazione |
|---|---|
| **Auth** | JWT access token (15 min) + refresh token rotation (7 giorni), cookie HttpOnly, SameSite=strict |
| **Password** | Argon2 (memoryCost: 19456, timeCost: 2) |
| **CSRF** | Token per-request, double-submit cookie pattern |
| **CSP** | Helmet con directive restrittive (no inline script, no frame) |
| **HSTS** | max-age 1 anno, includeSubDomains, preload |
| **Rate limiting** | 30 req/min API, 3 commenti/5min, 10/ora |
| **Sanitizzazione** | HTML entity encoding, rimozione tag/script, banned words |
| **File locking** | Lock per-file su scritture JSON per prevenire corruzioni |
| **Atomic writes** | Scrittura su tmp + rename atomica |
| **Audit log** | Tutte le azioni admin tracciate con IP e timestamp |
| **Error hiding** | Stack trace e dettagli mascherati in produzione |
| **Private dir** | Dati sensibili in `server/private/`, non serviti dal web server |
| **TLS 1.3** | Solo TLS 1.3 in produzione, session tickets disabilitati |

## Deployment

### Docker

```bash
cp .env.example .env
# Modifica JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_PASSWORD
docker compose up -d
```

Container hardening:
- User non-root (`appuser`)
- Filesystem read-only con tmpfs per `/tmp` e `server/logs`
- Volume persistente per `public/data` e `server/private`
- Healthcheck su `/health`
- Resource limits (512MB RAM, 1 CPU)
- `no-new-privileges`

### Nginx (reverse proxy)

Configurazione in `nginx.conf`:
- Redirect HTTP → HTTPS (301)
- **Solo TLS 1.3** con ciphers moderni
- Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy)
- Proxy per `/api/` con forwarding cookie
- `/health` proxy pass per healthcheck
- `/data/` **bloccato** (`deny all`)
- Blocco accesso a `.env`, `.git`, `.htaccess`
- gzip per compressione
- Cache statica 1 anno per asset

### Produzione checklist

- [ ] Genera `JWT_SECRET` e `JWT_REFRESH_SECRET` con `openssl rand -base64 32`
- [ ] Cambia `ADMIN_PASSWORD` con password complessa
- [ ] Configura `ALLOWED_ORIGINS` con il dominio reale
- [ ] Ottieni certificato TLS (Let's Encrypt)
- [ ] Non committare mai `.env` o `server/private/`
