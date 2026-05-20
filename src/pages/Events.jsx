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
  const featured = [...ongoing, ...upcoming][0] || null;
  const otherEvents = sorted.filter(e => e.id !== featured?.id);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-7xl mx-auto w-full">
      <header className="mb-14 border-b-4 border-primary pb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-3 h-3 rounded-full bg-primary animate-pulse-soft" />
              <span className="font-headline font-bold text-sm uppercase tracking-widest text-primary">
                {t('events.discoverMore')}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight leading-[1.05] text-primary">
              {t('events.title')}
            </h1>
            <p className="text-lg md:text-xl font-body text-on-surface-variant mt-4 max-w-3xl leading-relaxed">
              {t('events.subtitle')}
            </p>
          </div>
        </div>
      </header>

      {featured && (
        <section className="mb-20">
          <div className="relative bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] overflow-hidden group cursor-default">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(200,76,9,0.06) 0%, transparent 60%)',
              }} />
            </div>
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

                <p className="font-body text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-3xl">
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
                  className={`group relative bg-surface border-4 overflow-hidden cursor-default ${
                    evIsOngoing
                      ? 'border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]'
                      : 'border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]'
                  } hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-all`}
                >
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
    </div>
  );
}
