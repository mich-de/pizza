import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext';
import {
  DEFAULTS, readStored, writeStored, resolveZone, deviceZone,
  DATE_FORMATS, TIME_FORMATS, digitDate,
} from './dateTime';

/* Come si leggono le date e a che ora sono.
   Sta accanto al tema e alla lingua, e come quelli vive nel browser di chi
   guarda: e' una preferenza di lettura, non un dato del progetto, e due
   persone che guardano lo stesso prezzo da due paesi devono poterlo vedere
   ciascuna con l'ora di casa propria.

   Il motivo per cui serve: sul disco le date sono istanti UTC (`2026-05-03T17:05:13.843Z`).
   Finora ogni punto del sito le rendeva con `toLocaleDateString()` e basta,
   cioe' col fuso della macchina, senza che nessuno potesse dire altrimenti —
   e in quattro punti diversi, ognuno con le sue opzioni.

   Qui sta solo il provider; le costanti e le funzioni pure — l'elenco dei fusi,
   i formati, `parsePlainDay` — vivono in `./dateTime`, che chiunque puo'
   importare senza tirarsi dietro React. */

const DateTimeContext = createContext();

export function DateTimeProvider({ children }) {
  const { lang } = useI18n();
  const [prefs, setPrefs] = useState(readStored);

  useEffect(() => { writeStored(prefs); }, [prefs]);

  const set = useCallback((patch) => setPrefs(p => ({ ...p, ...patch })), []);
  const reset = useCallback(() => setPrefs(DEFAULTS), []);

  const value = useMemo(() => {
    const locale = lang === 'it' ? 'it-IT' : 'en-US';
    const timeZone = resolveZone(prefs.zone);
    const dateOpts = DATE_FORMATS[prefs.dateFormat];
    const timeOpts = TIME_FORMATS[prefs.timeFormat];

    const parse = (input) => {
      if (input === null || input === undefined || input === '') return null;
      const d = input instanceof Date ? input : new Date(input);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    /* Una data «nuda» — `2026-09-23`, senza ora — e' un giorno di calendario,
       non un istante. `new Date()` la legge a mezzanotte UTC, quindi
       riscriverla in un fuso a ovest la fa arretrare di un giorno: la sagra
       del 23 comparirebbe come il 22. Per queste il fuso non si applica. */
    const isPlainDay = (input) => typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input);

    const formatDate = (input, { fallback = '—' } = {}) => {
      const d = parse(input);
      if (!d) return fallback;
      const zone = isPlainDay(input) ? 'UTC' : timeZone;
      if (dateOpts === 'digits') return digitDate(d, zone, prefs.dateFormat);
      return d.toLocaleDateString(locale, { ...(dateOpts || { dateStyle: 'medium' }), timeZone: zone });
    };

    const formatTime = (input, { fallback = '—' } = {}) => {
      const d = parse(input);
      if (!d) return fallback;
      return d.toLocaleTimeString(locale, { ...(timeOpts || { hour: '2-digit', minute: '2-digit' }), timeZone });
    };

    const formatDateTime = (input, { fallback = '—' } = {}) => {
      const d = parse(input);
      if (!d) return fallback;
      return `${formatDate(input)}, ${formatTime(input)}`;
    };

    /* Il giorno del mese e il mese, per il flap e per gli intervalli: una
       paletta di tabellone non porta l'anno. */
    const formatDayMonth = (input, { month = 'short' } = {}) => {
      const d = parse(input);
      if (!d) return '—';
      return d.toLocaleDateString(locale, {
        day: 'numeric', month, timeZone: isPlainDay(input) ? 'UTC' : timeZone,
      });
    };

    /* L'intervallo di un evento. Se comincia e finisce nello stesso mese il
       mese si scrive una volta sola: «23–25 settembre», non «23 settembre –
       25 settembre», che dice due volte la stessa cosa. */
    const formatDateRange = (start, end) => {
      const s = parse(start), e = parse(end);
      if (!s) return '—';
      if (!e || start === end) return formatDayMonth(start, { month: 'long' });

      const zoneOf = (v) => (isPlainDay(v) ? 'UTC' : timeZone);
      const partIn = (d, v, opts) => new Intl.DateTimeFormat(locale, { ...opts, timeZone: zoneOf(v) }).format(d);
      const sameMonth = partIn(s, start, { month: 'numeric', year: 'numeric' })
        === partIn(e, end, { month: 'numeric', year: 'numeric' });

      if (sameMonth) return `${partIn(s, start, { day: 'numeric' })}–${formatDayMonth(end, { month: 'long' })}`;
      return `${formatDayMonth(start, { month: 'long' })} – ${formatDayMonth(end, { month: 'long' })}`;
    };

    /* «3 ore fa» finche' e' utile, poi la data vera: dopo una settimana
       «184 ore fa» non lo converte piu' nessuno a mente. Le etichette arrivano
       da fuori perche' qui dentro non si traduce. */
    const formatRelative = (input, labels) => {
      const d = parse(input);
      if (!d) return '—';
      const mins = Math.floor((Date.now() - d.getTime()) / 60000);
      if (mins < 1) return labels.justNow;
      if (mins < 60) return `${mins} ${labels.minsAgo}`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} ${labels.hrsAgo}`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days} ${labels.daysAgo}`;
      return formatDate(input);
    };

    return {
      ...prefs, set, reset, locale,
      effectiveZone: timeZone || deviceZone(),
      formatDate, formatTime, formatDateTime, formatDayMonth, formatDateRange, formatRelative,
    };
  }, [prefs, lang, set, reset]);

  return <DateTimeContext.Provider value={value}>{children}</DateTimeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDateTime() {
  const ctx = useContext(DateTimeContext);
  if (!ctx) throw new Error('useDateTime va usato dentro DateTimeProvider');
  return ctx;
}
