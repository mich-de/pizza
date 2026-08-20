import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { existsSync, statSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes, randomUUID } from 'crypto';

import { 
  PORT, NODE_ENV, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD_HASH,
  ALLOWED_ORIGINS, ADMINS_PATH, root, VENUES_PATH, TOWNS_PATH,
  PRICES_PATH, EVENTS_PATH, COMMENTS_PATH, PROPOSALS_PATH, FEED_POSTS_PATH,
  UPLOADS_DIR, UPLOADS_URL, MAX_UPLOAD_BYTES,
  MIN_NAME_LENGTH, MAX_NAME_LENGTH, MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH
} from './config.js';

import {
  LoginSchema, CommentSchema, FeedPostSchema, PriceProposalSchema, EventSchema,
  TownsSchema, VenuesSchema, PricesSchema, EventsSchema, CommentsSchema, ProposalsSchema
} from './schemas.js';
import { logger } from './utils/logger.js';
import { 
  checkLoginRateLimit, recordLoginAttempt, checkAccountLockout, 
  recordFailedLogin, clearFailedLogins, apiRateLimit, 
  checkRateLimit, recordComment 
} from './utils/rateLimit.js';

import { 
  createCaptchaToken, verifyCaptchaToken, sanitize, 
  removeDangerousContent, containsBannedWords, sanitizeObject 
} from './utils/security.js';

import {
  safeReadJSON, safeWriteJSON, stitchData
} from './services/storage.js';

import { hashPassword, verifyPassword } from './utils/password.js';
import { generateAccessToken, ACCESS_EXPIRES_MS, REFRESH_EXPIRES_MS } from './utils/jwt.js';
import { createRefreshToken, validateRefreshToken, revokeRefreshToken } from './utils/refreshTokens.js';
import { createSecret, createKeyUri, createQRCodeDataURI, verifyTOTP } from './utils/totp.js';
import { authMiddleware, requireRole } from './middleware/auth.js';
import { csrfMiddleware, csrfToken } from './middleware/csrf.js';
import { auditLog, getAuditLog } from './utils/auditLog.js';

const app = express();
export { app };

app.set('trust proxy', process.env.TRUST_PROXY || 1);
app.use(compression());

// --- Shared State ---
const pending2FALogins = new Map();

// --- API Helpers ---
function prodError(msg) {
  return NODE_ENV === 'production' ? 'Errore interno del server' : msg;
}

async function seedAdmin() {
  const admins = await safeReadJSON(ADMINS_PATH, []);
  let changed = false;

  for (const admin of admins) {
    if (!admin.displayName) {
      admin.displayName = admin.username;
      changed = true;
    }
    if (!admin.email) {
      admin.email = '';
      changed = true;
    }
  }

  if (admins.length === 0) {
    const hash = ADMIN_PASSWORD_HASH || await hashPassword(process.env.ADMIN_PASSWORD || 'sorrento');
    admins.push({
      id: 1,
      username: ADMIN_USERNAME,
      passwordHash: hash,
      role: 'admin',
      displayName: ADMIN_USERNAME,
      email: '',
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    });
    changed = true;
    logger.info('Admin di default creato con mustChangePassword=true');
  } else {
    let idx = admins.findIndex(a => a.id === 1);
    if (idx !== -1) {
      if (admins[idx].username !== ADMIN_USERNAME) {
        logger.info(`Aggiornamento username admin: ${admins[idx].username} -> ${ADMIN_USERNAME}`);
        admins[idx].username = ADMIN_USERNAME;
        admins[idx].displayName = ADMIN_USERNAME;
        admins[idx].mustChangePassword = true;
        changed = true;
      }

      if (process.env.ADMIN_PASSWORD || ADMIN_PASSWORD_HASH) {
        const envPassword = process.env.ADMIN_PASSWORD;
        const storedHash = admins[idx].passwordHash;
        const same = envPassword ? await verifyPassword(envPassword, storedHash).catch(() => false) : false;
        if (!same && ADMIN_PASSWORD_HASH && storedHash !== ADMIN_PASSWORD_HASH) {
          admins[idx].passwordHash = ADMIN_PASSWORD_HASH;
          admins[idx].mustChangePassword = true;
          changed = true;
        } else if (!same && envPassword) {
          admins[idx].passwordHash = await hashPassword(envPassword);
          admins[idx].mustChangePassword = true;
          changed = true;
        }
      }
    }
  }

  if (changed) {
    await safeWriteJSON(ADMINS_PATH, admins);
  }
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://frontend-cdn.perplexity.ai', 'data:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

const corsOptionsDelegate = (req, callback) => {
  const origin = req.header('Origin');
  let isAllowed = false;

  if (!origin || NODE_ENV !== 'production') {
    isAllowed = true;
  } else if (ALLOWED_ORIGINS.includes(origin)) {
    isAllowed = true;
  } else {
    try {
      const originUrl = new URL(origin);
      const host = req.header('Host');
      const forwardedHost = req.header('X-Forwarded-Host');
      if (originUrl.host === host || (forwardedHost && originUrl.host === forwardedHost)) {
        isAllowed = true;
      }
    } catch {
      // Malformed Origin header — treat as disallowed
    }
  }


  if (isAllowed) {
    callback(null, {
      origin: true,
      methods: ['GET', 'POST', 'DELETE', 'PUT'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      credentials: true,
      maxAge: 86400,
    });
  } else {
    console.warn(`[CORS] Rejected origin: "${origin}" (Allowed: ${ALLOWED_ORIGINS.join(', ')})`);
    callback(new Error('Not allowed by CORS'));
  }
};

app.use(cors(corsOptionsDelegate));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  next();
});

