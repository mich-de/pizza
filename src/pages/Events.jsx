import { useState, useEffect } from 'react';
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

  const monthNames = {
    '01': t('months.01'), '02': t('months.02'), '03': t('months.03'),
    '04': t('months.04'), '05': t('months.05'), '06': t('months.06'),
    '07': t('months.07'), '08': t('months.08'), '09': t('months.09'),
    '10': t('months.10'), '11': t('months.11'), '12': t('months.12'),
  };

  const sorted = [...events].sort((a, b) => new Date(a.dateStart) - new Date(b.dateStart));
  const ongoing = sorted.filter(e => isOngoing(e.dateStart, e.dateEnd));
  const upcoming = sorted.filter(e => !isPast(e.dateEnd) && !isOngoing(e.dateStart, e.dateEnd));
  const past = sorted.filter(e => isPast(e.dateEnd));

  const featured = [...ongoing, ...upcoming][0] || null;
  const otherEvents = sorted.filter(e => e.id !== featured?.id);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-7xl mx-auto w-full">
      <header className="mb-10 border-b border-outline-variant pb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
              <span className="font-label text-[11px] font-semibold uppercase tracking-widest text-primary">
                {t('events.discoverMore')}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.05] text-primary">
              {t('events.title')}
            </h1>
            <p className="text-base font-body text-on-surface-variant mt-3 max-w-2xl leading-relaxed">
              {t('events.subtitle')}
            </p>
          </div>
        </div>
      </header>

      {featured && (
        <section className="mb-16">
          <div className="relative bg-surface border-2 border-primary/20 rounded-sm overflow-hidden group hover-lift cursor-default">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(200,76,9,0.04) 0%, transparent 60%)',
              }} />
            </div>
            <div className="relative grid md:grid-cols-[1fr_auto] gap-6 p-6 md:p-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {isOngoing(featured.dateStart, featured.dateEnd) ? (
                    <span className="inline-flex items-center gap-1.5 bg-error/10 text-error font-label font-semibold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
                      {t('events.todayEvent')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-tertiary/10 text-tertiary font-label font-semibold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse-soft" />
                      {t('events.upcoming')}
                    </span>
                  )}
                  <span className="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/50">
                    {formatDateRange(featured.dateStart, featured.dateEnd, monthNames)}
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface leading-tight">
                  {(lang === 'it' && featured.titleIt) ? featured.titleIt : featured.title}
                </h2>

                <p className="font-body text-sm md:text-base text-on-surface-variant leading-relaxed max-w-2xl">
                  {lang === 'it' && featured.descriptionIt ? featured.descriptionIt : featured.description}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {featured.highlights.map((h, i) => (
                    <span key={i} className="font-label text-[10px] font-semibold uppercase tracking-wider bg-primary/8 text-primary/80 border border-primary/15 px-2.5 py-1 rounded-sm">
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center md:border-l md:border-outline-variant md:pl-8">
                <div className="text-center">
                  <div className="font-label text-[10px] font-semibold uppercase tracking-widest text-primary/60 mb-1">
                    {getMonthAbbr(featured.dateStart, monthNames)}
                  </div>
                  <div className="text-6xl md:text-7xl font-display font-bold text-primary leading-none tracking-tight">
                    {getDayNum(featured.dateStart)}
                  </div>
                  <div className="font-label text-xs text-on-surface-variant/60 mt-1">
                    {getDayName(featured.dateStart, lang)}
                  </div>
                  <div className="mt-3 pt-3 border-t border-outline-variant">
                    <div className="flex items-center gap-1.5 justify-center text-on-surface-variant/60">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      <span className="font-label text-[10px] font-semibold uppercase tracking-wider">
                        {towns.find(t => t.id === featured.cityId)?.name || featured.cityId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-0.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          </div>
        </section>
      )}

      {otherEvents.length > 0 && (
        <section>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {otherEvents.map(event => {
              const evIsPast = isPast(event.dateEnd);
              const evIsOngoing = isOngoing(event.dateStart, event.dateEnd);
              const town = towns.find(t => t.id === event.cityId);
              const title = (lang === 'it' && event.titleIt) ? event.titleIt : event.title;
              const desc = (lang === 'it' && event.descriptionIt) ? event.descriptionIt : event.description;

              return (
                <div
                  key={event.id}
                  className={`group relative bg-surface border rounded-sm overflow-hidden hover-lift cursor-default ${
                    evIsOngoing ? 'border-primary/40 ring-1 ring-primary/20' : 'border-outline-variant'
                  }`}
                >
                  {evIsPast && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="font-label text-[9px] font-semibold uppercase tracking-widest text-on-surface-variant/30 bg-surface px-2 py-0.5 rounded-sm border border-outline-variant/50">
                        {t('events.pastEvent')}
                      </span>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-primary/50 text-sm flex-shrink-0">event</span>
                        <span className="font-label text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50 truncate">
                          {formatDateRange(event.dateStart, event.dateEnd, monthNames)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40">location_on</span>
                        <span className="font-label text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50">
                          {town?.name || event.cityId}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="text-center flex-shrink-0 w-12">
                        <div className="font-label text-[9px] font-semibold uppercase tracking-widest text-primary/50">
                          {getMonthAbbr(event.dateStart, monthNames)}
                        </div>
                        <div className="text-3xl font-display font-bold text-primary leading-none">
                          {getDayNum(event.dateStart)}
                        </div>
                        <div className="font-label text-[9px] text-on-surface-variant/40">
                          {getDayName(event.dateStart, lang)}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-bold text-lg leading-tight text-on-surface group-hover:text-primary transition-colors">
                          {title}
                        </h3>
                        <p className="font-body text-xs text-on-surface-variant/70 mt-1.5 leading-relaxed line-clamp-2">
                          {desc}
                        </p>

                        {event.highlights && event.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {event.highlights.slice(0, 3).map((h, i) => (
                              <span key={i} className="font-label text-[8px] font-semibold uppercase tracking-wider bg-primary/5 text-primary/60 px-1.5 py-0.5 rounded-sm">
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {evIsOngoing && (
                    <div className="h-0.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {otherEvents.length === 0 && !featured && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/20" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
          <p className="font-body text-on-surface-variant/50 mt-4">{t('events.noEvents')}</p>
        </div>
      )}
    </div>
  );
}
