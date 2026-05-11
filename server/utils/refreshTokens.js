import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PRIVATE_DIR = join(__dirname, '../private');
const TOKENS_PATH = join(PRIVATE_DIR, 'refresh-tokens.json');

function readTokens() {
  if (!existsSync(TOKENS_PATH)) return {};
  try {
    return JSON.parse(readFileSync(TOKENS_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveTokens(tokens) {
  const dir = dirname(TOKENS_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2), 'utf-8');
}

export function createRefreshToken(userId, role) {
  const tokenId = randomUUID();
  const tokens = readTokens();
  tokens[tokenId] = {
    userId,
    role,
    createdAt: new Date().toISOString(),
    revoked: false,
  };
  saveTokens(tokens);
  return tokenId;
}

export function validateRefreshToken(tokenId) {
  const tokens = readTokens();
  const entry = tokens[tokenId];
  if (!entry || entry.revoked) return null;
  return entry;
}

export function revokeRefreshToken(tokenId) {
  const tokens = readTokens();
  if (tokens[tokenId]) {
    tokens[tokenId].revoked = true;
    saveTokens(tokens);
    return true;
  }
  return false;
}

export function revokeAllUserTokens(userId) {
  const tokens = readTokens();
  let changed = false;
  for (const [id, entry] of Object.entries(tokens)) {
    if (entry.userId === userId && !entry.revoked) {
      tokens[id].revoked = true;
      changed = true;
    }
  }
  if (changed) saveTokens(tokens);
}

const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function pruneExpiredTokens() {
  const tokens = readTokens();
  const now = Date.now();
  let changed = false;
  for (const [id, entry] of Object.entries(tokens)) {
    const createdAt = new Date(entry.createdAt).getTime();
    if (entry.revoked || (now - createdAt > REFRESH_TOKEN_MAX_AGE_MS)) {
      delete tokens[id];
      changed = true;
    }
  }
  if (changed) saveTokens(tokens);
}

// Auto-prune every 6 hours
setInterval(pruneExpiredTokens, 6 * 60 * 60 * 1000);

