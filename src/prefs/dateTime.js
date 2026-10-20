/* Costanti e funzioni pure delle preferenze di data e ora.
   Stanno fuori dal file del provider perche' quello esporta un componente:
   mescolarci delle funzioni spegne il ricaricamento a caldo di Vite, che per
   riconoscere un componente ha bisogno di file che esportino solo quelli. */

const STORAGE_KEY = 'pizza-peninsula-datetime';

/* Il fuso della macchina. E' il valore predefinito ed e' anche una scelta
   esplicita nell'elenco: chi si sposta vuole che le ore lo seguano, chi
   lavora sempre sullo stesso posto vuole il contrario. */
export const DEVICE_ZONE = 'device';

export function resolveZone(zone) {
  if (!zone || zone === DEVICE_ZONE) return undefined;   // undefined = lascia decidere a Intl
  return zone;
}

/* I formati offerti. Non sono un elenco di codici: ognuno e' un modo di
   scrivere una data che qualcuno si aspetta di trovare.
   `auto` segue la lingua scelta, ed e' il comportamento di prima; i tre a cifre
   passano da `digitDate` qui sotto e non dalla lingua. */
export const DATE_FORMATS = {
  auto: null,
  dmy: 'digits',
  mdy: 'digits',
  iso: 'digits',
  medium: { day: 'numeric', month: 'short', year: 'numeric' },
  long: { day: 'numeric', month: 'long', year: 'numeric' },
};

/* I formati a cifre si compongono a mano.
   `toLocaleDateString` con `{ day: '2-digit', month: '2-digit' }` non mette i
   campi nell'ordine in cui li si e' scritti: li mette nell'ordine della lingua.
   In italiano «Mese/Giorno/Anno» tornava `20/08/2026` identico a
   «Giorno/Mese/Anno» — due voci diverse nella tendina e lo stesso risultato,
   che e' il modo piu' rapido di togliere ogni fiducia a un'impostazione. Qui i
   pezzi si chiedono comunque a `Intl`, che e' l'unico a sapere il fuso, e si
   rimontano nell'ordine chiesto. */
const DIGIT_ORDER = {
  iso: ({ y, m, d }) => `${y}-${m}-${d}`,
  dmy: ({ y, m, d }) => `${d}/${m}/${y}`,
  mdy: ({ y, m, d }) => `${m}/${d}/${y}`,
};

export function digitDate(date, zone, key) {
  const build = DIGIT_ORDER[key];
  if (!build) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const g = (t) => parts.find(x => x.type === t)?.value;
  return build({ y: g('year'), m: g('month'), d: g('day') });
}

export const TIME_FORMATS = {
  auto: null,
  h24: { hour: '2-digit', minute: '2-digit', hour12: false },
  h12: { hour: 'numeric', minute: '2-digit', hour12: true },
};

export const DEFAULTS = { zone: DEVICE_ZONE, dateFormat: 'auto', timeFormat: 'auto' };

export function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      zone: typeof parsed.zone === 'string' ? parsed.zone : DEFAULTS.zone,
      dateFormat: parsed.dateFormat in DATE_FORMATS ? parsed.dateFormat : DEFAULTS.dateFormat,
      timeFormat: parsed.timeFormat in TIME_FORMATS ? parsed.timeFormat : DEFAULTS.timeFormat,
    };
  } catch {
    // Preferenza illeggibile: si riparte dai valori di partenza, non si esplode.
    return DEFAULTS;
  }
}

export function writeStored(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* Spazio esaurito o scrittura vietata (navigazione in incognito con i dati
       dei siti bloccati): la preferenza vale per questa sessione e basta. */
  }
}

/* L'elenco dei fusi lo da' il browser: 418 voci, sempre aggiornate, senza una
   tabella da mantenere a mano nel repository. Dove non c'e' (browser vecchi)
   resta almeno il fuso della macchina piu' quello di casa. */
export function listZones() {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['Europe/Rome'];
  }
}

/* Un giorno di calendario letto come tale.
   `new Date('2026-09-23')` non da' il 23 settembre: da' la mezzanotte UTC del
   23, che per chiunque stia a ovest di Greenwich e' ancora il 22 sera. Da li'
   `getDate()` risponde 22 e la sagra compare col giorno sbagliato — a Roma non
   si vede, in America si'. Qui i tre numeri si leggono dalla stringa e si
   costruisce una data locale, cosi' il 23 resta il 23 ovunque. */
export function parsePlainDay(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  if (!m) return new Date(value);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function deviceZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/* Lo scarto dall'ora di Greenwich, scritto come lo si legge sui cartelli:
   `UTC+02:00`. Serve nell'elenco, accanto al nome del fuso — «Europe/Rome» da
   solo non dice a nessuno che ore sono. */
export function zoneOffset(zone, at = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, timeZoneName: 'longOffset',
    }).formatToParts(at);
    const raw = parts.find(p => p.type === 'timeZoneName')?.value || '';
    return raw === 'GMT' ? 'UTC+00:00' : raw.replace('GMT', 'UTC');
  } catch {
    return '';
  }
}
