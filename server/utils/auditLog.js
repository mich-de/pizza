import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PRIVATE_DIR = join(__dirname, '../private');
const AUDIT_LOG_PATH = join(PRIVATE_DIR, 'audit-log.json');

const fileLocks = new Map();
function withFileLock(filePath, fn) {
  if (!fileLocks.has(filePath)) fileLocks.set(filePath, Promise.resolve());
  const lock = fileLocks.get(filePath).then(fn, fn);
  fileLocks.set(filePath, lock);
  return lock;
}

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
  const tmpPath = `${AUDIT_LOG_PATH}.tmp.${Date.now()}.${process.pid}`;
  writeFileSync(tmpPath, JSON.stringify(log, null, 2), 'utf-8');
  renameSync(tmpPath, AUDIT_LOG_PATH);
}

export async function auditLog(userId, action, resource, details = {}) {
  return withFileLock(AUDIT_LOG_PATH, () => {
    const log = readLog();
    // Safe ID generation without Math.max(...spread)
    let maxId = 0;
    for (const entry of log) { if (entry.id > maxId) maxId = entry.id; }
    
    log.push({
      id: maxId + 1,
      userId,
      action,
      resource,
      details,
      timestamp: new Date().toISOString(),
      ip: details.ip || 'unknown',
    });
    saveLog(log);
  });
}

export async function getAuditLog(limit = 100) {
  return withFileLock(AUDIT_LOG_PATH, () => {
    const log = readLog();
    return log.slice(-limit).reverse();
  });
}
