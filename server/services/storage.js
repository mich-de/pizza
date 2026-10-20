import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { TOWNS_PATH, VENUES_PATH, PRICES_PATH, PROPOSALS_PATH } from '../config.js';

const fileLocks = new Map();

export function withFileLock(filePath, fn) {
  if (!fileLocks.has(filePath)) fileLocks.set(filePath, Promise.resolve());
  const lock = fileLocks.get(filePath).then(fn, fn);
  fileLocks.set(filePath, lock);
  return lock;
}

export function readJSON(filePath, fallback = []) {
  try {
    if (!existsSync(filePath)) return fallback;
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function atomicWriteJSON(filePath, data) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp.${Date.now()}.${process.pid}`;
  writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  renameSync(tmpPath, filePath);
}

export function safeWriteJSON(filePath, data) {
  return withFileLock(filePath, () => {
    atomicWriteJSON(filePath, data);
  });
}

export function safeReadJSON(filePath, fallback = []) {
  return withFileLock(filePath, () => readJSON(filePath, fallback));
}

export async function stitchData(includeUnapproved = false) {
  const towns = await safeReadJSON(TOWNS_PATH, []);
  const venues = await safeReadJSON(VENUES_PATH, []);
  const prices = await safeReadJSON(PRICES_PATH, []);
  const proposals = await safeReadJSON(PROPOSALS_PATH, []);

  return venues
    .filter(v => {
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
