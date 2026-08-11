import {
  LOGIN_WINDOW_MS,
  MAX_LOGIN_ATTEMPTS,
  MAX_COMMENTS_PER_5MIN,
  MAX_COMMENTS_PER_HOUR,
  ACCOUNT_LOCKOUT_MS,
  ADMINS_PATH
} from '../config.js';
import { safeWriteJSON } from '../services/storage.js';

// --- Login Rate Limiting ---
const loginAttemptMap = new Map();

export function checkLoginRateLimit(ip) {
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

export function recordLoginAttempt(ip) {
  const now = Date.now();
  if (!loginAttemptMap.has(ip)) loginAttemptMap.set(ip, []);
  loginAttemptMap.get(ip).push(now);
}

export function checkAccountLockout(admin) {
  if (!admin.lockedUntil) return { locked: false };
  if (Date.now() < new Date(admin.lockedUntil).getTime()) {
    const waitSeconds = Math.ceil((new Date(admin.lockedUntil).getTime() - Date.now()) / 1000);
    return { locked: true, waitSeconds };
  }
  return { locked: false };
}

export async function recordFailedLogin(admin, admins) {
  admin.failedAttempts = (admin.failedAttempts || 0) + 1;
  if (admin.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
    admin.lockedUntil = new Date(Date.now() + ACCOUNT_LOCKOUT_MS).toISOString();
    admin.failedAttempts = 0;
  }
  await safeWriteJSON(ADMINS_PATH, admins);
}

export async function clearFailedLogins(admin, admins) {
  if (admin.failedAttempts || admin.lockedUntil) {
    admin.failedAttempts = 0;
    delete admin.lockedUntil;
    await safeWriteJSON(ADMINS_PATH, admins);
  }
}

// --- Comment/General Rate Limiting ---
const rateLimitMap = new Map();

export function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
  const timestamps = rateLimitMap.get(ip);
  const fiveMinAgo = now - 5 * 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;
  const recent5min = timestamps.filter(t => t > fiveMinAgo);
  const recent1hr = timestamps.filter(t => t > oneHourAgo);
  rateLimitMap.set(ip, recent1hr);
  if (recent5min.length >= MAX_COMMENTS_PER_5MIN) {
    return { allowed: false, reason: 'rate_5min', waitSeconds: Math.ceil((recent5min[0] + 5 * 60 * 1000 - now) / 1000) };
  }
  if (recent1hr.length >= MAX_COMMENTS_PER_HOUR) {
    return { allowed: false, reason: 'rate_1hr', waitSeconds: Math.ceil((recent1hr[0] + 60 * 60 * 1000 - now) / 1000) };
  }
  return { allowed: true };
}

export function recordComment(ip) {
  const now = Date.now();
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
  rateLimitMap.get(ip).push(now);
}

import { logger } from './logger.js';

// --- API Global Rate Limiting Middleware ---
const apiRateLimitMap = new Map();

export function apiRateLimit(req, res, next) {
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

// Cleanup intervals
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of loginAttemptMap.entries()) {
    const cleaned = attempts.filter(t => t > now - LOGIN_WINDOW_MS);
    if (cleaned.length === 0) loginAttemptMap.delete(ip);
    else loginAttemptMap.set(ip, cleaned);
  }
}, 5 * 60 * 1000);

setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const cleaned = timestamps.filter(t => t > oneHourAgo);
    if (cleaned.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, cleaned);
  }
}, 10 * 60 * 1000);

setInterval(() => {
  const now = Date.now();
  const oneMinAgo = now - 60 * 1000;
  for (const [ip, timestamps] of apiRateLimitMap.entries()) {
    const cleaned = timestamps.filter(t => t > oneMinAgo);
    if (cleaned.length === 0) apiRateLimitMap.delete(ip);
    else apiRateLimitMap.set(ip, cleaned);
  }
}, 5 * 60 * 1000);
