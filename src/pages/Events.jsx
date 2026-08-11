import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nContext';
import LoadingSpinner from '../components/LoadingSpinner';

function formatDateRange(start, end, monthNames) {
  const s = new Date(start);
  const e = new Date(end);
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
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { weekday: 'short' });
}

function getMonthAbbr(dateStr, monthNames) {
  const d = new Date(dateStr);
  const key = String(d.getMonth() + 1).padStart(2, '0');
  return monthNames[key] || '';
}

function getDayNum(dateStr) {
  return new Date(dateStr).getDate();
}

function isOngoing(start, end) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
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
      fetch('/data/events.json').then(r => r.json()),
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

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto w-full">
      {/* Hero Section - Matching Prices Style */}
      <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] mb-8">
        <div className="bg-primary text-on-primary p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-headline font-black uppercase text-sm md:text-base tracking-[0.2em] text-on-primary/80">
                  {t('events.discoverMore')}
                </span>
                <span className="w-8 h-[2px] bg-on-primary/40" />
                <span className="font-label font-bold uppercase text-xs tracking-wider text-on-primary/60">
                  {events.length} {t('common.events')}
                </span>
              </div>
              <h1 className="font-headline font-black text-5xl md:text-7xl lg:text-8xl uppercase tracking-tight leading-none">
                {t('events.title')}
              </h1>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-wrap gap-4 md:gap-6">
            <div className="bg-surface-variant border-2 border-primary px-5 py-3 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
              <span className="font-label font-bold text-xs uppercase text-on-surface-variant block mb-1">
                {t('events.totalEvents')}
              </span>
              <span className="font-headline font-black text-3xl text-primary">{events.length}</span>
            </div>
            <div className="bg-primary-container border-2 border-primary px-5 py-3 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
              <span className="font-label font-bold text-xs uppercase text-primary block mb-1">
                {t('events.upcomingTitle')}
              </span>
              <span className="font-headline font-black text-3xl text-primary">
                {events.filter(e => !isPast(e.dateEnd)).length}
              </span>
            </div>
            <div className="bg-tertiary-container border-2 border-tertiary px-5 py-3 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
              <span className="font-label font-bold text-xs uppercase text-tertiary block mb-1">
                {t('events.activeNow')}
              </span>
              <span className="font-headline font-black text-3xl text-tertiary">
                {events.filter(e => isOngoing(e.dateStart, e.dateEnd)).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar - Matching Prices Style */}
      <div className="bg-surface border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] p-4 md:p-6 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-black font-headline uppercase tracking-widest mb-1.5 text-primary">
              <span className="material-symbols-outlined text-sm align-text-bottom mr-1">search</span>
              {t('common.search')}
            </label>
            <input
              className="w-full bg-background border-2 border-primary p-2.5 font-body font-bold text-primary focus:outline-none focus:border-secondary"
              placeholder={t('events.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-black font-headline uppercase tracking-widest mb-1.5 text-primary">
              {t('prices.zoneFilter')}
            </label>
            <select
              className="w-full bg-background border-2 border-primary p-2.5 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              {cityOptions.map(c => (
                <option key={c} value={c}>
                  {c === 'all' ? t('prices.allZones') : towns.find(t => t.id === c)?.name || c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black font-headline uppercase tracking-widest mb-1.5 text-primary">
              {t('prices.category')}
            </label>
            <select
              className="w-full bg-background border-2 border-primary p-2.5 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {typeOptions.map(o => (
                <option key={o} value={o}>
                  {o === 'all' ? t('common.all') : o.charAt(0).toUpperCase() + o.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {featured && (
        <section className="mb-20">
          <div 
            onClick={() => setSelectedEvent(featured)}
            className="relative bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] overflow-hidden group cursor-pointer card-glow transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#009246] via-white to-[#CE2B37]" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full" />
            <div className="relative grid md:grid-cols-[1fr_auto] gap-8 p-8 md:p-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {isOngoing(featured.dateStart, featured.dateEnd) ? (
                    <span className="inline-flex items-center gap-2 bg-error/10 text-error font-headline font-bold text-sm uppercase tracking-widest px-4 py-1.5 border border-error/30">
                      <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                      {t('events.todayEvent')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 bg-tertiary/10 text-tertiary font-headline font-bold text-sm uppercase tracking-widest px-4 py-1.5 border border-tertiary/30">
                      <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse-soft" />
                      {t('events.upcoming')}
                    </span>
                  )}
                  <span className="font-headline font-bold text-sm uppercase tracking-widest text-on-surface-variant/60">
                    {formatDateRange(featured.dateStart, featured.dateEnd, monthNames)}
                  </span>
                </div>

                <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight text-primary leading-tight">
                  {(lang === 'it' && featured.titleIt) ? featured.titleIt : featured.title}
                </h2>

                <p className="font-body text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-3xl line-clamp-2">
                  {lang === 'it' && featured.descriptionIt ? featured.descriptionIt : featured.description}
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  {featured.highlights.map((h, i) => (
                    <span key={i} className="font-headline font-bold text-xs uppercase tracking-wider bg-primary/10 text-primary border-2 border-primary/30 px-3 py-1.5">
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center md:border-l-4 md:border-primary md:pl-10">
                <div className="text-center">
                  <div className="font-headline font-bold text-sm uppercase tracking-widest text-primary/60 mb-1">
                    {getMonthAbbr(featured.dateStart, monthNames)}
                  </div>
                  <div className="text-7xl md:text-8xl lg:text-9xl font-display font-black text-primary leading-none tracking-tight">
                    {getDayNum(featured.dateStart)}
                  </div>
                  <div className="font-headline font-bold text-base text-on-surface-variant/60 mt-2">
                    {getDayName(featured.dateStart, lang)}
                  </div>
                  <div className="mt-5 pt-5 border-t-2 border-primary/20">
                    <div className="flex items-center gap-2 justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-lg">location_on</span>
                      <span className="font-headline font-bold text-sm uppercase tracking-wider">
                        {towns.find(t => t.id === featured.cityId)?.name || featured.cityId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {otherEvents.length > 0 && (
        <section>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {otherEvents.map(event => {
              const evIsPast = isPast(event.dateEnd);
              const evIsOngoing = isOngoing(event.dateStart, event.dateEnd);
              const town = towns.find(t => t.id === event.cityId);
              const title = (lang === 'it' && event.titleIt) ? event.titleIt : event.title;
              const desc = (lang === 'it' && event.descriptionIt) ? event.descriptionIt : event.description;

              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`group relative bg-surface border-4 overflow-hidden cursor-pointer card-glow ${
                    evIsOngoing
                      ? 'border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]'
                      : 'border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]'
                  } hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[10px_10px_0px_0px_rgba(26,26,26,1)] transition-all`}
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#009246] via-white to-[#CE2B37]" />
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full" />
                  {evIsPast && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant/40 bg-surface px-3 py-1 border-2 border-outline-variant/50">
                        {t('events.pastEvent')}
                      </span>
                    </div>
                  )}

                  <div className="p-7">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-primary text-base flex-shrink-0">event</span>
                        <span className="font-headline font-bold text-sm uppercase tracking-wider text-on-surface-variant/60 truncate">
                          {formatDateRange(event.dateStart, event.dateEnd, monthNames)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="material-symbols-outlined text-base text-on-surface-variant/50">location_on</span>
                        <span className="font-headline font-bold text-sm uppercase tracking-wider text-on-surface-variant/60">
                          {town?.name || event.cityId}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-5">
                      <div className="text-center flex-shrink-0 w-16">
                        <div className="font-headline font-bold text-sm uppercase tracking-widest text-primary/50">
                          {getMonthAbbr(event.dateStart, monthNames)}
                        </div>
                        <div className="text-4xl md:text-5xl font-display font-black text-primary leading-none">
                          {getDayNum(event.dateStart)}
                        </div>
                        <div className="font-headline font-bold text-xs text-on-surface-variant/50 mt-1">
                          {getDayName(event.dateStart, lang)}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-black text-xl md:text-2xl leading-tight text-primary group-hover:text-primary transition-colors">
                          {title}
                        </h3>
                        <p className="font-body text-sm md:text-base text-on-surface-variant mt-2 leading-relaxed line-clamp-3">
                          {desc}
                        </p>

                        {event.highlights && event.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {event.highlights.slice(0, 3).map((h, i) => (
                              <span key={i} className="font-headline font-bold text-xs uppercase tracking-wider bg-primary/10 text-primary/70 border border-primary/20 px-2.5 py-1">
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {evIsOngoing && (
                    <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {otherEvents.length === 0 && !featured && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-7xl text-primary/20" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
          <p className="font-headline font-bold text-xl text-on-surface-variant/50 mt-5">{t('events.noEvents')}</p>
        </div>
      )}

      {/* Modal Popup */}
      {selectedEvent && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-hidden overscroll-none animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-primary/60 backdrop-blur-md cursor-zoom-out"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="relative bg-surface border-8 border-primary shadow-[24px_24px_0px_0px_rgba(26,26,26,1)] w-full max-w-5xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overscroll-contain origin-center scrollbar-hide">
            <div className="sticky top-0 left-0 w-full h-3 bg-gradient-to-r from-[#009246] via-white to-[#CE2B37] z-50" />
            
            <button 
              onClick={() => setSelectedEvent(null)}
              className="sticky top-6 float-right mr-6 z-[60] w-12 h-12 border-4 border-primary bg-surface flex items-center justify-center hover:bg-secondary hover:rotate-90 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]"
              aria-label="Close"
            >
              <span className="material-symbols-outlined font-black">close</span>
            </button>

            <div className="p-8 md:p-16 pt-12 md:pt-20">
              <div className="flex flex-wrap items-center gap-6 mb-10">
                <span className={`inline-flex items-center gap-2 font-headline font-black text-sm uppercase tracking-[0.2em] px-6 py-2.5 border-4 ${
                  isPast(selectedEvent.dateEnd) 
                    ? 'border-on-surface-variant/30 text-on-surface-variant/50' 
                    : isOngoing(selectedEvent.dateStart, selectedEvent.dateEnd)
                      ? 'border-error text-error bg-error/5 shadow-[4px_4px_0px_0px_rgba(232,80,80,0.2)]'
                      : 'border-tertiary text-tertiary bg-tertiary/5 shadow-[4px_4px_0px_0px_rgba(0,146,70,0.2)]'
                }`}>
                  {isPast(selectedEvent.dateEnd) 
                    ? t('events.pastEvent') 
                    : isOngoing(selectedEvent.dateStart, selectedEvent.dateEnd)
                      ? t('events.todayEvent')
                      : t('events.upcoming')}
                </span>
                <span className="font-headline font-black text-lg uppercase tracking-widest text-primary/40 border-l-4 border-primary/20 pl-6">
                  {formatDateRange(selectedEvent.dateStart, selectedEvent.dateEnd, monthNames)}
                </span>
              </div>

              <h2 className="text-5xl md:text-8xl font-display font-black tracking-tighter text-primary leading-[0.85] mb-12 uppercase">
                {(lang === 'it' && selectedEvent.titleIt) ? selectedEvent.titleIt : selectedEvent.title}
              </h2>

              <div className="grid lg:grid-cols-[1fr_320px] gap-16">
                <div className="space-y-12">
                  <div className="relative">
                    <div className="absolute -left-8 top-0 w-2 h-full bg-secondary/20" />
                    <p className="font-body text-xl md:text-3xl text-primary font-bold leading-[1.3] tracking-tight">
                      {lang === 'it' && selectedEvent.descriptionIt ? selectedEvent.descriptionIt : selectedEvent.description}
                    </p>
                  </div>

                  <div className="pt-8 border-t-4 border-primary/5">
                    <h4 className="font-headline font-black text-sm uppercase tracking-[0.3em] text-secondary mb-6">
                      {t('events.highlights')}
                    </h4>
                    <div className="flex flex-wrap gap-4">
                      {selectedEvent.highlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-3 bg-surface border-4 border-primary px-5 py-3 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-all group/item">
                          <span className="w-2 h-2 rounded-full bg-secondary group-hover/item:bg-white animate-pulse-soft" />
                          <span className="font-headline font-black text-xs md:text-sm uppercase tracking-wider">
                            {h}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="bg-primary/5 border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full translate-x-12 -translate-y-12" />
                    
                    <div className="relative z-10 space-y-8">
                      <div>
                        <h4 className="font-headline font-black text-xs uppercase tracking-[0.2em] text-primary/40 mb-4">
                          {t('events.where')}
                        </h4>
                        <div className="flex items-start gap-4">
                          <span className="material-symbols-outlined text-primary text-3xl">location_on</span>
                          <div>
                            <div className="font-display font-black text-2xl text-primary uppercase leading-none mb-2">
                              {towns.find(t => t.id === selectedEvent.cityId)?.name || selectedEvent.cityId}
                            </div>
                            <div className="font-headline font-bold text-sm text-on-surface-variant uppercase tracking-wide opacity-60">
                              {selectedEvent.venue}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t-2 border-primary/10">
                        <h4 className="font-headline font-black text-xs uppercase tracking-[0.2em] text-primary/40 mb-4">
                          {t('events.when')}
                        </h4>
                        <div className="flex items-start gap-4">
                          <span className="material-symbols-outlined text-primary text-3xl">calendar_today</span>
                          <div>
                            <div className="font-display font-black text-2xl text-primary uppercase leading-none mb-2">
                              {formatDateRange(selectedEvent.dateStart, selectedEvent.dateEnd, monthNames)}
                            </div>
                            <div className="font-headline font-bold text-sm text-on-surface-variant uppercase tracking-wide opacity-60">
                              {getDayName(selectedEvent.dateStart, lang)} — {getDayName(selectedEvent.dateEnd, lang)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="w-full font-headline font-black text-base uppercase tracking-[0.2em] py-6 bg-primary text-on-primary border-4 border-primary shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:text-primary transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    {t('events.closeDetails')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
