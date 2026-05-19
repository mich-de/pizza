import { silentFetch } from '../utils/silentFetch';

const API_BASE = globalThis.process?.env?.VITE_API_BASE || '';

let authCache = null;
let authCacheTime = 0;
const CACHE_TTL = 30000;
let checkAuthPromise = null;

export async function checkAuth() {
  const now = Date.now();
  if (authCache && now - authCacheTime < CACHE_TTL) return authCache;
  if (checkAuthPromise) return checkAuthPromise;

  // Use localStorage hint to avoid 401 calls for unauthenticated users
  if (!localStorage.getItem('pizza_session_hint')) return null;

  checkAuthPromise = (async () => {
    try {
      const res = await silentFetch(`${API_BASE}/api/admin/me`, { credentials: 'include' });
      if (!res.ok) {
        authCache = null;
        if (res.status === 401) {
          localStorage.removeItem('pizza_session_hint');
        }
        return null;
      }
      const data = await res.json();
      authCache = data.user;
      authCacheTime = Date.now();
      localStorage.setItem('pizza_session_hint', 'true');
      return data.user;
    } catch {
      authCache = null;
      return null;
    } finally {
      checkAuthPromise = null;
    }
  })();

  return checkAuthPromise;
}

export async function logout() {
  try {
    const csrfRes = await silentFetch(`${API_BASE}/api/csrf-token`, { credentials: 'include' });
    const { csrfToken } = await csrfRes.json();
    await silentFetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': csrfToken },
    });
  } catch (e) { console.error(e); }
  authCache = null;
  localStorage.removeItem('pizza_session_hint');
}

export function clearAuthCache() {
  authCache = null;
  authCacheTime = 0;
}
