import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createLogger, format, transports } from 'winston';
import { randomBytes, createHmac } from 'crypto';
import { hashPassword, verifyPassword } from './utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, ACCESS_EXPIRES_MS, REFRESH_EXPIRES_MS } from './utils/jwt.js';
import { createRefreshToken, validateRefreshToken, revokeRefreshToken } from './utils/refreshTokens.js';
import { createSecret, createKeyUri, createQRCodeDataURI, verifyTOTP } from './utils/totp.js';
import { authMiddleware, requireRole } from './middleware/auth.js';
import { csrfMiddleware, csrfToken } from './middleware/csrf.js';
import { auditLog, getAuditLog } from './utils/auditLog.js';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');
const PRIVATE_DIR = join(__dirname, 'private');

const app = express();
export { app };
app.use(compression());
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-me';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'peninsula-ovserver';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || null;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001')
  .split(',')
  .map(s => s.trim());

const DATA_DIR = join(root, 'public', 'data');
const TOWNS_PATH = join(DATA_DIR, 'towns.json');
const VENUES_PATH = join(DATA_DIR, 'venues.json');
const PRICES_PATH = join(DATA_DIR, 'prices.json');
const COMMENTS_PATH = join(PRIVATE_DIR, 'comments.json');
const PROPOSALS_PATH = join(PRIVATE_DIR, 'price-proposals.json');
const ADMINS_PATH = join(PRIVATE_DIR, 'admins.json');
const FEED_POSTS_PATH = join(PRIVATE_DIR, 'feed-posts.json');

const BANNED_WORDS = [
  'buy now', 'click here', 'cheap meds', 'viagra', 'cialis',
  'casino', 'gambling', 'earn money', 'work from home',
  'http://', 'https://', 'www.', '.com', '.org', '.net',
  'SEO', 'backlink', 'phentermine', 'tramadol', 'mortgage',
  'free gift card', 'amazon gift', 'crypto', 'bitcoin',
];

const MAX_COMMENTS_PER_5MIN = 3;
const MAX_COMMENTS_PER_HOUR = 10;
const MIN_CONTENT_LENGTH = 5;
const MAX_CONTENT_LENGTH = 500;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 30;

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ACCOUNT_LOCKOUT_MS = 15 * 60 * 1000;
const CAPTCHA_TTL_MS = 10 * 60 * 1000;

// --- Zod Schemas ---
const LoginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

const CommentSchema = z.object({
  postId: z.string().min(1).max(50),
  author: z.string().min(MIN_NAME_LENGTH).max(MAX_NAME_LENGTH),
  content: z.string().min(MIN_CONTENT_LENGTH).max(MAX_CONTENT_LENGTH),
  proposedPrice: z.number().positive().max(100).optional(),
  honeypot: z.string().optional(),
  mathAnswer: z.number(),
  captchaToken: z.string().min(1),
});

const FeedPostSchema = z.object({
  author: z.string().min(2).max(30),
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional().default(''),
  honeypot: z.string().optional(),
  mathAnswer: z.number(),
  captchaToken: z.string().min(1),
});

// --- Login Rate Limiting & Account Lockout ---
const loginAttemptMap = new Map();

function checkLoginRateLimit(ip) {
  const now = Date.now();
  if (!loginAttemptMap.has(ip)) loginAttemptMap.set(ip, []);
  const attempts = loginAttemptMap.get(ip).filter(t => t > now - LOGIN_WINDOW_MS);
  loginAttemptMap.set(ip, attempts);
  if (attempts.length >= MAX_LOGIN_ATTEMPTS) {
    const waitSeconds = Math.ceil((attempts[0] + LOGIN_WINDOW_MS - now) / 1000);
    return { allowed: false, waitSeconds };
  }
  return { allowed: true };
}

function recordLoginAttempt(ip) {
  const now = Date.now();
  if (!loginAttemptMap.has(ip)) loginAttemptMap.set(ip, []);
  loginAttemptMap.get(ip).push(now);
}

function clearLoginAttempts(ip) {
  loginAttemptMap.delete(ip);
}

function checkAccountLockout(admin) {
  if (!admin.lockedUntil) return { locked: false };
  if (Date.now() < new Date(admin.lockedUntil).getTime()) {
    const waitSeconds = Math.ceil((new Date(admin.lockedUntil).getTime() - Date.now()) / 1000);
    return { locked: true, waitSeconds };
  }
  return { locked: false };
}

function recordFailedLogin(admin, admins) {
  admin.failedAttempts = (admin.failedAttempts || 0) + 1;
  if (admin.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
    admin.lockedUntil = new Date(Date.now() + ACCOUNT_LOCKOUT_MS).toISOString();
    admin.failedAttempts = 0;
  }
  safeWriteJSON(ADMINS_PATH, admins);
}

function clearFailedLogins(admin, admins) {
  if (admin.failedAttempts || admin.lockedUntil) {
    admin.failedAttempts = 0;
    delete admin.lockedUntil;
    safeWriteJSON(ADMINS_PATH, admins);
  }
}

