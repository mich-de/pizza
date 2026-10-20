const API_BASE = globalThis.process?.env?.VITE_API_BASE || '';

/* Queste due funzioni stavano copiate in quattro file — Admin, AdminProposals,
   Prices e VenueEditModal — con piccole differenze fra una copia e l'altra
   (una registrava l'errore con `console.error`, un'altra con `console.debug`).
   Da qui in avanti stanno scritte una volta sola. */

/* Chiamata autenticata con un tentativo di rinnovo: se il server risponde 401
   si prova a rinfrescare la sessione e si ripete la richiesta una volta. Se
   anche quella fallisce si alza `SESSION_EXPIRED`, che chi chiama traduce in
   un ritorno alla pagina di accesso. */
export async function fetchWithAuth(url, options = {}) {
  const send = () => fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  const res = await send();
  if (res.status !== 401) return res;

  try {
    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (refreshRes.ok) return send();
  } catch (err) {
    console.debug('Rinnovo della sessione fallito', err);
  }
  throw new Error('SESSION_EXPIRED');
}

/* Il gettone e' a uso singolo: il server lo cancella appena lo verifica,
   quindi va richiesto prima di ogni scrittura, non tenuto da parte. */
export async function fetchCSRF() {
  const res = await fetch(`${API_BASE}/api/csrf-token`, { credentials: 'include' });
  const data = await res.json();
  return data.csrfToken;
}
