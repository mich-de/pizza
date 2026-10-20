import { createHmac } from 'crypto';
import sanitizeHtml from 'sanitize-html';
import { JWT_SECRET, CAPTCHA_TTL_MS, BANNED_WORDS } from '../config.js';

export function createCaptchaToken(answer) {
  const expires = Date.now() + CAPTCHA_TTL_MS;
  const payload = `${answer}:${expires}`;
  const sig = createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

export function verifyCaptchaToken(token, userAnswer) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split(':');
  if (parts.length !== 3) return false;
  const [answer, expires, sig] = parts;
  const expectedSig = createHmac('sha256', JWT_SECRET).update(`${answer}:${expires}`).digest('hex');
  if (sig !== expectedSig) return false;
  if (Date.now() > parseInt(expires)) return false;
  return parseInt(answer) === userAnswer;
}

export function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export function removeDangerousContent(str) {
  if (typeof str !== 'string') return str;
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

export function containsBannedWords(str) {
  if (typeof str !== 'string') return false;
  const lower = str.toLowerCase();
  return BANNED_WORDS.some(word => lower.includes(word));
}

export function sanitizeObject(obj) {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') sanitized[key] = sanitize(removeDangerousContent(value));
    else sanitized[key] = value;
  }
  return sanitized;
}
