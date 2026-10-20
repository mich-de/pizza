import { randomBytes } from 'crypto';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXEMPT_ROUTES = new Set(['/api/auth/login', '/api/auth/refresh']);

const TOKENS = new Map();
const TOKEN_TTL = 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [token, expires] of TOKENS.entries()) {
    if (now > expires) TOKENS.delete(token);
  }
}, 15 * 60 * 1000);

export function csrfMiddleware(req, res, next) {
  if (SAFE_METHODS.has(req.method) || EXEMPT_ROUTES.has(req.path)) return next();

  const clientToken = req.headers[CSRF_HEADER];
  const cookieToken = req.signedCookies?.[CSRF_COOKIE] || req.cookies?.[CSRF_COOKIE];

  if (!clientToken || !cookieToken || clientToken !== cookieToken || !TOKENS.has(clientToken)) {
    return res.status(403).json({ error: 'CSRF token non valido' });
  }

  TOKENS.delete(clientToken);
  next();
}

export function csrfToken(req, res) {
  const token = randomBytes(32).toString('hex');
  TOKENS.set(token, Date.now() + TOKEN_TTL);
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_TTL,
  });
  res.json({ csrfToken: token });
}
