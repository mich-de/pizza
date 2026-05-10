import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import { StatCard, Card } from '../components/ui';
import { groupByCity } from '../utils/groupByCity';

function timeAgo(timestamp, t) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} ${t('common.minsAgo')}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${t('common.hrsAgo')}`;
  const days = Math.floor(hrs / 24);
  return `${days} ${days === 1 ? t('common.dayAgo') : t('common.daysAgo')}`;
}

export default function Dashboard() {
  const { data, loading, error } = useStitchedData();
  const { t } = useI18n();
  const [reviews, setReviews] = useState([]);
  const [revLoading, setRevLoading] = useState(true);

  useEffect(() => {
    fetch('/api/comments?type=review')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const sorted = data.sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));
        setReviews(sorted.slice(0, 10));
      })
      .catch(() => setReviews([]))
      .finally(() => setRevLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  if (error) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-[60vh]">
        <Card variant="surface" className="p-8 max-w-lg text-center">
          <span className="material-symbols-outlined text-5xl text-error mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <h2 className="font-headline font-black uppercase text-xl text-error mb-2">Errore caricamento dati</h2>
          <p className="font-body text-on-surface-variant">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-primary text-on-primary font-headline font-bold uppercase px-6 py-3 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary transition-colors"
          >
            Riprova
          </button>
        </Card>
      </div>
    );
  }

  const grouped = groupByCity(data);
  const cheapest = [...data]
    .filter((d) => d.margheritaPrice != null)
    .sort((a, b) => a.margheritaPrice - b.margheritaPrice);
  const bestPick = cheapest[0] || { name: '—', cityName: '—', margheritaPrice: 0, rating: 0 };

  const newOpenings = data.filter((d) => d.isNew === true);

  const globalMin = cheapest.length > 0 ? Math.min(...cheapest.map(c => c.margheritaPrice)) : 0;
  const globalMax = cheapest.length > 0 ? Math.max(...cheapest.map(c => c.margheritaPrice)) : 0;
  const globalAvg = data.length > 0 ? data.reduce((s, p) => s + (p.margheritaPrice || 0), 0) / data.length : 0;

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto w-full">
      <header className="mb-8 border-b-4 border-primary pb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase leading-none">
              {t('dashboard.title')}
            </h1>
            <p className="text-lg font-bold text-on-surface-variant mt-3 max-w-xl">
              {t('dashboard.subtitle')}
            </p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-6 bg-secondary-container border-2 border-primary px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">local_pizza</span>
            <span className="font-headline font-bold uppercase text-sm">{t('dashboard.stats', { pizzerias: data.length, cities: Object.keys(grouped).length })}</span>
          </div>
          <div className="w-px h-4 bg-primary/30" />
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">euro</span>
            <span className="font-headline font-bold uppercase text-sm">
              {cheapest.length > 0 ? `da €${globalMin.toFixed(2)} a €${globalMax.toFixed(2)}` : '—'}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title={t('dashboard.totalPizzerias') || 'Pizzerie'} value={data.length} icon="local_pizza" color="primary" />
        <StatCard title={t('dashboard.citiesCount') || 'Città'} value={Object.keys(grouped).length} icon="location_city" color="primaryContainer" />
        <StatCard title={t('dashboard.avgPrice') || 'Prezzo Medio Margherita'} value={`€${globalAvg.toFixed(2)}`} icon="local_pizza" color="tertiary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-8">
          <section className="bg-primary-container border-4 border-primary p-8 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary translate-x-16 -translate-y-16 rotate-45" />
            <div className="relative z-10">
              <div className="inline-block bg-primary text-on-primary px-3 py-1 font-headline font-bold uppercase text-sm mb-4 border-2 border-primary">
                {t('dashboard.topPick')}
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-black mb-2 uppercase leading-tight">
                {t('dashboard.bestQualityPrice')}
              </h2>
              <p className="text-xl font-bold mb-6 opacity-90 font-headline uppercase">
                {bestPick.name} - {bestPick.cityName}
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="bg-surface border-4 border-primary px-4 py-2 font-headline font-bold text-2xl">
                  <span className="text-sm font-label font-bold uppercase tracking-widest text-on-surface-variant block mb-0.5">Margherita</span>
                  {bestPick.margheritaPrice > 0 ? `${t('common.euro')}${bestPick.margheritaPrice.toFixed(2)}` : '—'}
                </div>
                <div className="flex text-primary">
                  {Array.from({ length: 5 }, (_, i) => {
                    const full = Math.floor(bestPick.rating);
                    const frac = bestPick.rating - full;
                    let iconName = 'star_border';
                    if (i < full) iconName = 'star';
                    else if (i === full && frac >= 0.5) iconName = 'star_half';
                    return (
                      <span key={i} className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {iconName}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {newOpenings.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-3xl text-tertiary">auto_awesome</span>
                <h3 className="text-3xl font-display font-black uppercase inline-block">{t('newOpenings.title')}</h3>
                <span className="ml-auto bg-tertiary text-on-tertiary px-3 py-1 font-headline font-bold uppercase text-xs border-2 border-primary">
                  {newOpenings.length} {newOpenings.length === 1 ? 'nuova' : 'nuove'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {newOpenings.map((pz) => (
                  <div key={pz.id} className="bg-primary-container border-4 border-primary p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 transition-transform relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-tertiary translate-x-10 -translate-y-10 rotate-45" />
                    <div className="absolute top-2 right-2 z-10">
                      <span className="material-symbols-outlined text-xl text-on-tertiary">fiber_new</span>
                    </div>
                    <div className="relative z-10">
                      <div className="inline-block bg-tertiary text-on-tertiary px-2 py-1 font-headline font-bold uppercase text-xs mb-3 border-2 border-primary">
                        {t('months.' + (pz.openedAt ? pz.openedAt.slice(5, 7) : '01'))} {pz.openedAt ? pz.openedAt.slice(0, 4) : ''}
                      </div>
                      <h4 className="font-display font-black text-xl uppercase mb-1 leading-tight group-hover:text-tertiary transition-colors">{pz.name}</h4>
                      <p className="text-sm font-body font-medium text-on-surface-variant mb-3">
                        {pz.frazione ? `${pz.frazione}, ${pz.cityName}` : pz.cityName}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="bg-surface border-2 border-primary px-3 py-1 font-headline font-bold text-lg">
                            {t('common.euro')}{(pz.margheritaPrice || 0).toFixed(2)}
                          </span>
                          <span className="flex text-primary">
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="font-headline font-bold text-sm ml-1">{pz.rating}</span>
                          </span>
                        </div>
                        <span className="text-xs font-headline font-bold uppercase text-on-surface-variant bg-surface px-2 py-1 border border-primary">
                          {t(`common.${pz.category === 'gourmet' ? 'gourmet' : 'traditional'}`)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-3xl font-display font-black uppercase border-b-4 border-primary mb-6 pb-2 inline-block">{t('dashboard.cheapestByTown')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(grouped).map(([city, pizzerias]) => (
                <div key={city} className="bg-surface border-4 border-primary p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:bg-surface-variant transition-colors cursor-pointer group">
                  <h4 className="font-display font-black text-2xl uppercase mb-4 group-hover:text-tertiary transition-colors">{city}</h4>
                  <ul className="space-y-3 font-body font-medium">
                    {pizzerias.slice(0, 3).map((pz, idx) => (
                      <li key={pz.id} className={`flex justify-between items-center ${idx < Math.min(pizzerias.length, 3) - 1 ? 'border-b-2 border-primary pb-2' : ''}`}>
                        <span>{pz.name}</span>
                        <span className="font-headline font-bold text-lg">{t('common.euro')}{(pz.margheritaPrice || 0).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-primary text-on-primary border-4 border-primary h-full shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] p-6 flex flex-col">
            <h3 className="text-3xl font-display font-black uppercase mb-8 border-b-4 border-on-primary pb-4">{t('dashboard.latestReviews')}</h3>
            <div className="flex-1 space-y-6 overflow-y-auto max-h-[600px]">
              {revLoading ? (
                <p className="font-label text-sm text-on-primary/50">{t('common.loading')}</p>
              ) : reviews.length === 0 ? (
                <p className="font-label text-sm text-on-primary/50">Nessuna recensione</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="bg-surface text-on-surface border-4 border-primary p-4 hover:-translate-y-1 transition-transform">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-headline font-bold uppercase text-sm">{rev.author}</span>
                      {rev.rating && <span className="bg-primary-container text-primary px-2 py-1 font-bold border-2 border-primary text-sm">{rev.rating}/10</span>}
                    </div>
                    <p className="font-body text-sm mb-2">{rev.content}</p>
                    <p className="text-xs uppercase font-bold text-on-surface-variant">{timeAgo(rev.createdAt || rev.timestamp, t)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
