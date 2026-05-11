import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PRIVATE_DIR = join(__dirname, '../private');
const AUDIT_LOG_PATH = join(PRIVATE_DIR, 'audit-log.json');

function readLog() {
  if (!existsSync(AUDIT_LOG_PATH)) return [];
  try {
    return JSON.parse(readFileSync(AUDIT_LOG_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function saveLog(log) {
  const dir = dirname(AUDIT_LOG_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(AUDIT_LOG_PATH, JSON.stringify(log, null, 2), 'utf-8');
}

export function auditLog(userId, action, resource, details = {}) {
  const log = readLog();
  log.push({
    id: log.length > 0 ? Math.max(...log.map(e => e.id)) + 1 : 1,
    userId,
    action,
    resource,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip || 'unknown',
  });
  saveLog(log);
}

export function getAuditLog(limit = 100) {
  const log = readLog();
  return log.slice(-limit).reverse();
}
