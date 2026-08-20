import { describe, it, expect } from 'vitest';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const { app } = await import('./index.js');
const { generateAccessToken } = await import('./utils/jwt.js');

/* Gettone coniato col generatore dell'applicazione e col segreto di prova
   dichiarato qui sopra: nessuna credenziale vera entra in gioco. */
const adminCookie = `accessToken=${generateAccessToken({ userId: 'test-admin', username: 'test', role: 'admin' })}`;

async function csrf() {
  const res = await request(app).get('/api/csrf-token');
  const cookie = res.headers['set-cookie'].find(c => c.startsWith('csrf-token='));
  return { token: res.body.csrfToken, cookie: cookie.split(';')[0] };
}

/* Una rotta inesistente sotto `/api` rispondeva col 404 predefinito di
   Express, che e' una pagina HTML. Il Pannello ci chiamava sopra `res.json()`
   e chi guardava leggeva «Unexpected token '<'» — un messaggio che della rotta
   sbagliata non dice niente. Questa e' la prova che non ricapiti. */
describe('Indirizzi sconosciuti sotto /api', () => {
  it('rispondono in JSON, non in HTML', async () => {
    // Col gettone: senza, si fermerebbe prima al 403 e la rotta non la vedrebbe.
    const c = await csrf();
    const res = await request(app)
      .post('/api/admin/questa-rotta-non-esiste')
      .set('Cookie', [adminCookie, c.cookie])
      .set('X-CSRF-Token', c.token);
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.error).toContain('/api/admin/questa-rotta-non-esiste');
  });

  it('non rubano gli indirizzi della pagina, che restano HTML', async () => {
    const res = await request(app).get('/impostazioni');
    expect(res.status).toBeLessThan(400);
  });
});

describe('Controllo di validita’ degli archivi', () => {
  it('senza sessione non si esegue', async () => {
    const res = await request(app).post('/api/admin/validate-json');
    expect(res.status).toBe(401);
  });

  it('senza gettone anti-falsificazione non si esegue', async () => {
    const res = await request(app).post('/api/admin/validate-json').set('Cookie', [adminCookie]);
    expect(res.status).toBe(403);
  });

  it('gli archivi in repository sono validi', async () => {
    const c = await csrf();
    const res = await request(app).post('/api/admin/validate-json')
      .set('Cookie', [adminCookie, c.cookie])
      .set('X-CSRF-Token', c.token);

    expect(res.status).toBe(200);
    expect(res.body.checked).toBeGreaterThanOrEqual(6);
    // Se questo cede, e' un dato che si e' allontanato dal suo schema: e' il lavoro del pulsante.
    expect(res.body.errors).toEqual([]);
    expect(res.body.valid).toBe(true);
  });
});

describe('Esportazione degli archivi', () => {
  it('senza sessione non si scarica', async () => {
    const res = await request(app).get('/api/admin/export-data');
    expect(res.status).toBe(401);
  });

  it('scarica un solo file con dentro tutti i dataset', async () => {
    const res = await request(app).get('/api/admin/export-data').set('Cookie', [adminCookie]);

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="pizza-data-\d{4}-\d{2}-\d{2}\.json"/);

    const dump = JSON.parse(res.text);
    expect(dump.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    for (const k of ['towns', 'venues', 'prices', 'events', 'comments', 'price-proposals']) {
      expect(Array.isArray(dump[k]), `manca il dataset ${k}`).toBe(true);
    }
    expect(dump.venues.length).toBeGreaterThan(0);
  });
});
