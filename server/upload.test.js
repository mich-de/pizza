import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { readdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const { app } = await import('./index.js');
const { generateAccessToken } = await import('./utils/jwt.js');
const { UPLOADS_DIR, EVENTS_PATH } = await import('./config.js');

/* Il gettone si conia col generatore dell'applicazione e col segreto di prova
   dichiarato qui sopra: nessuna credenziale vera entra in gioco. */
const adminCookie = `accessToken=${generateAccessToken({ userId: 'test-admin', username: 'test', role: 'admin' })}`;

/* Il gettone anti-falsificazione e' a uso singolo, quindi se ne prende uno
   nuovo prima di ogni scrittura, esattamente come fa il Pannello. */
async function csrf() {
  const res = await request(app).get('/api/csrf-token');
  const cookie = res.headers['set-cookie'].find(c => c.startsWith('csrf-token='));
  return { token: res.body.csrfToken, cookie: cookie.split(';')[0] };
}

function post(bytes, type = 'image/png') {
  return csrf().then(c => request(app)
    .post('/api/admin/events/poster')
    .set('Cookie', [adminCookie, c.cookie])
    .set('X-CSRF-Token', c.token)
    .set('Content-Type', type)
    .send(bytes));
}

// Un PNG valido di 1x1, costruito qui: nessun file di appoggio da tenere in repo.
function onePixelPNG() {
  const crcT = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c; }
  const crc = b => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (t, d) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(d.length);
    const td = Buffer.concat([Buffer.from(t, 'ascii'), d]);
    const k = Buffer.alloc(4); k.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, k]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.from([0, 255, 0, 0, 255]))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const before = existsSync(UPLOADS_DIR) ? new Set(readdirSync(UPLOADS_DIR)) : new Set();

describe('Caricamento locandine', () => {
  it('rifiuta chi non ha una sessione', async () => {
    const res = await request(app).post('/api/admin/events/poster')
      .set('Content-Type', 'image/png').send(onePixelPNG());
    expect(res.status).toBe(401);
  });

  it('rifiuta senza gettone anti-falsificazione', async () => {
    const res = await request(app).post('/api/admin/events/poster')
      .set('Cookie', [adminCookie]).set('Content-Type', 'image/png').send(onePixelPNG());
    expect(res.status).toBe(403);
  });

  it('rifiuta un file che non e’ un’immagine, anche se si dichiara tale', async () => {
    const res = await post(Buffer.from('MZ\0 non sono un png, ma lo dico'), 'image/png');
    expect(res.status).toBe(415);
  });

  it('rifiuta il corpo vuoto', async () => {
    const res = await post(Buffer.alloc(0));
    expect(res.status).toBe(400);
  });

  it('accetta un PNG e restituisce un indirizzo servibile', async () => {
    const res = await post(onePixelPNG());
    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/images\/eventi\/[0-9a-f-]{36}\.png$/);

    // e il file si scarica davvero dall'indirizzo restituito
    const get = await request(app).get(res.body.url);
    expect(get.status).toBe(200);
    expect(get.headers['content-type']).toContain('image/png');
    expect(get.headers['x-content-type-options']).toBe('nosniff');
  });

  it('non si esce dalla cartella con un percorso costruito ad arte', async () => {
    const res = await request(app).get('/images/eventi/..%2f..%2fdata%2fevents.json');
    expect(res.status).not.toBe(200);
  });
});

/* Il giro completo di una scheda evento. Scrive sull'archivio vero, quindi se
   ne tiene una copia esatta prima e si rimette com'era alla fine: una prova
   che lascia in giro un evento fantasma non e' una prova, e' un danno. */
describe('Eventi dal Pannello', () => {
  let snapshot, createdId;

  beforeAll(() => { snapshot = readFileSync(EVENTS_PATH, 'utf8'); });
  afterAll(() => { writeFileSync(EVENTS_PATH, snapshot, 'utf8'); });

  const send = async (method, url, body) => {
    const c = await csrf();
    const r = request(app)[method](url)
      .set('Cookie', [adminCookie, c.cookie])
      .set('X-CSRF-Token', c.token);
    return body === undefined ? r : r.send(body);
  };

  const VALID = {
    title: 'Prova Automatica', titleIt: 'Prova Automatica',
    dateStart: '2027-04-01', dateEnd: '2027-04-03',
    cityId: 'sorrento', type: 'festival',
  };

  it('crea, e si ricava un identificativo leggibile dal titolo', async () => {
    const res = await send('post', '/api/admin/events', VALID);
    expect(res.status).toBe(201);
    createdId = res.body.id || res.body.event?.id;
    expect(createdId).toMatch(/^prova-automatica-2027/);
  });

  it('rifiuta le date al contrario', async () => {
    const res = await send('post', '/api/admin/events', { ...VALID, dateStart: '2027-04-05' });
    expect(res.status).toBe(400);
  });

  it('modifica senza cambiare identificativo', async () => {
    const res = await send('put', `/api/admin/events/${createdId}`, { ...VALID, venue: 'Piazza Tasso' });
    expect(res.status).toBe(200);
    const list = await request(app).get('/api/data/events');
    const found = list.body.find(e => e.id === createdId);
    expect(found.venue).toBe('Piazza Tasso');
  });

  it('elimina, e poi non si trova piu’', async () => {
    const res = await send('delete', `/api/admin/events/${createdId}`);
    expect(res.status).toBe(200);
    const list = await request(app).get('/api/data/events');
    expect(list.body.some(e => e.id === createdId)).toBe(false);
  });

  it('eliminare qualcosa che non c’e’ da 404, non 500', async () => {
    const res = await send('delete', '/api/admin/events/questo-non-esiste');
    expect(res.status).toBe(404);
  });
});

afterAll(() => {
  // Via i file scritti dalla prova: la cartella torna com'era.
  if (!existsSync(UPLOADS_DIR)) return;
  for (const f of readdirSync(UPLOADS_DIR)) {
    if (!before.has(f)) rmSync(`${UPLOADS_DIR}/${f}`, { force: true });
  }
});
