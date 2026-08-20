import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const root = process.cwd();

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-me';
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'pizza';
export const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || null;

if (NODE_ENV === 'production' && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  console.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set via environment variables in production.');
  process.exit(1);
}

export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000')
  .split(',')
  .map(s => s.trim());

export const PRIVATE_DIR = join(__dirname, 'private');
export const DATA_DIR = join(root, 'public', 'data');

/* Le locandine caricate dal Pannello. Stanno sotto `public/` come tutto il
   resto degli statici, cosi' una ricompilazione se le porta dentro `dist/`;
   ma vengono anche servite direttamente da li', altrimenti una locandina
   appena caricata non si vedrebbe fino alla build successiva. */
export const UPLOADS_DIR = join(root, 'public', 'images', 'eventi');
export const UPLOADS_URL = '/images/eventi';
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const TOWNS_PATH = join(DATA_DIR, 'towns.json');
export const VENUES_PATH = join(DATA_DIR, 'venues.json');
export const PRICES_PATH = join(DATA_DIR, 'prices.json');
export const EVENTS_PATH = join(DATA_DIR, 'events.json');
export const COMMENTS_PATH = join(PRIVATE_DIR, 'comments.json');
export const PROPOSALS_PATH = join(PRIVATE_DIR, 'price-proposals.json');
export const ADMINS_PATH = join(PRIVATE_DIR, 'admins.json');
export const FEED_POSTS_PATH = join(PRIVATE_DIR, 'feed-posts.json');

export const BANNED_WORDS = [
  'buy now', 'click here', 'cheap meds', 'viagra', 'cialis',
  'casino', 'gambling', 'earn money', 'work from home',
  'http://', 'https://', 'www.', '.com', '.org', '.net',
  'SEO', 'backlink', 'phentermine', 'tramadol', 'mortgage',
  'free gift card', 'amazon gift', 'crypto', 'bitcoin',
];

export const MAX_COMMENTS_PER_5MIN = 3;
export const MAX_COMMENTS_PER_HOUR = 10;
export const MIN_CONTENT_LENGTH = 5;
export const MAX_CONTENT_LENGTH = 500;
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 30;

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const ACCOUNT_LOCKOUT_MS = 15 * 60 * 1000;
export const CAPTCHA_TTL_MS = 10 * 60 * 1000;