// --- Server-side Captcha ---
function createCaptchaToken(answer) {
  const expires = Date.now() + CAPTCHA_TTL_MS;
  const payload = `${answer}:${expires}`;
  const sig = createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

function verifyCaptchaToken(token, userAnswer) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split(':');
  if (parts.length !== 3) return false;
  const [answer, expires, sig] = parts;
  const expectedSig = createHmac('sha256', JWT_SECRET).update(`${answer}:${expires}`).digest('hex');
  if (sig !== expectedSig) return false;
  if (Date.now() > parseInt(expires)) return false;
  return parseInt(answer) === userAnswer;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of loginAttemptMap.entries()) {
    const cleaned = attempts.filter(t => t > now - LOGIN_WINDOW_MS);
    if (cleaned.length === 0) loginAttemptMap.delete(ip);
    else loginAttemptMap.set(ip, cleaned);
  }
}, 5 * 60 * 1000);

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: NODE_ENV === 'production'
        ? format.combine(format.timestamp(), format.json())
        : format.combine(format.colorize(), format.simple()),
    }),
  ],
});

const fileLocks = new Map();

function withFileLock(filePath, fn) {
  if (!fileLocks.has(filePath)) fileLocks.set(filePath, Promise.resolve());
  const lock = fileLocks.get(filePath).then(fn, fn);
  fileLocks.set(filePath, lock);
  return lock;
}

const rateLimitMap = new Map();

function sanitize(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

function removeDangerousContent(str) {
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
  });
}


function containsBannedWords(str) {
  const lower = str.toLowerCase();
  return BANNED_WORDS.some(word => lower.includes(word));
}

function isDuplicateComment(comments, author, content) {
  const lowerContent = content.toLowerCase().trim();
  return comments.some(c =>
    c.author.toLowerCase() === author.toLowerCase() &&
    c.content.toLowerCase().trim() === lowerContent
  );
}

function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
  const timestamps = rateLimitMap.get(ip);
  const fiveMinAgo = now - 5 * 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;
  const recent5min = timestamps.filter(t => t > fiveMinAgo);
  const recent1hr = timestamps.filter(t => t > oneHourAgo);
  rateLimitMap.set(ip, recent1hr);
  if (recent5min.length >= MAX_COMMENTS_PER_5MIN) {
    return { allowed: false, reason: 'rate_5min', waitSeconds: Math.ceil((timestamps[0] + 5 * 60 * 1000 - now) / 1000) };
  }
  if (recent1hr.length >= MAX_COMMENTS_PER_HOUR) {
    return { allowed: false, reason: 'rate_1hr', waitSeconds: Math.ceil((timestamps[0] + 60 * 60 * 1000 - now) / 1000) };
  }
  return { allowed: true };
}

function recordComment(ip) {
  const now = Date.now();
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
  rateLimitMap.get(ip).push(now);
}

setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const cleaned = timestamps.filter(t => t > oneHourAgo);
    if (cleaned.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, cleaned);
  }
}, 10 * 60 * 1000);

