import { verifyAccessToken } from '../utils/jwt.js';

const PUBLIC_ROUTES = [
  '/api/data/stitched',
  '/api/data/towns',
  '/api/data/venues',
  '/api/data/prices',
  '/api/comments',
  '/api/comments/captcha',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/2fa/verify-login',
  '/api/csrf-token',
];

function isPublicRoute(path) {
  return PUBLIC_ROUTES.some(route => path.startsWith(route));
}

export function authMiddleware(req, res, next) {
  if (isPublicRoute(req.path)) return next();

  const token = req.signedCookies?.accessToken || req.cookies?.accessToken;
  if (!token) return res.status(401).json({ error: 'Non autorizzato' });

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token scaduto o non valido' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    next();
  };
}