/* Le locandine si servono da `public/`, e prima di `dist/`: `dist/` ne tiene
   una copia ferma al momento della compilazione, quindi una locandina caricata
   adesso li' non c'e'. `express.static` perche' normalizza il percorso da solo
   — con una concatenazione a mano, un `..` nell'indirizzo uscirebbe dalla
   cartella. Se il file non c'e', si prosegue e decide `dist/`. */
app.use(UPLOADS_URL, express.static(UPLOADS_DIR, {
  fallthrough: true,
  index: false,
  dotfiles: 'deny',
  maxAge: '1y',
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));

// Serve static files
{
  const distDir = join(root, 'dist');
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    const fileName = req.path === '/' ? 'index.html' : req.path;
    const filePath = join(distDir, fileName);
    if (!existsSync(filePath)) return next();
    const stat = statSync(filePath);
    if (!stat.isFile()) return next();

    const ext = fileName.split('.').pop().toLowerCase();
    const mime = {
      html: 'text/html', css: 'text/css', js: 'application/javascript',
      json: 'application/json', svg: 'image/svg+xml', png: 'image/png',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
      webp: 'image/webp', ico: 'image/x-icon', txt: 'text/plain',
      xml: 'application/xml', map: 'application/json',
      woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', eot: 'application/vnd.ms-fontobject',
    };
    res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', ext === 'html' ? 'no-cache' : 'public, max-age=31536000, immutable');
    res.sendFile(fileName, { root: distDir }, (err) => {
      if (err && !res.headersSent) res.status(500).type('text/plain').send('Internal Server Error');
    });
  });
}

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser(JWT_SECRET));

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/api/csrf-token', csrfToken);

// SPA Fallback
{
  const distIndex = join(root, 'dist', 'index.html');
  app.get(/^(?!\/api).*$/, (req, res, next) => {
    if (req.path.includes('.') || req.path.startsWith('/assets/')) return next();
    if (existsSync(distIndex)) {
      res.sendFile(distIndex, (err) => {
        if (err && !res.headersSent) res.status(500).json({ error: 'Internal server error' });
      });
    } else next();
  });
}

app.get('/api/admin/admins', apiRateLimit, async (_req, res) => {
  try {
    const admins = await safeReadJSON(ADMINS_PATH, []);
    res.json(admins.map(({ id, username, role, displayName }) => ({ id, username, role, displayName })));
  } catch { res.status(500).json({ error: 'Errore interno del server' }); }
});

app.post('/api/admin/verify-login', apiRateLimit, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ ok: false, error: 'Username e password richiesti' });
    const admins = await safeReadJSON(ADMINS_PATH, []);
    const admin = admins.find(a => a.username === username);
    if (!admin) return res.status(401).json({ ok: false, error: 'Credenziali errate' });
    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) return res.status(401).json({ ok: false, error: 'Credenziali errate' });
    res.json({ ok: true, user: { id: admin.id, username: admin.username, role: admin.role } });
  } catch { res.status(500).json({ ok: false, error: 'Errore interno del server' }); }
});

app.use(authMiddleware);
app.use(csrfMiddleware);