function readJSON(filePath, fallback = []) {
  try {
    if (!existsSync(filePath)) return fallback;
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function atomicWriteJSON(filePath, data) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp.${Date.now()}.${process.pid}`;
  writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  renameSync(tmpPath, filePath);
}

function safeWriteJSON(filePath, data) {
  return withFileLock(filePath, () => {
    atomicWriteJSON(filePath, data);
  });
}

function safeReadJSON(filePath, fallback = []) {
  return withFileLock(filePath, () => readJSON(filePath, fallback));
}

async function stitchData(includeUnapproved = false) {
  const towns = await safeReadJSON(TOWNS_PATH, []);
  const venues = await safeReadJSON(VENUES_PATH, []);
  const prices = await safeReadJSON(PRICES_PATH, []);
  const proposals = await safeReadJSON(PROPOSALS_PATH, []);

  return venues
    .filter(v => {
      if (v.status === 'closed') return false;
      if (!includeUnapproved && v.status === 'pending') return false;
      return true;
    })
    .map(v => {
      const priceEntry = prices.find(p => p.pizzeriaId === v.id);
      const pendingProposal = proposals.find(p => p.pizzeriaId === v.id && !p.reviewed);
      const townEntry = towns.find(t => t.id === v.cityId);
      return {
        ...v,
        margheritaPrice: priceEntry ? priceEntry.margheritaPrice : 0,
        lastUpdated: priceEntry ? priceEntry.lastUpdated : null,
        priceSource: priceEntry ? priceEntry.source : null,
        pendingProposal: pendingProposal ? {
          proposedPrice: pendingProposal.proposedPrice,
          author: pendingProposal.author,
          createdAt: pendingProposal.createdAt,
        } : null,
        cityName: townEntry ? townEntry.name : 'Unknown',
        cityRegion: townEntry ? townEntry.region : '',
      };
    });
}

function sanitizeObject(obj) {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') sanitized[key] = sanitize(removeDangerousContent(value));
    else sanitized[key] = value;
  }
  return sanitized;
}

function prodError(msg) {
  return NODE_ENV === 'production' ? 'Errore interno del server' : msg;
}

const apiRateLimitMap = new Map();

function apiRateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  if (!apiRateLimitMap.has(ip)) apiRateLimitMap.set(ip, []);
  const timestamps = apiRateLimitMap.get(ip).filter(t => t > now - 60 * 1000);
  if (timestamps.length >= 100) {
    logger.warn('Rate limit exceeded', { ip });
    return res.status(429).json({ error: 'Troppe richieste. Riprova tra un minuto.' });
  }
  timestamps.push(now);
  apiRateLimitMap.set(ip, timestamps);
  next();
}

setInterval(() => {
  const now = Date.now();
  const oneMinAgo = now - 60 * 1000;
  for (const [ip, timestamps] of apiRateLimitMap.entries()) {
    const cleaned = timestamps.filter(t => t > oneMinAgo);
    if (cleaned.length === 0) apiRateLimitMap.delete(ip);
    else apiRateLimitMap.set(ip, cleaned);
  }
}, 5 * 60 * 1000);

const pending2FALogins = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [token, data] of pending2FALogins.entries()) {
    if (now - data.createdAt > 5 * 60 * 1000) pending2FALogins.delete(token);
  }
}, 60 * 1000);

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
    const defaultPassword = process.env.ADMIN_PASSWORD || 'PizzaAdmin2024!';
    const hash = await hashPassword(defaultPassword);
    admins.push({
      id: 1,
      username: ADMIN_USERNAME,
      passwordHash: hash,
      role: 'admin',
      displayName: ADMIN_USERNAME,
      email: '',
      createdAt: new Date().toISOString(),
    });
    changed = true;
    logger.info('Admin di default creato');
  }

  if (ADMIN_PASSWORD_HASH) {
    const idx = admins.findIndex(a => a.username === ADMIN_USERNAME);
    if (idx !== -1) {
      admins[idx].passwordHash = ADMIN_PASSWORD_HASH;
      changed = true;
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
      scriptSrc: ["'self'"],
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

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400,
}));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  next();
});

// Serve static files EARLY, before auth/csrf middleware
if (NODE_ENV === 'production') {
  const distDir = join(root, 'dist');
  const distIndex = join(distDir, 'index.html');
  
  // Startup Diagnostics
  if (existsSync(distDir)) {
    try {
      const files = readdirSync(distDir);
      logger.info('Production: dist/ directory found', { files });
      if (existsSync(join(distDir, 'assets'))) {
        const assets = readdirSync(join(distDir, 'assets')).slice(0, 5);
        logger.info('Production: dist/assets/ sample', { assets });
      }
    } catch (err) {
      logger.error('Production: Error reading dist/ directory', { error: err.message });
    }
  } else {
    logger.warn('Production: dist/ directory NOT found at ' + distDir);
  }

  app.use(express.static(distDir, {
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));
}

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser(JWT_SECRET));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/csrf-token', csrfToken);

// SPA Fallback - Keep it AFTER static files but BEFORE auth/csrf for non-API routes
if (NODE_ENV === 'production') {
  const distIndex = join(root, 'dist', 'index.html');
  app.get(/^(?!\/api).*$/, (req, res, next) => {
    // DO NOT serve index.html for missing assets or files with extensions
    if (req.path.includes('.') || req.path.startsWith('/assets/')) {
      return next();
    }

    if (existsSync(distIndex)) {
      res.sendFile(distIndex, (err) => {
        if (err) {
          logger.error('SPA fallback failed', { path: distIndex, error: err.message });
          if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
          }
        }
      });
    } else {
      next();
    }
  });
}

app.use(authMiddleware);
app.use(csrfMiddleware);

app.get('/api/auth/2fa/status', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const admins = await safeReadJSON(ADMINS_PATH, []);
    const admin = admins.find(a => a.id === req.user.userId);
    if (!admin) return res.status(404).json({ error: 'Utente non trovato' });

    res.json({
      enabled: !!admin.twoFASecret,
      username: admin.username,
    });
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

    if (admin.twoFASecret) {
      return res.status(400).json({ error: '2FA già attiva' });
    }

    const secret = createSecret();
    const keyUri = createKeyUri(secret, admin.username);
    const qrCode = await createQRCodeDataURI(keyUri);

    admin.twoFATempSecret = secret;
    await safeWriteJSON(ADMINS_PATH, admins);

    res.json({
      secret,
      keyUri,
      qrCode,
    });
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

    const valid = verifyTOTP(code, secret);
    if (!valid) {
      return res.status(401).json({ error: 'Codice non valido' });
    }

    admin.twoFASecret = secret;
    delete admin.twoFATempSecret;
    await safeWriteJSON(ADMINS_PATH, admins);

    auditLog(admin.id, '2fa_enabled', 'auth', { ip: req.ip });
    logger.info('2FA attivata', { userId: admin.id, username: admin.username });

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

    if (!admin.twoFASecret) {
      return res.status(400).json({ error: '2FA non attiva' });
    }

    const validPassword = await verifyPassword(password, admin.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Password non valida' });
    }

    delete admin.twoFASecret;
    delete admin.twoFATempSecret;
    await safeWriteJSON(ADMINS_PATH, admins);

    auditLog(admin.id, '2fa_disabled', 'auth', { ip: req.ip });
    logger.info('2FA disattivata', { userId: admin.id, username: admin.username });

    res.json({ success: true, message: '2FA disattivata' });
  } catch (err) {
    logger.error('Errore disattivazione 2FA', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.get('/api/data/stitched', apiRateLimit, async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const stitched = await stitchData(isAdmin);
    res.json(stitched);
  } catch (err) {
    logger.error('Errore stitching', { error: err.message });
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

app.post('/api/prices', (_req, res) => {
  res.status(403).json({ error: 'Scrittura diretta non consentita. Usa le proposte.' });
});

app.get('/api/comments', apiRateLimit, async (req, res) => {
  try {
    const comments = await safeReadJSON(COMMENTS_PATH, []);
    const isAdmin = req.user?.role === 'admin';
    const { postId, type } = req.query;
    let filtered = comments;
    if (postId) filtered = filtered.filter(c => c.postId === postId);
    if (type) {
      filtered = filtered.filter(c => c.type === type);
    } else {
      filtered = filtered.filter(c =>
        c.type !== 'price_proposal' &&
        !c.content?.startsWith('Prezzo Margherita proposto a')
      );
    }
    if (!isAdmin) filtered = filtered.filter(c => c.approved);
    res.json(filtered);
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.post('/api/comments', apiRateLimit, async (req, res) => {
  try {
    const parsed = CommentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Campi mancanti o non validi' });
    const { postId, author, content, proposedPrice, honeypot, mathAnswer, captchaToken } = parsed.data;
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

    if (honeypot && honeypot.trim() !== '') return res.status(400).json({ error: 'Richiesta non valida' });
    if (!verifyCaptchaToken(captchaToken, mathAnswer)) return res.status(400).json({ error: 'Verifica captcha fallita' });

    const sanitizedAuthor = sanitize(removeDangerousContent(author)).replace(/&amp;/g, '&');
    const sanitizedContent = sanitize(removeDangerousContent(content)).replace(/&amp;/g, '&');

    if (sanitizedAuthor.length < MIN_NAME_LENGTH || sanitizedAuthor.length > MAX_NAME_LENGTH) {
      return res.status(400).json({ error: 'Nome deve essere tra 2 e 30 caratteri' });
    }
    if (!/^[a-zA-Z0-9àèéìòùÀÈÉÌÒÙ\s'-]+$/.test(sanitizedAuthor)) {
      return res.status(400).json({ error: 'Nome contiene caratteri non validi' });
    }
    if (sanitizedContent.length < MIN_CONTENT_LENGTH || sanitizedContent.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ error: `Testo deve essere tra ${MIN_CONTENT_LENGTH} e ${MAX_CONTENT_LENGTH} caratteri` });
    }
    if (containsBannedWords(sanitizedAuthor) || containsBannedWords(sanitizedContent)) {
      return res.status(400).json({ error: 'Contenuto non consentito' });
    }

    const existingComments = await safeReadJSON(COMMENTS_PATH, []);
    if (isDuplicateComment(existingComments, sanitizedAuthor, sanitizedContent)) {
      return res.status(400).json({ error: 'Commento duplicato' });
    }

    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      const waitMsg = rateLimit.reason === 'rate_5min'
        ? `Troppo veloce. Riprova tra ${rateLimit.waitSeconds} secondi`
        : `Limite orario raggiunto. Riprova tra ${rateLimit.waitSeconds} secondi`;
      return res.status(429).json({ error: waitMsg, retryAfter: rateLimit.waitSeconds });
    }

    const newComment = {
      id: existingComments.length > 0 ? Math.max(...existingComments.map(c => c.id)) + 1 : 1,
      postId,
      author: sanitizedAuthor,
      content: sanitizedContent,
      createdAt: new Date().toISOString(),
      approved: false,
      type: (typeof proposedPrice === 'number' && proposedPrice > 0 && proposedPrice <= 100) ? 'price_proposal' : 'review',
    };

    existingComments.push(newComment);
    await safeWriteJSON(COMMENTS_PATH, existingComments);
    recordComment(clientIp);

    if (typeof proposedPrice === 'number' && proposedPrice > 0 && proposedPrice <= 100) {
      const proposals = await safeReadJSON(PROPOSALS_PATH, []);
      const priceEntry = (await safeReadJSON(PRICES_PATH, [])).find(p => p.pizzeriaId === postId);
      const currentPrice = priceEntry ? priceEntry.margheritaPrice : null;

      proposals.push({
        id: proposals.length > 0 ? Math.max(...proposals.map(p => p.id)) + 1 : 1,
        postId,
        pizzeriaId: postId,
        author: sanitizedAuthor,
        proposedPrice,
        currentPrice,
        createdAt: new Date().toISOString(),
        reviewed: false,
      });
      await safeWriteJSON(PROPOSALS_PATH, proposals);
    }

    logger.info('Commento creato', { postId, author: sanitizedAuthor, ip: clientIp });
    res.status(201).json(newComment);
  } catch (err) {
    logger.error('Errore creazione commento', { error: err.message });
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
  // Answer is signed server-side — never exposed to the client
  const captchaToken = createCaptchaToken(answer);
  res.json({ question, captchaToken });
});

app.get('/api/admin/proposals', apiRateLimit, requireRole('admin'), async (_req, res) => {
  try {
    const proposals = await safeReadJSON(PROPOSALS_PATH, []);
    const comments = await safeReadJSON(COMMENTS_PATH, []);
    const pendingComments = comments.filter(c => !c.approved);
    res.json({ proposals, pendingComments });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.post('/api/admin/approve-price', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { pizzeriaId, proposedPrice, author } = req.body;
    if (!pizzeriaId || proposedPrice == null) return res.status(400).json({ error: 'Dati mancanti' });

    const price = Number(proposedPrice);
    if (isNaN(price) || price < 0 || price > 100) return res.status(400).json({ error: 'Prezzo non valido' });

    const prices = await safeReadJSON(PRICES_PATH, []);
    const idx = prices.findIndex(p => p.pizzeriaId === pizzeriaId);
    if (idx !== -1) {
      prices[idx].margheritaPrice = price;
      prices[idx].lastUpdated = new Date().toISOString();
    } else {
      prices.push({
        id: `pr-new-${pizzeriaId}`,
        pizzeriaId,
        margheritaPrice: price,
        currency: 'EUR',
        lastUpdated: new Date().toISOString(),
        source: 'user-proposal',
      });
    }
    await safeWriteJSON(PRICES_PATH, prices);

    const proposals = await safeReadJSON(PROPOSALS_PATH, []);
    const filtered = proposals.filter(p => !(p.pizzeriaId === pizzeriaId && p.author === author));
    await safeWriteJSON(PROPOSALS_PATH, filtered);

    auditLog(req.user.userId, 'approve_price', 'price', { pizzeriaId, price, ip: req.ip });
    logger.info('Prezzo approvato', { userId: req.user.userId, pizzeriaId, price });

    res.json({ success: true, message: 'Prezzo aggiornato' });
  } catch (err) {
    logger.error('Errore approvazione prezzo', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.post('/api/admin/approve-comment/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await safeReadJSON(COMMENTS_PATH, []);
    const idx = comments.findIndex(c => String(c.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Commento non trovato' });

    comments[idx].approved = true;
    await safeWriteJSON(COMMENTS_PATH, comments);

    auditLog(req.user.userId, 'approve_comment', 'comment', { commentId: id, ip: req.ip });
    res.json({ success: true, message: 'Commento approvato' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.delete('/api/admin/reject-proposal/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const proposals = await safeReadJSON(PROPOSALS_PATH, []);
    const filtered = proposals.filter(p => String(p.id) !== String(id));
    await safeWriteJSON(PROPOSALS_PATH, filtered);

    auditLog(req.user.userId, 'reject_proposal', 'proposal', { proposalId: id, ip: req.ip });
    res.json({ success: true, message: 'Proposta rifiutata' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.delete('/api/admin/reject-comment/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await safeReadJSON(COMMENTS_PATH, []);
    const filtered = comments.filter(c => String(c.id) !== String(id));
    await safeWriteJSON(COMMENTS_PATH, filtered);

    auditLog(req.user.userId, 'reject_comment', 'comment', { commentId: id, ip: req.ip });
    res.json({ success: true, message: 'Commento rifiutato' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.get('/api/feed', apiRateLimit, async (req, res) => {
  try {
    const comments = (await safeReadJSON(COMMENTS_PATH, [])).filter(c => c.approved);
    const proposals = await safeReadJSON(PROPOSALS_PATH, []);
    const prices = await safeReadJSON(PRICES_PATH, []);
    const venues = await safeReadJSON(VENUES_PATH, []);
    const auditRaw = getAuditLog(200);
    const towns = await safeReadJSON(TOWNS_PATH, []);

    const venueMap = {};
    venues.forEach(v => { venueMap[v.id] = v; });
    const townMap = {};
    towns.forEach(t => { townMap[t.id] = t; });

    const feedItems = [];

    comments.forEach(c => {
      const venue = venueMap[c.postId] || venueMap[c.pizzeriaId];
      const town = venue ? townMap[venue.cityId] : null;
      feedItems.push({
        id: `cmt-${c.id}`,
        type: 'review',
        author: c.author,
        rating: c.rating || null,
        text: c.content,
        proposedPrice: c.proposedPrice || null,
        pizzeriaName: venue?.name || '—',
        city: town?.name || '—',
        time: c.createdAt || c.timestamp || new Date().toISOString(),
      });
    });

    proposals.forEach(p => {
      const venue = venueMap[p.pizzeriaId];
      const town = venue ? townMap[venue.cityId] : null;
      feedItems.push({
        id: `prop-${p.id}`,
        type: 'proposal',
        author: p.author,
        text: `Proposta prezzo: €${p.proposedPrice} per ${venue?.name || p.pizzeriaId}`,
        proposedPrice: p.proposedPrice,
        pizzeriaName: venue?.name || '—',
        city: town?.name || '—',
        time: p.timestamp || new Date().toISOString(),
      });
    });

    auditRaw.forEach(entry => {
        if (['approve_price', 'approve_comment', 'approve_feed_post', 'edit_feed_post', 'login', '2fa_enabled', 'update_pizzeria', 'create_pizzeria'].includes(entry.action)) {
        feedItems.push({
          id: `audit-${entry.id}`,
          type: 'activity',
          action: entry.action,
          userId: entry.userId,
          details: entry.details,
          time: entry.timestamp,
        });
      }
    });

    feedItems.sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json(feedItems.slice(0, 50));
  } catch (err) {
    logger.error('Errore feed', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.get('/api/feed/export', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const comments = (await safeReadJSON(COMMENTS_PATH, [])).filter(c => c.approved && c.type === 'review');
    const venues = await safeReadJSON(VENUES_PATH, []);
    const towns = await safeReadJSON(TOWNS_PATH, []);
    const venueMap = {};
    venues.forEach(v => { venueMap[v.id] = v; });
    const townMap = {};
    towns.forEach(t => { townMap[t.id] = t; });

    const mapped = comments.map((c, idx) => {
      const venue = venueMap[c.postId] || {};
      const imgNum = (idx % 4) + 1;
      return {
        id: `#${String(idx + 1).padStart(3, '0')}`,
        title_it: venue.name || c.postId,
        title_en: venue.name || c.postId,
        author: c.author,
        time: (() => {
          const diff = Date.now() - new Date(c.createdAt || Date.now()).getTime();
          const hrs = Math.floor(diff / 3600000);
          if (hrs < 24) return `${hrs}H`;
          return `${Math.floor(hrs / 24)}D`;
        })(),
        rating: c.rating ? `${c.rating}/10` : '—',
        description_it: c.content || '',
        description_en: c.content || '',
        fires: '0',
        img: `/images/pizzerias/pizza-${imgNum}.jpg`,
      };
    });

    const sorted = mapped.sort((a, b) => {
      const ra = parseFloat(a.rating) || 0;
      const rb = parseFloat(b.rating) || 0;
      return rb - ra;
    });

    const PUBLIC_DIR = join(__dirname, '..', 'public');
    const FEED_PATH = join(PUBLIC_DIR, 'feed-data.json');
    writeFileSync(FEED_PATH, JSON.stringify(sorted, null, 2), 'utf-8');

    res.json({ success: true, count: sorted.length, path: '/feed-data.json' });
  } catch (err) {
    logger.error('Errore export feed', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.get('/api/feed/posts', apiRateLimit, async (req, res) => {
  try {
    const posts = await safeReadJSON(FEED_POSTS_PATH, []);
    const approved = posts.filter(p => p.approved);
    const formatted = approved.map(p => ({
      id: `#USR-${String(p.id).padStart(3, '0')}`,
      title_it: p.title,
      title_en: p.title,
      author: p.author.startsWith('@') ? p.author : `@${p.author.replace(/\s+/g, '')}`,
      time: (() => {
        const diff = Date.now() - new Date(p.createdAt).getTime();
        const hrs = Math.floor(diff / 3600000);
        if (hrs < 1) return `${Math.floor(diff / 60000)}m`;
        if (hrs < 24) return `${hrs}H`;
        return `${Math.floor(hrs / 24)}D`;
      })(),
      rating: null,
      description_it: p.description,
      description_en: p.description,
      fires: String(p.fires || 0),
      img: `/images/pizzerias/pizza-${((p.id - 1) % 4) + 1}.png`,
      _isUserPost: true,
    }));
    res.json(formatted);
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.post('/api/feed/posts', apiRateLimit, async (req, res) => {
  try {
    const parsed = FeedPostSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Campi mancanti o non validi' });
    const { author, title, description, honeypot, mathAnswer, captchaToken } = parsed.data;
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

    if (honeypot && honeypot.trim() !== '') return res.status(400).json({ error: 'Richiesta non valida' });
    if (!verifyCaptchaToken(captchaToken, mathAnswer)) return res.status(400).json({ error: 'Verifica captcha fallita' });

    const sanitizedAuthor = sanitize(removeDangerousContent(author)).replace(/&amp;/g, '&');
    const sanitizedTitle = sanitize(removeDangerousContent(title)).replace(/&amp;/g, '&');
    const sanitizedDescription = description
      ? sanitize(removeDangerousContent(description)).replace(/&amp;/g, '&')
      : '';

    if (sanitizedAuthor.length < 2 || sanitizedAuthor.length > 30) {
      return res.status(400).json({ error: 'Nome deve essere tra 2 e 30 caratteri' });
    }
    if (!/^[a-zA-Z0-9àèéìòùÀÈÉÌÒÙ\s'-]+$/.test(sanitizedAuthor)) {
      return res.status(400).json({ error: 'Nome contiene caratteri non validi' });
    }
    if (sanitizedTitle.length < 3 || sanitizedTitle.length > 100) {
      return res.status(400).json({ error: 'Titolo deve essere tra 3 e 100 caratteri' });
    }
    if (sanitizedDescription.length > 500) {
      return res.status(400).json({ error: 'Descrizione troppo lunga (max 500 caratteri)' });
    }
    if (containsBannedWords(sanitizedAuthor) || containsBannedWords(sanitizedTitle) || containsBannedWords(sanitizedDescription)) {
      return res.status(400).json({ error: 'Contenuto non consentito' });
    }

    const existingPosts = await safeReadJSON(FEED_POSTS_PATH, []);
    if (existingPosts.some(p =>
      p.author.toLowerCase() === sanitizedAuthor.toLowerCase() &&
      p.title.toLowerCase() === sanitizedTitle.toLowerCase()
    )) {
      return res.status(400).json({ error: 'Post duplicato' });
    }

    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      const waitMsg = rateLimit.reason === 'rate_5min'
        ? `Troppo veloce. Riprova tra ${rateLimit.waitSeconds} secondi`
        : `Limite orario raggiunto. Riprova tra ${rateLimit.waitSeconds} secondi`;
      return res.status(429).json({ error: waitMsg, retryAfter: rateLimit.waitSeconds });
    }

    const newPost = {
      id: existingPosts.length > 0 ? Math.max(...existingPosts.map(p => p.id)) + 1 : 1,
      author: sanitizedAuthor,
      title: sanitizedTitle,
      description: sanitizedDescription,
      createdAt: new Date().toISOString(),
      approved: false,
      fires: 0,
    };

    existingPosts.push(newPost);
    await safeWriteJSON(FEED_POSTS_PATH, existingPosts);
    recordComment(clientIp);

    logger.info('Feed post creato', { postId: newPost.id, author: sanitizedAuthor, ip: clientIp });
    res.status(201).json({ success: true, message: 'Scoperta condivisa! In attesa di approvazione.' });
  } catch (err) {
    logger.error('Errore creazione feed post', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.get('/api/admin/feed-posts', apiRateLimit, requireRole('admin'), async (_req, res) => {
  try {
    res.json(await safeReadJSON(FEED_POSTS_PATH, []));
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.post('/api/admin/approve-feed-post/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const posts = await safeReadJSON(FEED_POSTS_PATH, []);
    const idx = posts.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Post non trovato' });

    posts[idx].approved = true;
    await safeWriteJSON(FEED_POSTS_PATH, posts);

    auditLog(req.user.userId, 'approve_feed_post', 'feed', { postId: id, ip: req.ip });
    res.json({ success: true, message: 'Post approvato' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.put('/api/admin/feed-posts/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Titolo obbligatorio' });

    const posts = await safeReadJSON(FEED_POSTS_PATH, []);
    const idx = posts.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Post non trovato' });

    posts[idx].title = sanitize(removeDangerousContent(title));
    posts[idx].description = description ? sanitize(removeDangerousContent(description)) : '';
    await safeWriteJSON(FEED_POSTS_PATH, posts);

    auditLog(req.user.userId, 'edit_feed_post', 'feed', { postId: id, ip: req.ip });
    res.json({ success: true, message: 'Post aggiornato' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.delete('/api/admin/reject-feed-post/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const posts = await safeReadJSON(FEED_POSTS_PATH, []);
    const filtered = posts.filter(p => String(p.id) !== String(id));
    await safeWriteJSON(FEED_POSTS_PATH, filtered);

    auditLog(req.user.userId, 'reject_feed_post', 'feed', { postId: id, ip: req.ip });
    res.json({ success: true, message: 'Post rifiutato' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.get('/api/activity', apiRateLimit, async (req, res) => {
  try {
    const auditRaw = getAuditLog(30);
    const venues = await safeReadJSON(VENUES_PATH, []);
    const towns = await safeReadJSON(TOWNS_PATH, []);
    const venueMap = {};
    venues.forEach(v => { venueMap[v.id] = v; });
    const townMap = {};
    towns.forEach(t => { townMap[t.id] = t; });

    const activities = auditRaw.map(entry => {
      let description = entry.action;
      const vId = entry.details?.venueId || entry.details?.pizzeriaId;
      if (vId && venueMap[vId]) {
        const v = venueMap[vId];
        const t = townMap[v.cityId];
        description = `${entry.action} - ${v.name}${t ? ` (${t.name})` : ''}`;
      }
      return {
        id: entry.id,
        action: entry.action,
        description,
        userId: entry.userId,
        timestamp: entry.timestamp,
      };
    });
    res.json(activities);
  } catch (err) {
    logger.error('Errore activity', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.put('/api/pizzerias/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cityId, address, phone, category, rating, description, descriptionIt, status, frazione, imageUrl, tripadvisor, maps_url } = req.body;
    if (!name || !cityId) return res.status(400).json({ error: 'Campi mancanti' });

    const sanitized = sanitizeObject({
      name, cityId, address: address || '', phone: phone || '',
      category: category || 'traditional', description: description || '',
      descriptionIt: descriptionIt || '', status: status || 'open',
      frazione: frazione || null, imageUrl: imageUrl || null,
      tripadvisor: tripadvisor || null, maps_url: maps_url || null,
    });
    const venues = await safeReadJSON(VENUES_PATH, []);
    const idx = venues.findIndex(v => v.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Pizzeria non trovata' });

    venues[idx] = {
      ...venues[idx],
      name: sanitized.name,
      address: sanitized.address,
      cityId: sanitized.cityId,
      phone: sanitized.phone,
      category: sanitized.category,
      rating: Number(rating) || 0,
      description: sanitized.description,
      descriptionIt: sanitized.descriptionIt,
      status: sanitized.status,
      frazione: sanitized.frazione,
      imageUrl: sanitized.imageUrl,
      tripadvisor: sanitized.tripadvisor,
      maps_url: sanitized.maps_url,
    };

    await safeWriteJSON(VENUES_PATH, venues);

    auditLog(req.user.userId, 'update_pizzeria', 'venue', { venueId: id, name: sanitized.name, ip: req.ip });
    res.json({ success: true, message: 'Pizzeria aggiornata' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.post('/api/pizzerias/single', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { name, cityId, address, phone, category, rating, description, descriptionIt, status, frazione, imageUrl, tripadvisor, maps_url } = req.body;
    if (!name || !cityId) return res.status(400).json({ error: 'Campi mancanti' });

    const sanitized = sanitizeObject({
      name, cityId, address: address || '', phone: phone || '',
      category: category || 'traditional', description: description || '',
      descriptionIt: descriptionIt || '', status: status || 'open',
      frazione: frazione || null, imageUrl: imageUrl || null,
      tripadvisor: tripadvisor || null, maps_url: maps_url || null,
    });
    const venues = await safeReadJSON(VENUES_PATH, []);
    const newId = `pz-${String(venues.length + 1).padStart(3, '0')}`;

    const newVenue = {
      id: newId, name: sanitized.name, address: sanitized.address,
      cityId: sanitized.cityId, phone: sanitized.phone, category: sanitized.category,
      rating: Number(rating) || 0, description: sanitized.description,
      descriptionIt: sanitized.descriptionIt, status: sanitized.status,
      frazione: sanitized.frazione, imageUrl: sanitized.imageUrl,
      tripadvisor: sanitized.tripadvisor, maps_url: sanitized.maps_url,
    };

    venues.push(newVenue);
    await safeWriteJSON(VENUES_PATH, venues);

    auditLog(req.user.userId, 'create_pizzeria', 'venue', { venueId: newId, name: sanitized.name, ip: req.ip });
    res.status(201).json(newVenue);
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.put('/api/prices/:pizzeriaId', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { pizzeriaId } = req.params;
    const { margheritaPrice, source } = req.body;
    if (margheritaPrice == null) return res.status(400).json({ error: 'Prezzo mancante' });

    const price = Number(margheritaPrice);
    if (isNaN(price) || price < 0 || price > 100) return res.status(400).json({ error: 'Prezzo non valido' });

    const prices = await safeReadJSON(PRICES_PATH, []);
    const idx = prices.findIndex(p => p.pizzeriaId === pizzeriaId);
    
    if (idx !== -1) {
      prices[idx].margheritaPrice = price;
      if (source) prices[idx].source = source;
      prices[idx].lastUpdated = new Date().toISOString();
    } else {
      prices.push({
        id: `pr-new-${pizzeriaId}`,
        pizzeriaId,
        margheritaPrice: price,
        currency: 'EUR',
        lastUpdated: new Date().toISOString(),
        source: source || 'admin-manual',
      });
    }

    await safeWriteJSON(PRICES_PATH, prices);
    auditLog(req.user.userId, 'update_price_direct', 'price', { pizzeriaId, price, ip: req.ip });
    res.json({ success: true, message: 'Prezzo salvato' });
  } catch (err) {
    logger.error('Errore salvataggio prezzo', { error: err.message });
    res.status(500).json({ error: prodError('Errore interno del server') });
  }
});

app.delete('/api/prices/:pizzeriaId', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { pizzeriaId } = req.params;
    const prices = await safeReadJSON(PRICES_PATH, []);
    const filtered = prices.filter(p => p.pizzeriaId !== pizzeriaId);
    await safeWriteJSON(PRICES_PATH, filtered);

    auditLog(req.user.userId, 'delete_price_direct', 'price', { pizzeriaId, ip: req.ip });
    res.json({ success: true, message: 'Prezzo eliminato' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.delete('/api/pizzerias/:id', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const venues = await safeReadJSON(VENUES_PATH, []);
    const filtered = venues.filter(v => v.id !== id);
    await safeWriteJSON(VENUES_PATH, filtered);

    const prices = await safeReadJSON(PRICES_PATH, []);
    const filteredPrices = prices.filter(p => p.pizzeriaId !== id);
    await safeWriteJSON(PRICES_PATH, filteredPrices);

    auditLog(req.user.userId, 'delete_pizzeria', 'venue', { venueId: id, ip: req.ip });
    res.json({ success: true, message: 'Pizzeria eliminata' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.get('/api/admin/audit-log', apiRateLimit, requireRole('admin'), (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    res.json(getAuditLog(limit));
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.get('/api/admin/me', apiRateLimit, async (req, res) => {
  if (!req.user) return res.json({ user: null });
  const admins = await safeReadJSON(ADMINS_PATH, []);
  const admin = admins.find(a => a.id === req.user.userId);
  res.json({ user: { id: req.user.userId, username: admin?.username || req.user.username, role: req.user.role, email: admin?.email || '', displayName: admin?.displayName || admin?.username || req.user.username } });
});

app.put('/api/admin/profile', apiRateLimit, requireRole('admin'), async (req, res) => {
  try {
    const { displayName, email } = req.body;
    if (!displayName) return res.status(400).json({ error: 'Nome visualizzato obbligatorio' });
    const sanitized = sanitizeObject({ displayName: displayName, email: email || '' });
    const admins = await safeReadJSON(ADMINS_PATH, []);
    const idx = admins.findIndex(a => a.id === req.user.userId);
    if (idx === -1) return res.status(404).json({ error: 'Utente non trovato' });

    admins[idx].displayName = sanitized.displayName;
    admins[idx].email = sanitized.email;
    await safeWriteJSON(ADMINS_PATH, admins);

    auditLog(req.user.userId, 'update_profile', 'admin', { displayName: sanitized.displayName, email: sanitized.email, ip: req.ip });
    res.json({ success: true, message: 'Profilo aggiornato' });
  } catch { res.status(500).json({ error: prodError('Errore interno del server') }); }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});


let server;

if (process.env.NODE_ENV !== 'test') {
  seedAdmin()
    .then(() => {
      server = app.listen(PORT, '0.0.0.0', () => {
        logger.info(`Server attivo su http://0.0.0.0:${PORT}`);
        logger.info(`API: http://0.0.0.0:${PORT}/api/data/stitched`);
      });
    })
    .catch(err => {
      console.error('ERRORE FATALE ALL\'AVVIO:', err);
      process.exit(1);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

function gracefulShutdown(signal) {
  logger.info(`${signal} ricevuto, shutdown in corso...`);
  if (server) {
    server.close(() => {
      logger.info('Server chiuso');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown');
      process.exit(1);
    }, 10000);
  }
}
