import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatTile from '../components/StatTile';
import { PageHeader } from '../components/ui';
import { parsePlainDay } from '../prefs/dateTime';

/* Le date di un evento sono giorni di calendario, non istanti: la sagra del 23
   e' il 23 per chi la guarda da Sorrento e per chi la guarda da New York. Per
   questo qui non si applica il fuso scelto in Impostazioni — si applica a un
   commento delle 18:30, non a una data di calendario — ma si passa comunque da
   `parsePlainDay`, che e' l'unico modo di non farla scivolare al giorno prima.

   Il mese resta l'abbreviazione tradotta (`months.09` → «Set»): tre lettere
   sulla paletta del tabellone, che e' lo spazio che c'e'. */

function formatDateRange(start, end, monthNames) {
  const s = parsePlainDay(start);
  const e = parsePlainDay(end);
  const sDay = s.getDate();
  const eDay = e.getDate();
  const monthKey = String(s.getMonth() + 1).padStart(2, '0');
  const month = monthNames[monthKey] || '';
  if (s.getMonth() === e.getMonth()) {
    return `${sDay}–${eDay} ${month}`;
  }
  return `${sDay} ${month} – ${eDay} ${monthNames[String(e.getMonth() + 1).padStart(2, '0')]}`;
}

function getDayName(dateStr, lang) {
  const d = parsePlainDay(dateStr);
  return d.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { weekday: 'short' });
}

function getMonthAbbr(dateStr, monthNames) {
  const d = parsePlainDay(dateStr);
  const key = String(d.getMonth() + 1).padStart(2, '0');
  return monthNames[key] || '';
}

function getDayNum(dateStr) {
  return parsePlainDay(dateStr).getDate();
}

function isOngoing(start, end) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const s = parsePlainDay(start);
  s.setHours(0, 0, 0, 0);
  const e = parsePlainDay(end);
  e.setHours(23, 59, 59, 999);
  return now >= s && now <= e;
}

function isPast(end) {
  return new Date(end) < new Date();
}