app.post('/api/auth/login', apiRateLimit, async (req, res) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Dati non validi' });

    const { username, password } = parsed.data;
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

    const ipCheck = checkLoginRateLimit(clientIp);
    if (!ipCheck.allowed) return res.status(429).json({ error: `Troppi tentativi. Riprova tra ${ipCheck.waitSeconds} secondi` });

    const admins = await safeReadJSON(ADMINS_PATH, []);
    const admin = admins.find(a => a.username === username);
    if (!admin) { recordLoginAttempt(clientIp); return res.status(401).json({ error: 'Credenziali non valide' }); }

    const lockCheck = checkAccountLockout(admin);
    if (lockCheck.locked) return res.status(429).json({ error: `Account bloccato. Riprova tra ${lockCheck.waitSeconds} secondi` });

    const validPassword = await verifyPassword(password, admin.passwordHash);
    if (!validPassword) {
      recordLoginAttempt(clientIp);
      await recordFailedLogin(admin, admins);
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    await clearFailedLogins(admin, admins);

    if (admin.twoFASecret) {
      const tempToken = randomBytes(32).toString('hex');
      pending2FALogins.set(tempToken, { userId: admin.id, username: admin.username, role: admin.role, createdAt: Date.now() });
      return res.json({ requires2FA: true, tempToken });
    }

    const accessToken = generateAccessToken({ userId: admin.id, username: admin.username, role: admin.role });
    const refreshTokenId = createRefreshToken(admin.id, admin.role);

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'strict', signed: true, maxAge: ACCESS_EXPIRES_MS });
    res.cookie('refreshToken', refreshTokenId, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'strict', signed: true, maxAge: REFRESH_EXPIRES_MS });

    auditLog(admin.id, 'login', 'auth', { ip: clientIp });
    logger.info('Login riuscito', { userId: admin.id, username: admin.username });
    res.json({ success: true, mustChangePassword: !!admin.mustChangePassword });
  } catch (err) {
    logger.error('Errore login', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const tokenId = req.signedCookies?.refreshToken || req.cookies?.refreshToken;
    if (tokenId) revokeRefreshToken(tokenId);
    res.clearCookie('accessToken', { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'strict', signed: true });
    res.clearCookie('refreshToken', { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'strict', signed: true });
    res.json({ success: true });
  } catch (err) {
    logger.error('Errore logout', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.post('/api/auth/2fa/verify-login', apiRateLimit, async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) return res.status(400).json({ error: 'Dati non validi' });

    const pending = pending2FALogins.get(tempToken);
    if (!pending) return res.status(401).json({ error: 'Sessione scaduta' });

    const admins = await safeReadJSON(ADMINS_PATH, []);
    const admin = admins.find(a => a.id === pending.userId);
    if (!admin || !admin.twoFASecret) { pending2FALogins.delete(tempToken); return res.status(401).json({ error: '2FA non configurata' }); }

    if (!verifyTOTP(code, admin.twoFASecret)) return res.status(401).json({ error: 'Codice non valido' });

    pending2FALogins.delete(tempToken);
    const accessToken = generateAccessToken({ userId: admin.id, username: admin.username, role: admin.role });
    const refreshTokenId = createRefreshToken(admin.id, admin.role);

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'strict', signed: true, maxAge: ACCESS_EXPIRES_MS });
    res.cookie('refreshToken', refreshTokenId, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'strict', signed: true, maxAge: REFRESH_EXPIRES_MS });

    auditLog(admin.id, 'login', 'auth', { ip: req.ip });
    logger.info('Login 2FA riuscito', { userId: admin.id, username: admin.username });
    res.json({ success: true });
  } catch (err) {
    logger.error('Errore verifica 2FA login', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.post('/api/auth/refresh', apiRateLimit, async (req, res) => {
  try {
    const tokenId = req.signedCookies?.refreshToken || req.cookies?.refreshToken;
    if (!tokenId) return res.status(401).json({ error: 'Refresh token mancante' });

    const entry = validateRefreshToken(tokenId);
    if (!entry) return res.status(401).json({ error: 'Refresh token non valido o revocato' });

    revokeRefreshToken(tokenId);
    const newRefreshTokenId = createRefreshToken(entry.userId, entry.role);
    const accessToken = generateAccessToken({ userId: entry.userId, role: entry.role });

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'strict', signed: true, maxAge: ACCESS_EXPIRES_MS });
    res.cookie('refreshToken', newRefreshTokenId, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'strict', signed: true, maxAge: REFRESH_EXPIRES_MS });

    res.json({ success: true });
  } catch (err) {
    logger.error('Errore refresh token', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.put('/api/auth/change-password', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Password attuale e nuova password richieste' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'La nuova password deve contenere almeno 6 caratteri' });

    const admins = await safeReadJSON(ADMINS_PATH, []);
    const admin = admins.find(a => a.id === req.user.userId);
    if (!admin) return res.status(404).json({ error: 'Utente non trovato' });

    if (!(await verifyPassword(currentPassword, admin.passwordHash))) return res.status(401).json({ error: 'Password attuale non valida' });

    admin.passwordHash = await hashPassword(newPassword);
    admin.mustChangePassword = false;
    await safeWriteJSON(ADMINS_PATH, admins);

    auditLog(req.user.userId, 'change_password', 'auth', { ip: req.ip });
    res.json({ success: true, message: 'Password aggiornata con successo' });
  } catch (err) {
    logger.error('Errore cambio password', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.get('/api/auth/2fa/status', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const admins = await safeReadJSON(ADMINS_PATH, []);
    const admin = admins.find(a => a.id === req.user.userId);
    if (!admin) return res.status(404).json({ error: 'Utente non trovato' });
    res.json({ enabled: !!admin.twoFASecret, username: admin.username });
  } catch (err) {
    logger.error('Errore stato 2FA', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.post('/api/auth/2fa/setup', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const admins = await safeReadJSON(ADMINS_PATH, []);
    const admin = admins.find(a => a.id === req.user.userId);
    if (!admin) return res.status(404).json({ error: 'Utente non trovato' });
    if (admin.twoFASecret) return res.status(400).json({ error: '2FA già attiva' });

    const secret = createSecret();
    const keyUri = createKeyUri(secret, admin.username);
    const qrCode = await createQRCodeDataURI(keyUri);

    admin.twoFATempSecret = secret;
    await safeWriteJSON(ADMINS_PATH, admins);
    res.json({ secret, keyUri, qrCode });
  } catch (err) {
    logger.error('Errore setup 2FA', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.post('/api/auth/2fa/verify-setup', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Codice mancante' });
    const admins = await safeReadJSON(ADMINS_PATH, []);
    const admin = admins.find(a => a.id === req.user.userId);
    if (!admin) return res.status(404).json({ error: 'Utente non trovato' });

    const secret = admin.twoFATempSecret || admin.twoFASecret;
    if (!secret) return res.status(400).json({ error: 'Nessun setup in corso' });

    if (!verifyTOTP(code, secret)) return res.status(401).json({ error: 'Codice non valido' });

    admin.twoFASecret = secret;
    delete admin.twoFATempSecret;
    await safeWriteJSON(ADMINS_PATH, admins);

    auditLog(admin.id, '2fa_enabled', 'auth', { ip: req.ip });
    res.json({ success: true, message: '2FA attivata con successo' });
  } catch (err) {
    logger.error('Errore verifica setup 2FA', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.post('/api/auth/2fa/disable', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password obbligatoria' });

    const admins = await safeReadJSON(ADMINS_PATH, []);
    const admin = admins.find(a => a.id === req.user.userId);
    if (!admin) return res.status(404).json({ error: 'Utente non trovato' });
    if (!admin.twoFASecret) return res.status(400).json({ error: '2FA non attiva' });

    if (!(await verifyPassword(password, admin.passwordHash))) return res.status(401).json({ error: 'Password non valida' });

    delete admin.twoFASecret;
    delete admin.twoFATempSecret;
    await safeWriteJSON(ADMINS_PATH, admins);

    auditLog(admin.id, '2fa_disabled', 'auth', { ip: req.ip });
    res.json({ success: true, message: '2FA disattivata' });
  } catch (err) {
    logger.error('Errore disattivazione 2FA', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.get('/api/data/stitched', apiRateLimit, async (req, res) => {
  try {
    res.json(await stitchData(req.user?.role === 'admin'));
  } catch (err) {
    logger.error('Errore stitching', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.get('/api/data/full', apiRateLimit, async (_req, res) => {
  const start = Date.now();
  try {
    const [towns, venues, prices] = await Promise.all([
      safeReadJSON(TOWNS_PATH, []),
      safeReadJSON(VENUES_PATH, []),
      safeReadJSON(PRICES_PATH, [])
    ]);
    const duration = Date.now() - start;
    if (duration > 1000) logger.warn('Slow data fetch (full)', { duration, towns: towns.length, venues: venues.length, prices: prices.length });
    res.json({ towns, venues, prices });
  } catch (err) {
    logger.error('Errore recupero dati completi', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.get('/api/data/towns', apiRateLimit, async (_req, res) => {
  try { res.json(await safeReadJSON(TOWNS_PATH, [])); }
  catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.get('/api/data/venues', apiRateLimit, async (_req, res) => {
  try { res.json(await safeReadJSON(VENUES_PATH, [])); }
  catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.get('/api/data/prices', apiRateLimit, async (_req, res) => {
  try { res.json(await safeReadJSON(PRICES_PATH, [])); }
  catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

/* Gli eventi passano da qui e non piu' dal file statico: chi li modifica dal
   Pannello scrive su `public/data/events.json`, ma `dist/` ne conserva la
   copia fatta al momento della compilazione. Leggendo il file dal disco a ogni
   richiesta, una modifica si vede subito invece che alla prossima build. */
app.get('/api/data/events', apiRateLimit, async (_req, res) => {
  try { res.json(await safeReadJSON(EVENTS_PATH, [])); }
  catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

/* Il caricamento di una locandina.
   Arriva come byte grezzi, non come modulo a piu' parti: cosi' non serve una
   libreria in piu' e non c'e' un nome di file che viaggia dal client. Il nome
   lo decide il server, ed e' casuale — quello scelto da chi carica non tocca
   mai il disco, quindi non c'e' modo di scrivere fuori dalla cartella ne' di
   sovrascrivere una locandina altrui indovinandone il nome.

   Il tipo si legge dai primi byte, non dall'intestazione `Content-Type`, che
   la dichiara chi manda e quindi non prova niente. L'estensione salvata viene
   da quella lettura: un eseguibile ribattezzato `.png` non passa, e comunque
   la cartella si serve con `nosniff`. */
const IMAGE_KINDS = [
  { ext: 'png', test: b => b.length > 8 && b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(4) === 0x0d0a1a0a },
  { ext: 'jpg', test: b => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'webp', test: b => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
  { ext: 'gif', test: b => b.length > 6 && b.toString('ascii', 0, 3) === 'GIF' },
];

app.post('/api/admin/events/poster',
  apiRateLimit,
  requireRole('admin'),
  express.raw({ type: ['image/*', 'application/octet-stream'], limit: MAX_UPLOAD_BYTES }),
  async (req, res) => {
    try {
      const buf = req.body;
      if (!Buffer.isBuffer(buf) || buf.length === 0) {
        return res.status(400).json({ error: 'Nessun file ricevuto' });
      }
      if (buf.length > MAX_UPLOAD_BYTES) {
        return res.status(413).json({ error: 'Immagine troppo pesante' });
      }
      const kind = IMAGE_KINDS.find(k => k.test(buf));
      if (!kind) {
        return res.status(415).json({ error: 'Formato non riconosciuto: servono PNG, JPEG, WebP o GIF' });
      }

      await mkdir(UPLOADS_DIR, { recursive: true });
      const fileName = `${randomUUID()}.${kind.ext}`;
      await writeFile(join(UPLOADS_DIR, fileName), buf);

      auditLog(req.user.userId, 'upload_poster', 'event', { fileName, bytes: buf.length });
      res.status(201).json({ url: `${UPLOADS_URL}/${fileName}`, bytes: buf.length });
    } catch (err) {
      logger.error('Caricamento locandina fallito', { err: err.message });
      res.status(500).json({ error: prodError('Errore interno del server') });
    }
  });

app.post('/api/admin/events', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const parsed = EventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dati non validi' });

    const events = await safeReadJSON(EVENTS_PATH, []);
    /* Identificativo leggibile ricavato dal titolo, come quelli gia' in
       archivio (`pizza-a-vico-2026`). Se e' gia' preso si accoda un numero:
       due edizioni con lo stesso nome nello stesso anno non devono
       sovrascriversi a vicenda. */
    const base = `${parsed.data.title}-${parsed.data.dateStart.slice(0, 4)}`
      .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'evento';
    let id = base, n = 2;
    while (events.some(e => e.id === id)) id = `${base}-${n++}`;

    const newEvent = { id, ...parsed.data };
    events.push(newEvent);
    await safeWriteJSON(EVENTS_PATH, events);
    auditLog(req.user.userId, 'create_event', 'event', { eventId: id });
    res.status(201).json(newEvent);
  } catch (err) {
    logger.error('Errore creazione evento', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.put('/api/admin/events/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const parsed = EventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dati non validi' });

    const events = await safeReadJSON(EVENTS_PATH, []);
    const idx = events.findIndex(e => String(e.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Evento non trovato' });

    // L'identificativo non cambia: e' quello che tiene insieme i collegamenti.
    events[idx] = { ...events[idx], ...parsed.data, id: events[idx].id };
    await safeWriteJSON(EVENTS_PATH, events);
    auditLog(req.user.userId, 'update_event', 'event', { eventId: req.params.id });
    res.json(events[idx]);
  } catch (err) {
    logger.error('Errore modifica evento', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.delete('/api/admin/events/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const events = await safeReadJSON(EVENTS_PATH, []);
    const rest = events.filter(e => String(e.id) !== String(req.params.id));
    if (rest.length === events.length) return res.status(404).json({ error: 'Evento non trovato' });
    await safeWriteJSON(EVENTS_PATH, rest);
    auditLog(req.user.userId, 'delete_event', 'event', { eventId: req.params.id });
    res.json({ success: true, message: 'Evento eliminato' });
  } catch (err) {
    logger.error('Errore eliminazione evento', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.get('/api/comments', apiRateLimit, async (req, res) => {
  try {
    const comments = await safeReadJSON(COMMENTS_PATH, []);
    const isAdmin = req.user?.role === 'admin';
    const { postId, type } = req.query;
    let filtered = comments;
    if (postId) filtered = filtered.filter(c => c.postId === postId);
    if (type) filtered = filtered.filter(c => c.type === type);
    else filtered = filtered.filter(c => c.type !== 'price_proposal' && !c.content?.startsWith('Prezzo Margherita proposto a'));
    if (!isAdmin) filtered = filtered.filter(c => c.approved);
    res.json(filtered);
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.post('/api/comments', apiRateLimit, async (req, res) => {
  try {
    const parsed = CommentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Campi mancanti o non validi' });
    const { postId, author, content, honeypot, mathAnswer, captchaToken } = parsed.data;
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

    if (honeypot && honeypot.trim() !== '') return res.status(400).json({ error: 'Richiesta non valida' });
    if (!verifyCaptchaToken(captchaToken, mathAnswer)) return res.status(400).json({ error: 'Verifica captcha fallita' });

    const sanitizedAuthor = sanitize(removeDangerousContent(author)).replace(/&amp;/g, '&');
    const sanitizedContent = sanitize(removeDangerousContent(content)).replace(/&amp;/g, '&');

    if (sanitizedAuthor.length < MIN_NAME_LENGTH || sanitizedAuthor.length > MAX_NAME_LENGTH) return res.status(400).json({ error: 'Nome non valido' });
    if (sanitizedContent.length < MIN_CONTENT_LENGTH || sanitizedContent.length > MAX_CONTENT_LENGTH) return res.status(400).json({ error: 'Testo non valido' });
    if (containsBannedWords(sanitizedAuthor) || containsBannedWords(sanitizedContent)) return res.status(400).json({ error: 'Contenuto non consentito' });

    const existingComments = await safeReadJSON(COMMENTS_PATH, []);
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) return res.status(429).json({ error: `Troppe richieste. Riprova tra ${rateLimit.waitSeconds} secondi`, retryAfter: rateLimit.waitSeconds });

    const newComment = {
      id: (existingComments.length > 0 ? Math.max(...existingComments.map(c => c.id)) : 0) + 1,
      postId, author: sanitizedAuthor, content: sanitizedContent,
      createdAt: new Date().toISOString(), approved: false,
      /* Un commento e' sempre e solo un commento. Le segnalazioni di prezzo
         hanno la loro rotta, `POST /api/proposals`: prima passavano di qui e
         lasciavano due righe — una proposta e un messaggio con dentro la nota,
         che poi andava nascosto a mano al pubblico e ricompariva comunque fra
         i commenti da approvare. */
      type: 'review',
    };

    existingComments.push(newComment);
    await safeWriteJSON(COMMENTS_PATH, existingComments);
    recordComment(clientIp);

    logger.info('Commento creato', { postId, author: sanitizedAuthor });
    res.status(201).json(newComment);
  } catch (err) {
    logger.error('Errore creazione commento', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

/* Segnalare un prezzo sbagliato: una riga sola, nell'elenco delle proposte.
   La nota facoltativa viaggia dentro la proposta, accanto al prezzo che
   spiega, e non diventa un messaggio da nessuna parte. Stessa catena
   anti-abuso dei commenti — trappola, captcha, parole vietate, freno per
   indirizzo — perche' e' lo stesso modulo pubblico e senza autenticazione. */
app.post('/api/proposals', apiRateLimit, async (req, res) => {
  try {
    const parsed = PriceProposalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Campi mancanti o non validi' });
    const { postId, author, proposedPrice, note, honeypot, mathAnswer, captchaToken } = parsed.data;
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

    if (honeypot && honeypot.trim() !== '') return res.status(400).json({ error: 'Richiesta non valida' });
    if (!verifyCaptchaToken(captchaToken, mathAnswer)) return res.status(400).json({ error: 'Verifica captcha fallita' });

    const sanitizedAuthor = sanitize(removeDangerousContent(author)).replace(/&amp;/g, '&');
    const sanitizedNote = note ? sanitize(removeDangerousContent(note)).replace(/&amp;/g, '&') : '';

    if (sanitizedAuthor.length < MIN_NAME_LENGTH || sanitizedAuthor.length > MAX_NAME_LENGTH) return res.status(400).json({ error: 'Nome non valido' });
    if (containsBannedWords(sanitizedAuthor) || containsBannedWords(sanitizedNote)) return res.status(400).json({ error: 'Contenuto non consentito' });

    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) return res.status(429).json({ error: `Troppe richieste. Riprova tra ${rateLimit.waitSeconds} secondi`, retryAfter: rateLimit.waitSeconds });

    const proposals = await safeReadJSON(PROPOSALS_PATH, []);
    const priceEntry = (await safeReadJSON(PRICES_PATH, [])).find(p => p.pizzeriaId === postId);
    const newProposal = {
      id: (proposals.length > 0 ? Math.max(...proposals.map(p => p.id)) : 0) + 1,
      postId, pizzeriaId: postId, author: sanitizedAuthor, proposedPrice,
      note: sanitizedNote,
      currentPrice: priceEntry ? priceEntry.margheritaPrice : null,
      createdAt: new Date().toISOString(), reviewed: false,
    };

    proposals.push(newProposal);
    await safeWriteJSON(PROPOSALS_PATH, proposals);
    recordComment(clientIp);

    logger.info('Proposta prezzo creata', { postId, author: sanitizedAuthor, proposedPrice });
    res.status(201).json(newProposal);
  } catch (err) {
    logger.error('Errore creazione proposta', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.get('/api/comments/captcha', (_req, res) => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const ops = ['+', '-'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let answer, question;
  if (op === '+') { answer = a + b; question = `${a} + ${b} = ?`; }
  else {
    if (a < b) { answer = b - a; question = `${b} - ${a} = ?`; }
    else { answer = a - b; question = `${a} - ${b} = ?`; }
  }
  res.json({ question, captchaToken: createCaptchaToken(answer) });
});

app.get('/api/admin/dashboard-stats', apiRateLimit, requireRole('admin'), async (_req, res) => {
  try {
    const [proposals, comments, feedPosts, venues] = await Promise.all([
      safeReadJSON(PROPOSALS_PATH, []), safeReadJSON(COMMENTS_PATH, []),
      safeReadJSON(FEED_POSTS_PATH, []), safeReadJSON(VENUES_PATH, [])
    ]);
    /* `type !== 'price_proposal'` tiene fuori le vecchie righe scritte quando
       una segnalazione di prezzo lasciava anche un messaggio: comparivano fra
       i commenti da approvare come «Prezzo Margherita proposto a…», cioe' la
       stessa cosa gia' in elenco due riquadri piu' sotto. */
    res.json({
      proposals,
      pendingComments: comments.filter(c => !c.approved && c.type !== 'price_proposal'),
      pendingFeedPosts: feedPosts.filter(p => !p.approved),
      venues
    });
  } catch (err) {
    logger.error('Errore dashboard stats', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.post('/api/admin/approve-price', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { pizzeriaId, proposedPrice, author } = req.body;
    const price = Number(proposedPrice);
    if (!pizzeriaId || isNaN(price)) return res.status(400).json({ error: 'Dati non validi' });

    const prices = await safeReadJSON(PRICES_PATH, []);
    const idx = prices.findIndex(p => p.pizzeriaId === pizzeriaId);
    if (idx !== -1) { prices[idx].margheritaPrice = price; prices[idx].lastUpdated = new Date().toISOString(); }
    else prices.push({ id: `pr-new-${pizzeriaId}`, pizzeriaId, margheritaPrice: price, currency: 'EUR', lastUpdated: new Date().toISOString(), source: 'user-proposal' });
    await safeWriteJSON(PRICES_PATH, prices);

    const proposals = await safeReadJSON(PROPOSALS_PATH, []);
    await safeWriteJSON(PROPOSALS_PATH, proposals.filter(p => !(p.pizzeriaId === pizzeriaId && p.author === author)));

    auditLog(req.user.userId, 'approve_price', 'price', { pizzeriaId, price });
    res.json({ success: true, message: 'Prezzo aggiornato' });
  } catch (err) {
    logger.error('Errore approvazione prezzo', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.post('/api/admin/approve-comment/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const comments = await safeReadJSON(COMMENTS_PATH, []);
    const idx = comments.findIndex(c => String(c.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Commento non trovato' });
    comments[idx].approved = true;
    await safeWriteJSON(COMMENTS_PATH, comments);
    auditLog(req.user.userId, 'approve_comment', 'comment', { commentId: req.params.id });
    res.json({ success: true, message: 'Commento approvato' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

/* Il pannello Approvazioni chiamava queste quattro rotte da sempre, e da
   sempre rispondevano 404: il client leggeva `!res.ok` e mostrava «Errore
   rifiuto commento» qualunque cosa si premesse. Approvare un prezzo e
   approvare un commento erano le uniche due azioni della scheda che
   funzionassero davvero. Rifiutare vuol dire togliere dall'elenco: il pezzo
   non e' stato pubblicato, quindi non resta niente da conservare. */

app.delete('/api/admin/reject-comment/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const comments = await safeReadJSON(COMMENTS_PATH, []);
    const rest = comments.filter(c => String(c.id) !== String(req.params.id));
    if (rest.length === comments.length) return res.status(404).json({ error: 'Commento non trovato' });
    await safeWriteJSON(COMMENTS_PATH, rest);
    auditLog(req.user.userId, 'reject_comment', 'comment', { commentId: req.params.id });
    res.json({ success: true, message: 'Commento rifiutato' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.delete('/api/admin/reject-proposal/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const proposals = await safeReadJSON(PROPOSALS_PATH, []);
    const rest = proposals.filter(p => String(p.id) !== String(req.params.id));
    if (rest.length === proposals.length) return res.status(404).json({ error: 'Proposta non trovata' });
    await safeWriteJSON(PROPOSALS_PATH, rest);
    auditLog(req.user.userId, 'reject_proposal', 'proposal', { proposalId: req.params.id });
    res.json({ success: true, message: 'Proposta rifiutata' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.post('/api/admin/approve-feed-post/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const posts = await safeReadJSON(FEED_POSTS_PATH, []);
    const idx = posts.findIndex(p => String(p.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Post non trovato' });
    posts[idx].approved = true;
    await safeWriteJSON(FEED_POSTS_PATH, posts);
    auditLog(req.user.userId, 'approve_feed_post', 'feed_post', { postId: req.params.id });
    res.json({ success: true, message: 'Post approvato' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.delete('/api/admin/reject-feed-post/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const posts = await safeReadJSON(FEED_POSTS_PATH, []);
    const rest = posts.filter(p => String(p.id) !== String(req.params.id));
    if (rest.length === posts.length) return res.status(404).json({ error: 'Post non trovato' });
    await safeWriteJSON(FEED_POSTS_PATH, rest);
    auditLog(req.user.userId, 'reject_feed_post', 'feed_post', { postId: req.params.id });
    res.json({ success: true, message: 'Post rifiutato' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.get('/api/feed/posts', apiRateLimit, async (req, res) => {
  try {
    const posts = await safeReadJSON(FEED_POSTS_PATH, []);
    res.json(posts.filter(p => p.approved).map(p => ({
      id: `#USR-${String(p.id).padStart(3, '0')}`,
      title_it: p.title, title_en: p.title,
      author: p.author.startsWith('@') ? p.author : `@${p.author.replace(/\s+/g, '')}`,
      time: (() => {
        const diff = Date.now() - new Date(p.createdAt).getTime();
        const hrs = Math.floor(diff / 3600000);
        if (hrs < 1) return `${Math.floor(diff / 60000)}m`;
        if (hrs < 24) return `${hrs}H`;
        return `${Math.floor(hrs / 24)}D`;
      })(),
      rating: null, description_it: p.description, description_en: p.description,
      fires: String(p.fires || 0), img: `/images/pizzerias/pizza-${((p.id - 1) % 4) + 1}.png`,
      _isUserPost: true,
    })));
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.post('/api/feed/posts', apiRateLimit, async (req, res) => {
  try {
    const parsed = FeedPostSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Dati non validi' });
    const { author, title, description, honeypot, mathAnswer, captchaToken } = parsed.data;
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

    if (honeypot && honeypot.trim() !== '') return res.status(400).json({ error: 'Richiesta non valida' });
    if (!verifyCaptchaToken(captchaToken, mathAnswer)) return res.status(400).json({ error: 'Verifica captcha fallita' });

    const sanitizedAuthor = sanitize(removeDangerousContent(author)).replace(/&amp;/g, '&');
    const sanitizedTitle = sanitize(removeDangerousContent(title)).replace(/&amp;/g, '&');
    const sanitizedDesc = description ? sanitize(removeDangerousContent(description)).replace(/&amp;/g, '&') : '';

    if (containsBannedWords(sanitizedAuthor) || containsBannedWords(sanitizedTitle)) return res.status(400).json({ error: 'Contenuto non consentito' });

    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) return res.status(429).json({ error: `Troppe richieste. Riprova tra ${rateLimit.waitSeconds} secondi` });

    const existing = await safeReadJSON(FEED_POSTS_PATH, []);
    const newPost = {
      id: (existing.length > 0 ? Math.max(...existing.map(p => p.id)) : 0) + 1,
      author: sanitizedAuthor, title: sanitizedTitle, description: sanitizedDesc,
      createdAt: new Date().toISOString(), approved: false, fires: 0,
    };

    existing.push(newPost);
    await safeWriteJSON(FEED_POSTS_PATH, existing);
    recordComment(clientIp);
    res.status(201).json({ success: true, message: 'In attesa di approvazione.' });
  } catch (err) {
    logger.error('Errore creazione post', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.get('/api/activity', apiRateLimit, async (req, res) => {
  try {
    const auditRaw = getAuditLog(30);
    const venues = await safeReadJSON(VENUES_PATH, []);
    const towns = await safeReadJSON(TOWNS_PATH, []);
    const venueMap = Object.fromEntries(venues.map(v => [v.id, v]));
    const townMap = Object.fromEntries(towns.map(t => [t.id, t]));

    res.json(auditRaw.map(entry => {
      let desc = entry.action;
      const vId = entry.details?.venueId || entry.details?.pizzeriaId;
      if (vId && venueMap[vId]) {
        const v = venueMap[vId];
        const t = townMap[v.cityId];
        desc = `${entry.action} - ${v.name}${t ? ` (${t.name})` : ''}`;
      }
      return { id: entry.id, action: entry.action, description: desc, userId: entry.userId, timestamp: entry.timestamp };
    }));
  } catch (err) {
    logger.error('Errore activity', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.put('/api/pizzerias/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { name, cityId, rating } = req.body;
    if (!name || !cityId) return res.status(400).json({ error: 'Campi mancanti' });

    const sanitized = sanitizeObject(req.body);
    const venues = await safeReadJSON(VENUES_PATH, []);
    const idx = venues.findIndex(v => v.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Pizzeria non trovata' });

    venues[idx] = { ...venues[idx], ...sanitized, rating: Number(rating) || 0 };
    await safeWriteJSON(VENUES_PATH, venues);
    auditLog(req.user.userId, 'update_pizzeria', 'venue', { venueId: req.params.id, name: sanitized.name });
    res.json({ success: true, message: 'Pizzeria aggiornata' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.post('/api/pizzerias/single', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { name, cityId, rating } = req.body;
    if (!name || !cityId) return res.status(400).json({ error: 'Campi mancanti' });

    const sanitized = sanitizeObject(req.body);
    const venues = await safeReadJSON(VENUES_PATH, []);
    const newId = `pz-${String(venues.length + 1).padStart(3, '0')}`;
    const newVenue = { ...sanitized, id: newId, rating: Number(rating) || 0 };

    venues.push(newVenue);
    await safeWriteJSON(VENUES_PATH, venues);
    auditLog(req.user.userId, 'create_pizzeria', 'venue', { venueId: newId, name: sanitized.name });
    res.status(201).json(newVenue);
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.put('/api/prices/:pizzeriaId', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { margheritaPrice, source } = req.body;
    const price = Number(margheritaPrice);
    if (isNaN(price)) return res.status(400).json({ error: 'Prezzo non valido' });

    const prices = await safeReadJSON(PRICES_PATH, []);
    const idx = prices.findIndex(p => p.pizzeriaId === req.params.pizzeriaId);
    if (idx !== -1) {
      prices[idx].margheritaPrice = price;
      if (source) prices[idx].source = source;
      prices[idx].lastUpdated = new Date().toISOString();
    } else {
      prices.push({ id: `pr-new-${req.params.pizzeriaId}`, pizzeriaId: req.params.pizzeriaId, margheritaPrice: price, currency: 'EUR', lastUpdated: new Date().toISOString(), source: source || 'admin-manual' });
    }

    await safeWriteJSON(PRICES_PATH, prices);
    auditLog(req.user.userId, 'update_price_direct', 'price', { pizzeriaId: req.params.pizzeriaId, price });
    res.json({ success: true, message: 'Prezzo salvato' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.get('/api/admin/audit-log', apiRateLimit, requireRole('admin'), (req, res) => {
  try { res.json(getAuditLog(parseInt(req.query.limit) || 100)); }
  catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.get('/api/admin/me', apiRateLimit, async (req, res) => {
  if (!req.user) return res.json({ user: null });
  const admins = await safeReadJSON(ADMINS_PATH, []);
  const admin = admins.find(a => a.id === req.user.userId);
  res.json({ user: { id: req.user.userId, username: admin?.username || req.user.username, role: req.user.role, email: admin?.email || '', displayName: admin?.displayName || admin?.username || req.user.username, mustChangePassword: !!admin?.mustChangePassword } });
});

app.put('/api/admin/profile', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { displayName, email } = req.body;
    if (!displayName) return res.status(400).json({ error: 'Nome richiesto' });
    const sanitized = sanitizeObject({ displayName, email: email || '' });
    const admins = await safeReadJSON(ADMINS_PATH, []);
    const idx = admins.findIndex(a => a.id === req.user.userId);
    if (idx === -1) return res.status(404).json({ error: 'Utente non trovato' });

    admins[idx].displayName = sanitized.displayName;
    admins[idx].email = sanitized.email;
    await safeWriteJSON(ADMINS_PATH, admins);
    auditLog(req.user.userId, 'update_profile', 'admin', sanitized);
    res.json({ success: true, message: 'Profilo aggiornato' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

/* Gli archivi su disco e lo schema che ciascuno deve rispettare. L'ordine e'
   quello con cui compaiono gli errori: prima i dati pubblici, poi quelli
   privati. */
const DATASETS = [
  { name: 'towns.json', path: TOWNS_PATH, schema: TownsSchema },
  { name: 'venues.json', path: VENUES_PATH, schema: VenuesSchema },
  { name: 'prices.json', path: PRICES_PATH, schema: PricesSchema },
  { name: 'events.json', path: EVENTS_PATH, schema: EventsSchema },
  { name: 'comments.json', path: COMMENTS_PATH, schema: CommentsSchema },
  { name: 'price-proposals.json', path: PROPOSALS_PATH, schema: ProposalsSchema },
];

/* Il controllo di validita' degli archivi.
   Legge, non scrive: e' una diagnosi da fare prima di una distribuzione, e una
   diagnosi che corregge da sola non e' piu' una diagnosi. Ogni scostamento
   esce come «file → percorso → cosa non torna», che e' quanto serve per
   andare a mettere le mani nel punto giusto. */
app.post('/api/admin/validate-json', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const errors = [];
    for (const { name, path, schema } of DATASETS) {
      const data = await safeReadJSON(path, null);
      if (data === null) {
        errors.push(`${name}: archivio mancante o illeggibile`);
        continue;
      }
      const parsed = schema.safeParse(data);
      if (parsed.success) continue;
      for (const issue of parsed.error.issues) {
        const where = issue.path.length ? ` → ${issue.path.join('.')}` : '';
        errors.push(`${name}${where}: ${issue.message}`);
      }
    }

    auditLog(req.user.userId, 'validate_json', 'data', { errors: errors.length });
    res.json({ valid: errors.length === 0, errors, checked: DATASETS.length });
  } catch (err) {
    logger.error('Validazione archivi fallita', { err: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

/* L'esportazione: gli stessi archivi in un file solo, da tenere da parte prima
   di una modifica grossa. `attachment` col nome gia' dentro, altrimenti il
   browser lo apre invece di salvarlo e un JSON da centomila righe a schermo
   non serve a nessuno. */
app.get('/api/admin/export-data', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const datasets = {};
    for (const { name, path } of DATASETS) {
      datasets[name.replace(/\.json$/, '')] = await safeReadJSON(path, []);
    }

    const stamp = new Date().toISOString();
    auditLog(req.user.userId, 'export_data', 'data', { datasets: Object.keys(datasets).length });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition',
      `attachment; filename="pizza-data-${stamp.slice(0, 10)}.json"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(JSON.stringify({ exportedAt: stamp, ...datasets }, null, 2));
  } catch (err) {
    logger.error('Esportazione fallita', { err: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

/* Un indirizzo sotto `/api` che non corrisponde a niente.
   Senza questo cade nel 404 predefinito di Express, che risponde in HTML: il
   Pannello ci chiama sopra `res.json()` e l'errore che arriva a chi guarda e'
   «Unexpected token '<'», che della rotta sbagliata non dice niente. Deve
   stare in fondo, dopo tutte le rotte, e prima del gestore d'errore. */
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Rotta non trovata: ${req.method} /api${req.path}` });
});

// Global error handler
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { method: req.method, path: req.path, error: err.message, stack: err.stack });
  if (!res.headersSent) res.status(500).type('text/plain').send('Internal Server Error');
});

let server;
if (NODE_ENV !== 'test') {
  seedAdmin().then(() => {
    const HOST = process.env.HOST || '127.0.0.1';
    server = app.listen(PORT, HOST, () => {
      logger.info(`Server attivo su http://${HOST}:${PORT}`);
    });
  }).catch(err => { console.error('FATAL STARTUP ERROR:', err); process.exit(1); });

  const shutdown = (sig) => {
    logger.info(`${sig} ricevuto, chiusura...`);
    if (server) server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
