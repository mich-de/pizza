const API_BASE = globalThis.process?.env?.VITE_API_BASE || '';

let authCache = null;
let authCacheTime = 0;
const CACHE_TTL = 30000;

export async function checkAuth() {
  const now = Date.now();
  if (authCache && now - authCacheTime < CACHE_TTL) return authCache;

  try {
    const res = await fetch(`${API_BASE}/api/admin/me`, { credentials: 'include' });
    if (!res.ok) {
      authCache = null;
      return null;
    }
    const data = await res.json();
    authCache = data.user;
    authCacheTime = now;
    return data.user;
  } catch {
    authCache = null;
    return null;
  }
}

export async function logout() {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch {}
  authCache = null;
}

export function clearAuthCache() {
  authCache = null;
  authCacheTime = 0;
}
