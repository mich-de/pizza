import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';

import { groupByCity } from '../utils/groupByCity';

function timeAgo(timestamp, t) {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('common.justNow');
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
      <div className="p-8 md:p-16 flex items-center justify-center min-h-[70vh]">
        <div className="bg-surface border-4 border-error shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] rounded-sm p-10 max-w-xl text-center">
          <span className="material-symbols-outlined text-7xl text-error mb-5 block" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <h2 className="font-display font-bold text-3xl text-error mb-3">{t('dashboard.loadError')}</h2>
          <p className="font-body text-lg text-on-surface-variant leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-error text-on-error font-headline font-bold uppercase tracking-wider px-8 py-4 text-base border-2 border-error shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-opacity-90 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
    <div className="p-6 md:p-12 max-w-7xl mx-auto w-full">
      <header className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] mb-12 overflow-hidden relative group">
        {/* Background Accent */}
        <div className="absolute inset-0 bg-cover bg-center opacity-20 grayscale mix-blend-overlay group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" style={{ backgroundImage: "url('/images/marina-bg.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5" />
        
        <div className="bg-primary text-on-primary p-8 md:p-12 relative z-10 border-b-4 border-primary">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-3 bg-white/20 text-white font-headline font-bold text-xs md:text-sm tracking-[0.2em] uppercase px-4 py-2 mb-6 border border-white/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                <span className="material-symbols-outlined text-sm">radar</span>
                Penisola Sorrentina
                <span className="w-1.5 h-1.5 rounded-full bg-[#009246] animate-ping ml-1" />
              </div>
              <h1 className="font-display font-black text-6xl md:text-8xl lg:text-9xl uppercase tracking-tighter leading-[0.85]">
                Radar<br />Pizza
              </h1>
              <p className="font-display font-black italic text-4xl md:text-6xl text-secondary mt-2">Sorrento</p>
            </div>
            
            <div className="flex-shrink-0 animate-scale-in hidden md:block">
              <div className="relative group">
                <div className="absolute -inset-2 bg-secondary rotate-3 opacity-20 group-hover:rotate-6 transition-transform" />
                <div className="relative w-40 h-40 lg:w-48 lg:h-48 bg-surface border-4 border-white flex items-center justify-center shadow-[10px_10px_0px_0px_rgba(0,0,0,0.3)]">
                  <img src={lang === 'it' ? '/images/logo_ita_transparent.png' : '/images/logo_eng_transparent.png'} alt="Logo" className="w-32 h-32 lg:w-40 lg:h-40 object-contain group-hover:scale-110 transition-transform duration-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-surface/50 backdrop-blur-sm relative z-10">
          <div className="flex flex-wrap gap-8 items-center">
            <div className="flex flex-col">
              <span className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant/60 mb-1">{t('dashboard.pizzerie')}</span>
              <span className="font-display font-black text-4xl text-primary">{data.length}</span>
            </div>
            <div className="w-px h-12 bg-primary/20 hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant/60 mb-1">{t('dashboard.citta')}</span>
              <span className="font-display font-black text-4xl text-primary">{Object.keys(grouped).length}</span>
            </div>
            <div className="w-px h-12 bg-primary/20 hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant/60 mb-1">{t('dashboard.media')}</span>
              <span className="font-display font-black text-4xl text-secondary">€{globalAvg.toFixed(2)}</span>
            </div>
            <div className="ml-auto hidden lg:block max-w-sm border-l-4 border-secondary pl-6">
              <p className="font-headline font-bold text-lg text-primary leading-tight">
                {t('dashboard.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          <div className="bg-surface border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] p-6 md:p-8 relative overflow-hidden group hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-all card-glow">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#009246] to-[#00B050]" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#009246]/10 rounded-bl-full" />
            <div className="font-headline text-xs md:text-sm font-bold uppercase tracking-widest text-[#009246] mb-2">{t('dashboard.totalPizzerias')}</div>
            <div className="font-display font-black text-4xl md:text-5xl text-primary leading-tight stat-hover">{data.length}</div>
            <span className="absolute bottom-4 right-4 md:bottom-6 md:right-6 text-[#009246]/20 text-3xl md:text-4xl material-symbols-outlined group-hover:text-[#009246]/40 group-hover:scale-110 transition-all" style={{ fontVariationSettings: "'FILL' 1" }}>local_pizza</span>
          </div>

          <div className="bg-surface border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] p-6 md:p-8 relative overflow-hidden group hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-all card-glow">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full" />
            <div className="font-headline text-xs md:text-sm font-bold uppercase tracking-widest text-primary mb-2">{t('dashboard.citiesCount')}</div>
            <div className="font-display font-black text-4xl md:text-5xl text-primary leading-tight stat-hover">{Object.keys(grouped).length}</div>
            <span className="absolute bottom-4 right-4 md:bottom-6 md:right-6 text-primary/20 text-3xl md:text-4xl material-symbols-outlined group-hover:text-primary/40 group-hover:scale-110 transition-all">location_city</span>
          </div>

          <div className="bg-surface border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] p-6 md:p-8 relative overflow-hidden group hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-all card-glow">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#CE2B37] to-[#E85050]" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#CE2B37]/10 rounded-bl-full" />
            <div className="font-headline text-xs md:text-sm font-bold uppercase tracking-widest text-[#CE2B37] mb-2">{t('dashboard.avgPrice')}</div>
            <div className="font-display font-black text-4xl md:text-5xl text-primary leading-tight stat-hover">{t('common.euro')}{globalAvg.toFixed(2)}</div>
            <span className="absolute bottom-4 right-4 md:bottom-6 md:right-6 text-[#CE2B37]/20 text-3xl md:text-4xl material-symbols-outlined group-hover:text-[#CE2B37]/40 group-hover:scale-110 transition-all">trending_up</span>
          </div>

          <div className="bg-surface border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] p-6 md:p-8 relative overflow-hidden group hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-all card-glow">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#009246] via-primary to-[#CE2B37]" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full" />
            <div className="font-headline text-xs md:text-sm font-bold uppercase tracking-widest text-primary mb-2">{t('dashboard.priceRange')}</div>
            <div className="font-display font-black text-2xl md:text-3xl text-primary leading-tight mb-1 stat-hover">
              {t('common.euro')}{globalMin.toFixed(2)} – {t('common.euro')}{globalMax.toFixed(2)}
            </div>
            <div className="font-body font-semibold text-sm md:text-base text-on-surface-variant truncate max-w-[80%]">
              {t('dashboard.bestPrice')}: {bestPick.name}
            </div>
            <span className="absolute bottom-4 right-4 md:bottom-6 md:right-6 text-primary/20 text-3xl md:text-4xl material-symbols-outlined group-hover:text-primary/40 group-hover:scale-110 transition-all" style={{ fontVariationSettings: "'FILL' 1" }}>leaderboard</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 flex flex-col gap-10">
            <section className="animate-slide-up">
              <div className="bg-primary border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] p-8 md:p-10 relative">
                <div className="absolute top-0 right-0 w-80 h-80 opacity-[0.08] rounded-full -translate-y-1/3 translate-x-1/3"
                  style={{ background: 'radial-gradient(circle, white, transparent)' }} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-6 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-2 bg-white/20 text-white font-headline font-bold text-sm tracking-wider px-4 py-1.5 mb-5">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                        {t('dashboard.topPick')}
                      </div>
                      <h2 className="text-3xl md:text-4xl font-display font-black leading-tight text-white">
                        {t('dashboard.bestQualityPrice')}
                      </h2>
                      <p className="text-xl md:text-2xl font-headline font-bold text-white/80 mt-2 mb-6">
                        {bestPick.name} — {bestPick.cityName}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="font-headline text-sm font-bold tracking-wider text-white/70 mb-1">{t('dashboard.margheritaLabel')}</div>
                      <div className="font-display font-black text-5xl md:text-6xl text-white leading-none">
                        {bestPick.margheritaPrice > 0 ? `${t('common.euro')}${bestPick.margheritaPrice.toFixed(2)}` : '—'}
                      </div>
                      <div className="flex justify-end mt-3 text-white/90">
                        {Array.from({ length: 5 }, (_, i) => {
                          const full = Math.floor(bestPick.rating);
                          const frac = bestPick.rating - full;
                          let iconName = 'star_border';
                          if (i < full) iconName = 'star';
                          else if (i === full && frac >= 0.5) iconName = 'star_half';
                          return (
                            <span key={i} className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {iconName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/20 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                      <div>
                        <span className="font-headline text-sm font-bold text-white/70">{t('dashboard.totalPizzerias')}</span>
                        <p className="font-display font-black text-2xl text-white">{data.length}</p>
                      </div>
                      <div>
                        <span className="font-headline text-sm font-bold text-white/70">{t('dashboard.avgPrice')}</span>
                        <p className="font-display font-black text-2xl text-white">{t('common.euro')}{globalAvg.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="font-headline text-sm font-bold text-white/70">{t('dashboard.priceRange')}</span>
                        <p className="font-display font-black text-2xl text-white">{t('common.euro')}{globalMin.toFixed(2)} – {t('common.euro')}{globalMax.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {newOpenings.length > 0 && (
              <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-4 mb-8 border-b-4 border-primary pb-4">
                  <span className="material-symbols-outlined text-3xl text-tertiary">auto_awesome</span>
                  <h3 className="text-3xl md:text-4xl font-display font-black uppercase tracking-tight">{t('newOpenings.title')}</h3>
                  <span className="ml-auto bg-tertiary/15 text-tertiary font-headline font-bold text-sm tracking-wider px-3 py-1 border-2 border-tertiary">
                    {newOpenings.length} {newOpenings.length === 1 ? t('dashboard.newOpeningSingular') : t('dashboard.newOpeningPlural')}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {newOpenings.map((pz, idx) => (
                    <div key={pz.id} className="bg-surface border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] p-6 relative overflow-hidden group hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-all"
                      style={{ animationDelay: `${0.15 + idx * 0.08}s` }}>
                      <div className="absolute top-0 right-0 w-20 h-20 bg-tertiary/10 -translate-y-1/3 translate-x-1/3 rounded-full" />
                        {pz.status === 'closed' && (
                          <div className="absolute top-4 left-4 z-10 bg-error text-on-error font-headline font-black text-[10px] uppercase tracking-wider px-2 py-1 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                            {t('explore.closedPermanently')}
                          </div>
                        )}
                        <div className="absolute top-4 right-4 z-10">
                        <span className="material-symbols-outlined text-xl text-tertiary/50" style={{ fontVariationSettings: "'FILL' 1" }}>fiber_new</span>
                      </div>
                      <div className="relative z-10">
                        <div className="inline-block bg-tertiary/15 text-tertiary font-headline font-bold text-xs tracking-wider px-3 py-1 border border-tertiary/30 mb-4">
                          {t('months.' + (pz.openedAt ? pz.openedAt.slice(5, 7) : '01'))} {pz.openedAt ? pz.openedAt.slice(0, 4) : ''}
                        </div>
                        <h4 className="font-display font-black text-xl md:text-2xl mb-2 leading-tight group-hover:text-tertiary transition-colors">{pz.name}</h4>
                        <p className="font-body text-base md:text-lg text-on-surface-variant mb-4">
                          {pz.frazione ? `${pz.frazione}, ${pz.cityName}` : pz.cityName}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="bg-background border-2 border-primary font-display font-bold text-lg px-4 py-1.5">
                              {t('common.euro')}{(pz.margheritaPrice || 0).toFixed(2)}
                            </span>
                            <span className="flex items-center gap-1.5 text-primary">
                              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              <span className="font-headline font-bold text-base">{pz.rating}</span>
                            </span>
                          </div>
                          <span className="font-headline font-bold text-xs text-on-surface-variant bg-surface-variant px-3 py-1 border border-outline-variant uppercase tracking-wider">
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
              <h3 className="text-3xl md:text-4xl font-display font-black border-b-4 border-primary pb-3 mb-8 inline-block uppercase tracking-tight">{t('dashboard.cheapestByTown')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(grouped).map(([city, pizzerias], cityIdx) => {
                  const cityPrices = pizzerias.map(p => p.margheritaPrice || 0);
                  const cityMin = Math.min(...cityPrices);
                  const cityMax = Math.max(...cityPrices);
                  const cityAvg = cityPrices.reduce((s, p) => s + p, 0) / cityPrices.length;
                  return (
                    <div key={city}
                      onClick={() => setExpandedCity(expandedCity === city ? null : city)}
                      className={`bg-surface border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] p-6 md:p-7 relative overflow-hidden ${pizzerias.length > 4 ? 'cursor-pointer' : ''} hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-all`
                        + (expandedCity === city ? ' bg-primary/5' : '')}
                      style={{ animationDelay: `${0.2 + cityIdx * 0.08}s` }}>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full" />
                      <div className="flex items-center justify-between mb-5">
                        <h4 className="font-display font-black text-2xl md:text-3xl group-hover:text-primary transition-colors">{city}</h4>
                        <div className="flex items-center gap-3">
                          <span className="font-headline font-bold text-xs md:text-sm text-on-surface-variant bg-surface-variant px-3 py-1 border border-outline-variant">
                            {pizzerias.length} {t('network.pizzerias')}
                          </span>
                          {pizzerias.length > 4 && (
                            <span className="material-symbols-outlined text-xl text-primary transition-transform"
                              style={{ transform: expandedCity === city ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                              expand_more
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-5 font-headline font-bold text-sm text-on-surface-variant">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-tertiary border-2 border-tertiary" />
                          Min {t('common.euro')}{cityMin.toFixed(2)}
                        </span>
                        <span className="flex-1 h-2 rounded-full bg-surface-variant overflow-hidden border border-outline-variant">
                          <span className="h-full rounded-full bg-gradient-to-r from-tertiary via-primary to-secondary block"
                            style={{ width: `${cityMin > 0 && globalMax > globalMin ? ((cityAvg - globalMin) / (globalMax - globalMin)) * 100 : 50}%` }} />
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-secondary border-2 border-secondary" />
                          Max {t('common.euro')}{cityMax.toFixed(2)}
                        </span>
                      </div>
                      <ul className="space-y-3 font-body text-base">
                        {(expandedCity === city ? pizzerias : pizzerias.slice(0, 4)).map((pz, idx) => {
                          const pct = globalMax > globalMin ? ((pz.margheritaPrice || 0) - globalMin) / (globalMax - globalMin) * 100 : 50;
                          const isLast = idx < (expandedCity === city ? pizzerias.length : Math.min(pizzerias.length, 4)) - 1;
                          return (
                            <li key={pz.id} className={`flex justify-between items-center gap-4 ${isLast ? 'border-b-2 border-outline-variant pb-3' : ''}${expandedCity === city ? ' animate-slide-up' : ''}`}
                              style={expandedCity === city && idx >= 4 ? { animationDelay: `${(idx - 4) * 0.03}s` } : {}}>
                              <span onClick={() => setSelectedPizzeria(pz)}
                                className="text-on-surface-variant truncate flex-1 cursor-pointer hover:text-primary hover:font-bold transition-all text-base md:text-lg">{pz.name}</span>
                              <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="w-20 h-2.5 bg-surface-variant rounded-full overflow-hidden border border-outline-variant hidden md:block">
                                  <div className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, pct))}%`,
                                      background: pct < 33 ? '#5C7A3E' : pct < 66 ? '#C84C09' : '#A03030',
                                    }} />
                                </div>
                                <span className="font-display font-bold text-lg w-16 text-right">{t('common.euro')}{(pz.margheritaPrice || 0).toFixed(2)}</span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      {pizzerias.length > 4 && expandedCity !== city && (
                        <p className="font-headline font-bold text-sm text-primary text-center mt-4 opacity-80 hover:opacity-100 transition-opacity">
                          {t('dashboard.expandMore', { count: pizzerias.length - 4 })}
                        </p>
                      )}
                      {expandedCity === city && pizzerias.length > 4 && (
                        <p onClick={(e) => { e.stopPropagation(); setExpandedCity(null); }}
                          className="font-headline font-bold text-sm text-primary text-center mt-4 cursor-pointer hover:underline">
                          {t('dashboard.reduce')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-primary border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] animate-slide-up overflow-hidden" style={{ animationDelay: '0.2s' }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full" />
              <div className="p-6 md:p-7 border-b-4 border-white/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-display font-black text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>reviews</span>
                    {t('dashboard.latestReviews')}
                  </h3>
                  <span className="font-headline font-bold text-sm text-white/70 bg-white/15 px-3 py-1 border border-white/20">
                    {reviews.length} {reviews.length === 1 ? t('dashboard.reviewSingular') : t('dashboard.reviewPlural')}
                  </span>
                </div>
              </div>
              <div className="p-6 md:p-7 space-y-4 max-h-[600px] overflow-y-auto">
                {revLoading ? (
                  <p className="font-headline text-base text-white/60 animate-pulse">{t('common.loading')}</p>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-white/20 mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble_outline</span>
                    <p className="font-headline text-base text-white/50 font-bold">{t('dashboard.noReviews')}</p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="bg-white/10 border border-white/15 p-5 hover:bg-white/15 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-headline font-bold text-sm text-white">
                          {getInitials(rev.author)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-headline font-bold text-base text-white/90 truncate">{rev.author}</span>
                            {rev.rating && <span className="bg-white/15 text-white font-headline font-bold text-xs px-2 py-1 flex-shrink-0">{rev.rating}/10</span>}
                          </div>
                          <p className="font-body text-base text-white/80 leading-relaxed">{rev.content}</p>
                          <p className="font-headline font-bold text-xs text-white/40 mt-2">{timeAgo(rev.createdAt || rev.timestamp, t)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] p-7 animate-slide-up relative overflow-hidden" style={{ animationDelay: '0.25s' }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full" />
              <h4 className="font-headline font-bold text-sm uppercase tracking-widest text-primary mb-6 border-b-4 border-primary pb-3">
                {t('dashboard.priceRange')}
              </h4>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between font-headline font-bold text-sm text-on-surface-variant mb-2">
                    <span>{t('common.euro')}{globalMin.toFixed(2)}</span>
                    <span>{t('dashboard.avgPrice')}: {t('common.euro')}{globalAvg.toFixed(2)}</span>
                    <span>{t('common.euro')}{globalMax.toFixed(2)}</span>
                  </div>
                  <div className="h-3 bg-surface-variant border-2 border-primary overflow-hidden shadow-[2px_2px_0px_0px_rgba(26,26,26,0.2)]">
                    <div className="h-full bg-gradient-to-r from-tertiary via-primary to-secondary relative"
                      style={{ width: '100%' }}>
                      <div className="absolute top-0 bottom-0 w-1.5 bg-white border-2 border-primary shadow-[0_0_6px_rgba(0,0,0,0.3)]"
                        style={{ left: `${globalMax > globalMin ? ((globalAvg - globalMin) / (globalMax - globalMin)) * 100 : 50}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between font-headline font-bold text-xs text-on-surface-variant mt-2">
                    <span>{t('dashboard.bestPrice')}: {bestPick.name.slice(0, 22)}</span>
                    <span>{t('dashboard.median')}</span>
                  </div>
                </div>
                <div className="pt-4 border-t-4 border-primary">
                  <div className="font-headline font-bold text-sm text-primary mb-4 uppercase tracking-wider">{t('dashboard.cheapestByTown')}</div>
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
                        <div key={city} className="flex items-center justify-between py-2.5 border-b-2 border-outline-variant/50 last:border-b-0">
                          <span className="font-body font-semibold text-base text-on-surface-variant truncate flex-1">{city}</span>
                          <span className="font-display font-bold text-lg text-primary">{t('common.euro')}{(cityCheapest?.margheritaPrice || 0).toFixed(2)}</span>
                          <span className="font-headline font-bold text-xs text-on-surface-variant ml-3 truncate max-w-[90px]">{cityCheapest?.name}</span>
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
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedPizzeria(null); }}
        >
          <div className="bg-surface border-4 border-primary shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 md:p-7 border-b-4 border-primary bg-primary/5">
              <h2 className="font-display font-black text-2xl text-primary">{t('prices.detailTitle')}</h2>
              <button onClick={() => setSelectedPizzeria(null)} className="w-10 h-10 flex items-center justify-center border-2 border-primary hover:bg-primary hover:text-on-primary transition-colors text-primary">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="p-6 md:p-7 space-y-6">
              <div>
                <h3 className="text-3xl font-display font-black text-primary">{selectedPizzeria.name}</h3>
                <div className="flex items-center gap-4 mt-3">
                  <span className="bg-primary/10 text-primary font-headline font-bold text-sm px-3 py-1 border border-primary/30 uppercase tracking-wider">
                    {t(`common.${selectedPizzeria.category === 'gourmet' ? 'gourmet' : selectedPizzeria.category === 'wood-fired' ? 'woodFired' : 'traditional'}`)}
                  </span>
                  <span className="flex items-center gap-1.5 text-primary">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-headline font-bold text-base">{selectedPizzeria.rating}</span>
                  </span>
                  <span className="font-body text-sm text-on-surface-variant">{selectedPizzeria.cityName}</span>
                </div>
              </div>

              {selectedPizzeria.description && (
                <div>
                  <div className="font-headline font-bold text-xs uppercase tracking-widest text-primary mb-2">{t('prices.description')}</div>
                  <p className="font-body text-base md:text-lg text-primary leading-relaxed">{lang === 'it' ? (selectedPizzeria.descriptionIt || selectedPizzeria.description) : selectedPizzeria.description}</p>
                </div>
              )}

              <div className="bg-background border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-5">
                <div className="font-headline font-bold text-xs uppercase tracking-widest text-primary mb-2">{t('prices.address')}</div>
                <p className="font-display font-bold text-lg text-primary">{selectedPizzeria.address || '—'}</p>
                {selectedPizzeria.frazione && (
                  <p className="font-body text-base text-on-surface-variant mt-1">{selectedPizzeria.frazione}</p>
                )}
              </div>

              <div className="bg-primary border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] p-6 text-center">
                <div className="font-headline font-bold text-sm uppercase tracking-widest text-white/80 mb-2">🍕 {t('prices.margherita')}</div>
                <div className="font-display font-black text-5xl md:text-6xl text-white">{t('common.euro')}{(selectedPizzeria.margheritaPrice || 0).toFixed(2)}</div>
              </div>

              <div className="flex gap-4">
                {selectedPizzeria.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPizzeria.name + ' ' + selectedPizzeria.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary font-headline font-bold text-base py-4 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-fixed-dim transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                    <span className="material-symbols-outlined text-xl">map</span>
                    {t('dashboard.maps')}
                  </a>
                )}
                <button onClick={() => setSelectedPizzeria(null)}
                  className="flex-1 flex items-center justify-center gap-2 bg-surface text-primary font-headline font-bold text-base py-4 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-surface-variant transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                  <span className="material-symbols-outlined text-xl">close</span>
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
