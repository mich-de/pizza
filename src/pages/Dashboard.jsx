import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import { StatCard } from '../components/ui';
import { groupByCity } from '../utils/groupByCity';

function timeAgo(timestamp, t) {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('common.justNow') || 'adesso';
  if (mins < 60) return `${mins} ${t('common.minsAgo')}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${t('common.hrsAgo')}`;
  const days = Math.floor(hrs / 24);
  return `${days} ${days === 1 ? t('common.dayAgo') : t('common.daysAgo')}`;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Dashboard() {
  const { data, loading, error } = useStitchedData();
  const { t, lang } = useI18n();
  const [reviews, setReviews] = useState([]);
  const [revLoading, setRevLoading] = useState(true);
  const [expandedCity, setExpandedCity] = useState(null);
  const [selectedPizzeria, setSelectedPizzeria] = useState(null);

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
        <div className="bg-surface border border-outline-variant rounded-sm p-8 max-w-lg text-center">
          <span className="material-symbols-outlined text-5xl text-error mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <h2 className="font-display font-bold text-xl text-error mb-2">{t('dashboard.loadError')}</h2>
          <p className="font-body text-on-surface-variant">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-primary text-on-primary font-label font-semibold tracking-wider px-6 py-3 rounded-sm hover:opacity-90 transition-opacity"
          >
            {t('dashboard.retry')}
          </button>
        </div>
      </div>
    );
  }

  const grouped = groupByCity(data);
  const sorted = [...data]
    .filter((d) => d.margheritaPrice != null)
    .sort((a, b) => a.margheritaPrice - b.margheritaPrice);
  const bestPick = sorted[0] || { name: '—', cityName: '—', margheritaPrice: 0, rating: 0 };

  const newOpenings = data.filter((d) => d.isNew === true);

  const globalMin = sorted.length > 0 ? sorted[0].margheritaPrice : 0;
  const globalMax = sorted.length > 0 ? sorted[sorted.length - 1].margheritaPrice : 0;
  const globalAvg = data.length > 0 ? data.reduce((s, p) => s + (p.margheritaPrice || 0), 0) / data.length : 0;

  return (
    <div className="max-w-7xl mx-auto w-full">
      <header className="relative overflow-hidden">
        <div className="relative w-full aspect-[21/9] md:max-h-[500px]">
          <img src="/images/header.png" alt="PizzaRadar Sorrentum" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(200,76,9,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(200,76,9,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }} />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="animate-slide-up">
                <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight leading-[1.1] text-primary drop-shadow-sm">
                  {t('dashboard.title')}
                </h1>
                <p className="text-base font-body text-on-surface-variant mt-2 max-w-xl leading-relaxed">
                  {t('dashboard.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-surface border-b border-outline-variant">
          <div className="px-6 md:px-12 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-label">
            <span className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>local_pizza</span>
              <span className="font-semibold">{data.length}</span>
              <span className="text-on-surface-variant">{t('dashboard.totalPizzerias')}</span>
            </span>
            <span className="w-px h-4 bg-outline-variant hidden sm:block" />
            <span className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-lg">location_city</span>
              <span className="font-semibold">{Object.keys(grouped).length}</span>
              <span className="text-on-surface-variant">{t('dashboard.citiesCount')}</span>
            </span>
            <span className="w-px h-4 bg-outline-variant hidden sm:block" />
            <span className="flex items-center gap-2">
              <span className="text-primary font-semibold">{t('common.euro')}{globalMin.toFixed(2)}</span>
              <span className="text-on-surface-variant">–</span>
              <span className="text-primary font-semibold">{t('common.euro')}{globalMax.toFixed(2)}</span>
              <span className="text-on-surface-variant text-xs"></span>
            </span>
            <span className="w-px h-4 bg-outline-variant hidden sm:block" />
            <span className="flex items-center gap-2">
              <span className="text-on-surface-variant text-xs">{t('dashboard.avgPrice')}</span>
              <span className="font-semibold text-primary">{t('common.euro')}{globalAvg.toFixed(2)}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="p-6 md:p-12 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          <StatCard title={t('dashboard.totalPizzerias')} value={data.length} icon="local_pizza" color="primary" />
          <StatCard title={t('dashboard.citiesCount')} value={Object.keys(grouped).length} icon="location_city" color="primaryContainer" />
          <StatCard title={t('dashboard.avgPrice')} value={`${t('common.euro')}${globalAvg.toFixed(2)}`} icon="trending_up" color="tertiary" />
          <StatCard title={t('dashboard.priceRange')} value={`${t('common.euro')}${globalMin.toFixed(2)} – ${t('common.euro')}${globalMax.toFixed(2)}`} icon="swap_vert" color="primary" subtitle={`${t('dashboard.bestPrice')}: ${bestPick.name.slice(0, 20)}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <section className="relative overflow-hidden rounded-sm animate-slide-up">
              <div className="bg-primary-container border border-primary/30 rounded-sm p-6 md:p-8 relative">
                <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.07] rounded-full -translate-y-1/3 translate-x-1/3"
                  style={{ background: 'radial-gradient(circle, #C84C09, transparent)' }} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-2 bg-primary text-on-primary px-3 py-1 font-label font-semibold text-xs tracking-wider rounded-sm mb-4">
                        <span className="material-symbols-outlined text-sm">emoji_events</span>
                        {t('dashboard.topPick')}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-display font-bold leading-tight text-primary">
                        {t('dashboard.bestQualityPrice')}
                      </h2>
                      <p className="text-lg font-label font-medium text-primary/70 mt-1 mb-5">
                        {bestPick.name} — {bestPick.cityName}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs font-label font-semibold tracking-wider text-primary/60 mb-1">{t('dashboard.margheritaLabel')}</div>
                      <div className="font-display font-bold text-4xl md:text-5xl text-primary leading-none">
                        {bestPick.margheritaPrice > 0 ? `${t('common.euro')}${bestPick.margheritaPrice.toFixed(2)}` : '—'}
                      </div>
                      <div className="flex justify-end mt-2 text-primary/80">
                        {Array.from({ length: 5 }, (_, i) => {
                          const full = Math.floor(bestPick.rating);
                          const frac = bestPick.rating - full;
                          let iconName = 'star_border';
                          if (i < full) iconName = 'star';
                          else if (i === full && frac >= 0.5) iconName = 'star_half';
                          return (
                            <span key={i} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {iconName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-primary/20 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="font-label text-xs text-on-surface-variant">{t('dashboard.totalPizzerias')}</span>
                        <p className="font-display font-bold text-lg text-primary">{data.length}</p>
                      </div>
                      <div>
                        <span className="font-label text-xs text-on-surface-variant">{t('dashboard.avgPrice')}</span>
                        <p className="font-display font-bold text-lg text-primary">{t('common.euro')}{globalAvg.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="font-label text-xs text-on-surface-variant">{t('dashboard.priceRange')}</span>
                        <p className="font-display font-bold text-lg text-primary">{t('common.euro')}{globalMin.toFixed(2)} – {t('common.euro')}{globalMax.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {newOpenings.length > 0 && (
              <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-2xl text-tertiary">auto_awesome</span>
                  <h3 className="text-2xl font-display font-bold">{t('newOpenings.title')}</h3>
                  <span className="ml-auto bg-tertiary/10 text-tertiary px-2.5 py-0.5 font-label font-semibold text-xs tracking-wider rounded-sm">
                    {newOpenings.length} {newOpenings.length === 1 ? t('dashboard.newOpeningSingular') : t('dashboard.newOpeningPlural')}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {newOpenings.map((pz, idx) => (
                    <div key={pz.id} className="bg-surface border border-outline-variant rounded-sm p-5 hover-lift relative overflow-hidden group"
                      style={{ animationDelay: `${0.15 + idx * 0.08}s` }}>
                      <div className="absolute top-0 right-0 w-16 h-16 bg-tertiary/10 rounded-full -translate-y-1/3 translate-x-1/3" />
                      <div className="absolute top-3 right-3 z-10">
                        <span className="material-symbols-outlined text-lg text-tertiary/60" style={{ fontVariationSettings: "'FILL' 1" }}>fiber_new</span>
                      </div>
                      <div className="relative z-10">
                        <div className="inline-block bg-tertiary/10 text-tertiary px-2 py-0.5 font-label font-semibold text-[11px] tracking-wider rounded-sm mb-3">
                          {t('months.' + (pz.openedAt ? pz.openedAt.slice(5, 7) : '01'))} {pz.openedAt ? pz.openedAt.slice(0, 4) : ''}
                        </div>
                        <h4 className="font-display font-bold text-lg mb-1 leading-tight group-hover:text-tertiary transition-colors">{pz.name}</h4>
                        <p className="text-sm font-body text-on-surface-variant mb-3">
                          {pz.frazione ? `${pz.frazione}, ${pz.cityName}` : pz.cityName}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="bg-background border border-outline-variant rounded-sm px-3 py-1 font-label font-semibold text-base">
                              {t('common.euro')}{(pz.margheritaPrice || 0).toFixed(2)}
                            </span>
                            <span className="flex items-center gap-1 text-primary/70">
                              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              <span className="font-label font-medium text-sm">{pz.rating}</span>
                            </span>
                          </div>
                          <span className="text-[11px] font-label font-medium text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded-sm">
                            {t(`common.${pz.category === 'gourmet' ? 'gourmet' : 'traditional'}`)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <h3 className="text-2xl font-display font-bold border-b border-outline-variant pb-2 mb-6 inline-block">{t('dashboard.cheapestByTown')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Object.entries(grouped).map(([city, pizzerias], cityIdx) => {
                  const cityPrices = pizzerias.map(p => p.margheritaPrice || 0);
                  const cityMin = Math.min(...cityPrices);
                  const cityMax = Math.max(...cityPrices);
                  const cityAvg = cityPrices.reduce((s, p) => s + p, 0) / cityPrices.length;
                  return (
                    <div key={city}
                      onClick={() => setExpandedCity(expandedCity === city ? null : city)}
                      className={`bg-surface border border-outline-variant rounded-sm p-5 ${pizzerias.length > 4 ? 'cursor-pointer' : ''} hover-lift group transition-all`
                        + (expandedCity === city ? ' ring-2 ring-primary' : '')}
                      style={{ animationDelay: `${0.2 + cityIdx * 0.08}s` }}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-display font-bold text-xl group-hover:text-primary transition-colors">{city}</h4>
                        <div className="flex items-center gap-2">
                          <span className="font-label text-xs text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded-sm">
                            {pizzerias.length} {t('network.pizzerias')}
                          </span>
                          {pizzerias.length > 4 && (
                            <span className="material-symbols-outlined text-base text-on-surface-variant transition-transform"
                              style={{ transform: expandedCity === city ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                              expand_more
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mb-4 text-xs font-label text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-tertiary" />
                          {t('common.euro')}{cityMin.toFixed(2)}
                        </span>
                        <span className="flex-1 h-1.5 rounded-full bg-surface-variant overflow-hidden">
                          <span className="h-full rounded-full bg-gradient-to-r from-tertiary via-primary to-secondary block"
                            style={{ width: `${cityMin > 0 && globalMax > globalMin ? ((cityAvg - globalMin) / (globalMax - globalMin)) * 100 : 50}%` }} />
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-secondary" />
                          {t('common.euro')}{cityMax.toFixed(2)}
                        </span>
                      </div>
                      <ul className="space-y-2 font-body text-sm">
                        {(expandedCity === city ? pizzerias : pizzerias.slice(0, 4)).map((pz, idx) => {
                          const pct = globalMax > globalMin ? ((pz.margheritaPrice || 0) - globalMin) / (globalMax - globalMin) * 100 : 50;
                          const isLast = idx < (expandedCity === city ? pizzerias.length : Math.min(pizzerias.length, 4)) - 1;
                          return (
                            <li key={pz.id} className={`flex justify-between items-center gap-3 ${isLast ? 'border-b border-outline-variant pb-2' : ''}${expandedCity === city ? ' animate-slide-up' : ''}`}
                              style={expandedCity === city && idx >= 4 ? { animationDelay: `${(idx - 4) * 0.03}s` } : {}}>
                              <span onClick={() => setSelectedPizzeria(pz)}
                                className="text-on-surface-variant truncate flex-1 cursor-pointer hover:text-primary transition-colors">{pz.name}</span>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="w-16 h-1.5 bg-surface-variant rounded-full overflow-hidden hidden md:block">
                                  <div className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, pct))}%`,
                                      background: pct < 33 ? '#5C7A3E' : pct < 66 ? '#C84C09' : '#A03030',
                                    }} />
                                </div>
                                <span className="font-label font-semibold text-sm w-14 text-right">{t('common.euro')}{(pz.margheritaPrice || 0).toFixed(2)}</span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      {pizzerias.length > 4 && expandedCity !== city && (
                        <p className="text-xs font-label text-on-surface-variant text-center mt-3 opacity-70">
                          {t('dashboard.expandMore', { count: pizzerias.length - 4 })}
                        </p>
                      )}
                      {expandedCity === city && pizzerias.length > 4 && (
                        <p onClick={(e) => { e.stopPropagation(); setExpandedCity(null); }}
                          className="text-xs font-label text-primary text-center mt-3 cursor-pointer hover:underline">
                          {t('dashboard.reduce')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-primary text-on-primary rounded-sm border border-primary/30 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="p-5 border-b border-on-primary/15">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-display font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>reviews</span>
                    {t('dashboard.latestReviews')}
                  </h3>
                  <span className="text-[11px] font-label font-semibold text-on-primary/60 bg-on-primary/10 px-2 py-0.5 rounded-sm">
                    {reviews.length} {reviews.length === 1 ? t('dashboard.reviewSingular') : t('dashboard.reviewPlural')}
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto">
                {revLoading ? (
                  <p className="font-label text-sm text-on-primary/60 animate-pulse">{t('common.loading')}</p>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-3xl text-on-primary/30 mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble_outline</span>
                    <p className="font-label text-sm text-on-primary/50">{t('dashboard.noReviews')}</p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="bg-surface/10 border border-on-primary/10 rounded-sm p-4 hover:bg-surface/15 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-on-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-label font-bold text-on-primary/80">
                          {getInitials(rev.author)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-label font-semibold text-sm text-on-primary/90 truncate">{rev.author}</span>
                            {rev.rating && <span className="bg-on-primary/15 text-on-primary px-1.5 py-0.5 font-label font-semibold text-[10px] rounded-sm flex-shrink-0">{rev.rating}/10</span>}
                          </div>
                          <p className="font-body text-sm text-on-primary/80 leading-relaxed">{rev.content}</p>
                          <p className="text-[10px] font-label font-medium text-on-primary/40 mt-1.5">{timeAgo(rev.createdAt || rev.timestamp, t)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-surface border border-outline-variant rounded-sm p-5 animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <h4 className="font-label font-semibold text-xs uppercase tracking-wider text-on-surface-variant mb-4">
                {t('dashboard.priceRange') || 'Distribuzione Prezzi'}
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-label text-on-surface-variant mb-1">
                    <span>{t('common.euro')}{globalMin.toFixed(2)}</span>
                    <span>{t('dashboard.avgPrice')}: {t('common.euro')}{globalAvg.toFixed(2)}</span>
                    <span>{t('common.euro')}{globalMax.toFixed(2)}</span>
                  </div>
                  <div className="h-2.5 bg-surface-variant rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-tertiary via-primary to-secondary relative"
                      style={{ width: '100%' }}>
                      <div className="absolute top-0 bottom-0 w-1 bg-white rounded-full opacity-70"
                        style={{ left: `${globalMax > globalMin ? ((globalAvg - globalMin) / (globalMax - globalMin)) * 100 : 50}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] font-label text-on-surface-variant mt-1">
                    <span>{t('dashboard.bestPrice')}: {bestPick.name.slice(0, 18)}</span>
                    <span>{t('dashboard.median')}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-outline-variant">
                  <div className="text-xs font-label font-semibold text-on-surface-variant mb-2">{t('dashboard.cheapestByTown')}</div>
                  {Object.entries(grouped)
                    .sort(([, a], [, b]) => {
                      const aMin = Math.min(...a.map(p => p.margheritaPrice || 0));
                      const bMin = Math.min(...b.map(p => p.margheritaPrice || 0));
                      return aMin - bMin;
                    })
                    .slice(0, 6)
                    .map(([city, pizzerias]) => {
                      const cityCheapest = [...pizzerias].sort((a, b) => (a.margheritaPrice || 0) - (b.margheritaPrice || 0))[0];
                      return (
                        <div key={city} className="flex items-center justify-between py-1.5 border-b border-outline-variant/50 last:border-b-0">
                          <span className="font-body text-sm text-on-surface-variant truncate flex-1">{city}</span>
                          <span className="font-label font-semibold text-sm text-primary">{t('common.euro')}{(cityCheapest?.margheritaPrice || 0).toFixed(2)}</span>
                          <span className="text-[10px] font-label text-on-surface-variant ml-2 truncate max-w-[80px]">{cityCheapest?.name}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedPizzeria && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedPizzeria(null); }}
        >
          <div className="bg-background border border-outline-variant rounded-sm w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-outline-variant">
              <h2 className="font-display font-bold text-xl text-primary">{t('prices.detailTitle')}</h2>
              <button onClick={() => setSelectedPizzeria(null)} className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-surface-variant transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <h3 className="text-2xl font-display font-bold text-primary">{selectedPizzeria.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="bg-primary/10 text-primary font-label font-semibold text-xs px-2 py-0.5 rounded-sm uppercase tracking-wider">
                    {t(`common.${selectedPizzeria.category === 'gourmet' ? 'gourmet' : selectedPizzeria.category === 'wood-fired' ? 'woodFired' : 'traditional'}`)}
                  </span>
                  <span className="flex items-center gap-1 text-primary/70">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-label font-semibold">{selectedPizzeria.rating}</span>
                  </span>
                  <span className="text-xs font-label text-on-surface-variant">{selectedPizzeria.cityName}</span>
                </div>
              </div>

              {selectedPizzeria.description && (
                <div>
                  <div className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t('prices.description')}</div>
                  <p className="font-body text-sm text-primary">{lang === 'it' ? (selectedPizzeria.descriptionIt || selectedPizzeria.description) : selectedPizzeria.description}</p>
                </div>
              )}

              <div className="bg-surface-variant border border-outline-variant rounded-sm p-4">
                <div className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t('prices.address')}</div>
                <p className="font-body font-semibold text-primary">{selectedPizzeria.address || '—'}</p>
                {selectedPizzeria.frazione && (
                  <p className="font-body text-sm text-on-surface-variant mt-0.5">{selectedPizzeria.frazione}</p>
                )}
              </div>

              <div className="bg-primary-container border border-primary/30 rounded-sm p-5 text-center">
                <div className="font-label text-xs font-semibold uppercase tracking-wider text-primary/70 mb-1">🍕 {t('prices.margherita')}</div>
                <div className="font-display font-bold text-4xl text-primary">{t('common.euro')}{(selectedPizzeria.margheritaPrice || 0).toFixed(2)}</div>
              </div>

              <div className="flex gap-3">
                {selectedPizzeria.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPizzeria.name + ' ' + selectedPizzeria.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary font-label font-semibold text-sm py-3 rounded-sm hover:opacity-90 transition-opacity">
                    <span className="material-symbols-outlined text-lg">map</span>
                    {t('dashboard.maps')}
                  </a>
                )}
                <button onClick={() => setSelectedPizzeria(null)}
                  className="flex-1 flex items-center justify-center gap-2 bg-surface text-primary font-label font-semibold text-sm py-3 rounded-sm border border-outline-variant hover:bg-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-lg">close</span>
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