export default function Events() {
  const { t, lang } = useI18n();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [towns, setTowns] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      /* Dall'API, non dal file statico: gli eventi ora si modificano dal
         Pannello, e la copia dentro `dist/` e' ferma alla compilazione. */
      fetch('/api/data/events').then(r => r.json()),
      fetch('/data/towns.json').then(r => r.json()),
    ])
      .then(([evts, twns]) => {
        setEvents(evts);
        setTowns(twns);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (selectedEvent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedEvent]);

  const monthNames = {
    '01': t('months.01'), '02': t('months.02'), '03': t('months.03'),
    '04': t('months.04'), '05': t('months.05'), '06': t('months.06'),
    '07': t('months.07'), '08': t('months.08'), '09': t('months.09'),
    '10': t('months.10'), '11': t('months.11'), '12': t('months.12'),
  };

  const cityOptions = ['all', ...new Set(events.map(e => e.cityId))];
  const typeOptions = ['all', ...new Set(events.map(e => e.type))];

  const filtered = events.filter(e => {
    const matchSearch = !searchQuery || 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (e.titleIt && e.titleIt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCity = cityFilter === 'all' || e.cityId === cityFilter;
    const matchType = typeFilter === 'all' || e.type === typeFilter;
    return matchSearch && matchCity && matchType;
  });

  const sortedAsc = [...filtered].sort((a, b) => new Date(a.dateStart) - new Date(b.dateStart));
  const ongoing = sortedAsc.filter(e => isOngoing(e.dateStart, e.dateEnd));
  const upcoming = sortedAsc.filter(e => !isPast(e.dateEnd) && !isOngoing(e.dateStart, e.dateEnd));
  const featured = [...ongoing, ...upcoming][0] || null;

  const sortedDesc = [...filtered].sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart));
  const otherEvents = sortedDesc.filter(e => e.id !== featured?.id);

  if (loading) return <LoadingSpinner fullScreen />;

  const townName = (cityId) => towns.find(tw => tw.id === cityId)?.name || cityId;

  /* Lo stato di una data e' un segnale, non un colore di categoria: in corso
     usa l'ambra, passato resta neutro, in arrivo e' un badge sobrio. */
  const statusBadge = (ev) => {
    if (isPast(ev.dateEnd)) return { cls: 'badge-ghost', label: t('events.pastEvent') };
    if (isOngoing(ev.dateStart, ev.dateEnd)) return { cls: 'badge-warning', label: t('events.todayEvent') };
    return { cls: 'badge-ghost', label: t('events.upcoming') };
  };

  return (
    <div className="container fade-in">
      <PageHeader
        eyebrow={t('common.peninsula')}
        title={t('events.title')}
        subtitle={t('events.subtitle')}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <StatTile icon="event" label={t('events.totalEvents')} value={events.length} />
        <StatTile icon="upcoming" label={t('events.upcomingTitle')} value={events.filter(e => !isPast(e.dateEnd)).length} />
        <StatTile icon="bolt" label={t('events.activeNow')} value={events.filter(e => isOngoing(e.dateStart, e.dateEnd)).length} />
      </div>

      {/* Comporre la ricerca non e' contenuto: fuori dalla stampa. */}
      <div className="panel mb-8 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
          <label className="field mb-0">
            <span>{t('common.search')}</span>
            <input
              className="w-full"
              placeholder={t('events.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <label className="field mb-0">
            <span>{t('prices.zoneFilter')}</span>
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              {cityOptions.map(c => (
                <option key={c} value={c}>
                  {c === 'all' ? t('prices.allZones') : townName(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="field mb-0">
            <span>{t('prices.category')}</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              {typeOptions.map(o => (
                <option key={o} value={o}>
                  {o === 'all' ? t('common.all') : o.charAt(0).toUpperCase() + o.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {featured && (
        <section className="mb-10">
          {/* L'unica barra ambra della pagina sta qui: e' la data che conta. */}
          <div
            onClick={() => setSelectedEvent(featured)}
            className="card card-accent cursor-pointer"
          >
            <div className="split items-start">
              <div>
                <div className="chips mb-3">
                  <span className={`badge ${statusBadge(featured).cls}`}>{statusBadge(featured).label}</span>
                  <span className="font-mono text-xs text-on-surface-variant">
                    {formatDateRange(featured.dateStart, featured.dateEnd, monthNames)}
                  </span>
                </div>
                <h2 className="mb-2">{(lang === 'it' && featured.titleIt) ? featured.titleIt : featured.title}</h2>
                <p className="font-body text-on-surface-variant line-clamp-2">
                  {lang === 'it' && featured.descriptionIt ? featured.descriptionIt : featured.description}
                </p>
                <div className="chips">
                  {featured.highlights.map((h, i) => (
                    <span key={i} className="chip">{h}</span>
                  ))}
                </div>
              </div>

              {/* Il giorno e' il dato della scheda: un solo flap, quello. */}
              {/* Il filetto compare alla stessa soglia di `.split` (900px),
                  non a quella di Tailwind: altrimenti resta appeso a colonna
                  gia' impilata. */}
              <div className="text-center min-[900px]:border-l min-[900px]:border-outline-variant min-[900px]:pl-6">
                <div className="font-label text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mb-1.5">
                  {getMonthAbbr(featured.dateStart, monthNames)}
                </div>
                <span className="flap flap-lg text-4xl">{getDayNum(featured.dateStart)}</span>
                <div className="font-mono text-xs text-on-surface-variant mt-2">
                  {getDayName(featured.dateStart, lang)}
                </div>
                <div className="flex items-center gap-1.5 justify-center text-on-surface-variant mt-4 pt-4 border-t border-outline-variant">
                  <span className="material-symbols-outlined text-base">location_on</span>
                  <span className="font-display uppercase tracking-[0.04em] text-sm">
                    {townName(featured.cityId)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {otherEvents.length > 0 && (
        <section>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherEvents.map(event => {
              const evIsOngoing = isOngoing(event.dateStart, event.dateEnd);
              const title = (lang === 'it' && event.titleIt) ? event.titleIt : event.title;
              const desc = (lang === 'it' && event.descriptionIt) ? event.descriptionIt : event.description;
              const st = statusBadge(event);

              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`tile cursor-pointer ${evIsOngoing ? 'highlight' : ''}`}
                >
                  <div className="tile-head">
                    <span className="font-mono text-xs text-on-surface-variant">
                      {formatDateRange(event.dateStart, event.dateEnd, monthNames)}
                    </span>
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                  </div>

                  <div className="flex items-start gap-4 mt-3">
                    <div className="text-center shrink-0">
                      <div className="font-label text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant">
                        {getMonthAbbr(event.dateStart, monthNames)}
                      </div>
                      <span className="flap">{getDayNum(event.dateStart)}</span>
                      <div className="font-mono text-[0.68rem] text-on-surface-variant mt-1">
                        {getDayName(event.dateStart, lang)}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="tile-title">{title}</h3>
                      <p className="tile-desc line-clamp-3">{desc}</p>
                      {event.highlights && event.highlights.length > 0 && (
                        <div className="chips">
                          {event.highlights.slice(0, 3).map((h, i) => (
                            <span key={i} className="chip">{h}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-on-surface-variant mt-3 pt-3 border-t border-outline-variant">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    <span className="font-display uppercase tracking-[0.04em] text-sm">{townName(event.cityId)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {otherEvents.length === 0 && !featured && (
        <div className="panel text-center py-16">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant block">event_busy</span>
          <h3 className="mt-3 mb-0">{t('events.noEvents')}</h3>
        </div>
      )}

      {selectedEvent && createPortal(
        <div
          className="fixed inset-0 bg-black/55 z-[999] flex items-center justify-center p-4 overflow-y-auto no-print"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="card card-accent w-full max-w-3xl max-h-[90vh] overflow-y-auto my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <span className="eyebrow">{t('events.title')}</span>
                <h2 className="mt-1 mb-0">
                  {(lang === 'it' && selectedEvent.titleIt) ? selectedEvent.titleIt : selectedEvent.title}
                </h2>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="btn btn-ghost btn-icon shrink-0" aria-label={t('common.close')}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="chips mb-5">
              <span className={`badge ${statusBadge(selectedEvent).cls}`}>{statusBadge(selectedEvent).label}</span>
              <span className="font-mono text-xs text-on-surface-variant">
                {formatDateRange(selectedEvent.dateStart, selectedEvent.dateEnd, monthNames)}
              </span>
            </div>

            <div className="panel">
              <div className="flex items-center gap-4">
                <span className="flap flap-lg text-4xl">{getDayNum(selectedEvent.dateStart)}</span>
                <div>
                  <div className="font-display uppercase tracking-[0.06em]">
                    {getMonthAbbr(selectedEvent.dateStart, monthNames)}
                  </div>
                  <div className="font-mono text-xs text-on-surface-variant">
                    {getDayName(selectedEvent.dateStart, lang)} &mdash; {getDayName(selectedEvent.dateEnd, lang)}
                  </div>
                </div>
              </div>
            </div>

            <p className="font-body mt-5">
              {lang === 'it' && selectedEvent.descriptionIt ? selectedEvent.descriptionIt : selectedEvent.description}
            </p>

            <ul className="kv mt-5">
              <li><span className="k">{t('events.where')}</span><span className="v">{townName(selectedEvent.cityId)}</span></li>
              <li><span className="k">{t('events.venue')}</span><span className="v">{selectedEvent.venue}</span></li>
              <li>
                <span className="k">{t('events.when')}</span>
                <span className="v font-mono tabular-nums">
                  {formatDateRange(selectedEvent.dateStart, selectedEvent.dateEnd, monthNames)}
                </span>
              </li>
            </ul>

            <div className="section-title mt-5">
              <h2 className="text-base">{t('events.highlights')}</h2>
            </div>
            <div className="chips">
              {selectedEvent.highlights.map((h, i) => (
                <span key={i} className="chip">{h}</span>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-outline-variant">
              <button onClick={() => setSelectedEvent(null)} className="btn btn-ghost btn-block">
                {t('events.closeDetails')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
