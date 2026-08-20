import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';

import StatTile from '../components/StatTile';
import BrandMark from '../components/BrandMark';
import { PageHeader } from '../components/ui';

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
  const { t, lang, money } = useI18n();
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
      <div className="container flex items-center justify-center min-h-[70vh]">
        <div className="card card-accent max-w-xl w-full">
          <span className="eyebrow">{t('dashboard.loadError')}</span>
          <div className="alert alert-error mt-3">
            <span className="material-symbols-outlined text-base leading-none">error</span>
            <span>{error}</span>
          </div>
          <button onClick={() => window.location.reload()} className="btn btn-primary mt-4">
            <span className="material-symbols-outlined text-base">refresh</span>
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
    <div className="container">
      {/* La marina non si passa da qui: `PageHeader` la mette su ogni pagina,
          altrimenti questa testatina tornerebbe a essere diversa dalle altre.

          Il marchio sta a fianco del titolo a coprenza piena, non in filigrana
          stesa sopra la foto: due cose sbiadite sovrapposte non ne fanno vedere
          nessuna delle due. E' l'unica pagina che lo porta grande — questa e'
          la copertina, le altre hanno la loro testatina e basta. */}
      <PageHeader
        eyebrow={t('common.peninsula')}
        title={<>Radar Pizza <em>Sorrento</em></>}
        subtitle={t('dashboard.subtitle')}
        mark={<BrandMark size={512} className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24" />}
      />

      {/* I quattro conteggi restano numeri in monospaziato: il flap della
          schermata e' uno solo, ed e' il prezzo della migliore (sotto). */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatTile icon="local_pizza" label={t('dashboard.totalPizzerias')} value={data.length} />
        <StatTile icon="location_city" label={t('dashboard.citiesCount')} value={Object.keys(grouped).length} />
        <StatTile icon="trending_up" label={t('dashboard.avgPrice')} value={`${t('common.euro')}${money(globalAvg)}`} />
        <StatTile
          icon="leaderboard"
          label={t('dashboard.priceRange')}
          value={`${t('common.euro')}${money(globalMin)}–${money(globalMax)}`}
          sub={`${t('dashboard.bestPrice')}: ${bestPick.name}`}
        />
      </div>

      {/* 7/5: a sinistra si legge il risultato, a destra il contorno. */}
      <div className="split">
        <div className="flex flex-col gap-8 min-w-0">
          <section className="panel">
            <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-9">
              <div className="flex-1 min-w-0">
                <span className="eyebrow">{t('dashboard.topPick')}</span>
                <h2 className="mt-1.5 mb-1">{t('dashboard.bestQualityPrice')}</h2>
                <p className="font-display uppercase tracking-[0.04em] text-lg text-on-surface-variant mb-0">
                  {bestPick.name} &mdash; {bestPick.cityName}
                </p>
                <ul className="kv mt-4 md:grid-cols-3">
                  <li><span className="k">{t('dashboard.totalPizzerias')}</span><span className="v">{data.length}</span></li>
                  <li><span className="k">{t('dashboard.avgPrice')}</span><span className="v">{t('common.euro')}{money(globalAvg)}</span></li>
                  <li><span className="k">{t('dashboard.priceRange')}</span><span className="v">{t('common.euro')}{money(globalMin)}&ndash;{money(globalMax)}</span></li>
                </ul>
              </div>
              <div className="shrink-0">
                <span className="block font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mb-1.5">
                  {t('dashboard.margheritaLabel')}
                </span>
                <span className="flap flap-lg">
                  {bestPick.margheritaPrice > 0 ? `${t('common.euro')}${money(bestPick.margheritaPrice)}` : '—'}
                </span>
                {/* Stelle neutre: l'ambra e' gia' impegnata dal flap. */}
                <div className="flex gap-0.5 mt-2 text-on-surface-variant">
                  {Array.from({ length: 5 }, (_, i) => {
                    const full = Math.floor(bestPick.rating);
                    const frac = bestPick.rating - full;
                    let iconName = 'star_border';
                    if (i < full) iconName = 'star';
                    else if (i === full && frac >= 0.5) iconName = 'star_half';
                    return (
                      <span key={i} className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
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
              <div className="section-title">
                <h2>{t('newOpenings.title')}</h2>
                <span className="badge badge-ghost font-mono tabular-nums">
                  {newOpenings.length} {newOpenings.length === 1 ? t('dashboard.newOpeningSingular') : t('dashboard.newOpeningPlural')}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 fade-in">
                {newOpenings.map((pz) => (
                  <div key={pz.id} className="tile">
                    <div className="tile-head">
                      <div className="min-w-0">
                        <h3 className="tile-title truncate">{pz.name}</h3>
                        <p className="eyebrow mt-1.5">
                          {pz.frazione ? `${pz.frazione}, ${pz.cityName}` : pz.cityName}
                        </p>
                      </div>
                      <div className="price shrink-0">
                        <span className="flap">{money(pz.margheritaPrice)}</span><span className="unit">EUR</span>
                        <span className="flex items-center justify-end gap-1 mt-1.5 font-mono text-xs tabular-nums text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {pz.rating}
                        </span>
                      </div>
                    </div>
                    <div className="chips mt-3">
                      <span className="badge badge-ghost font-mono">
                        {t('months.' + (pz.openedAt ? pz.openedAt.slice(5, 7) : '01'))} {pz.openedAt ? pz.openedAt.slice(0, 4) : ''}
                      </span>
                      <span className="badge badge-ghost">
                        {t(`common.${pz.category === 'gourmet' ? 'gourmet' : 'traditional'}`)}
                      </span>
                      {pz.status === 'closed' && (
                        <span className="badge badge-error">{t('explore.closedPermanently')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="section-title">
              <h2>{t('dashboard.cheapestByTown')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 fade-in">
              {Object.entries(grouped).map(([city, pizzerias]) => {
                const cityPrices = pizzerias.map(p => p.margheritaPrice || 0);
                const cityMin = Math.min(...cityPrices);
                const cityMax = Math.max(...cityPrices);
                const cityAvg = cityPrices.reduce((s, p) => s + p, 0) / cityPrices.length;
                const isOpen = expandedCity === city;
                return (
                  <div key={city}
                    onClick={() => setExpandedCity(isOpen ? null : city)}
                    /* La citta' aperta prende la barra ambra interna: stato,
                       non fondo colorato. */
                    className={`tile ${pizzerias.length > 4 ? 'cursor-pointer' : ''} ${isOpen ? 'highlight' : ''}`}>
                    <div className="tile-head">
                      <h3 className="tile-title">{city}</h3>
                      <span className="inline-flex items-center gap-2 shrink-0">
                        <span className="badge badge-ghost font-mono tabular-nums">
                          {pizzerias.length} {t('network.pizzerias')}
                        </span>
                        {pizzerias.length > 4 && (
                          <span className="material-symbols-outlined text-base text-on-surface-variant transition-transform"
                            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            expand_more
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Barra della fascia: un filetto neutro con il segno della
                        media in ambra. L'ambra segnala il punto, non riempie. */}
                    <div className="flex items-center gap-3 mt-4 mb-4 font-mono text-xs tabular-nums text-on-surface-variant">
                      <span>{t('common.euro')}{money(cityMin)}</span>
                      <span className="relative flex-1 h-1.5 bg-surface-dim border border-outline-variant">
                        <span className="absolute top-0 bottom-0 w-[3px] bg-accent"
                          style={{ left: `${globalMax > globalMin ? Math.min(100, Math.max(0, ((cityAvg - globalMin) / (globalMax - globalMin)) * 100)) : 50}%` }} />
                      </span>
                      <span>{t('common.euro')}{money(cityMax)}</span>
                    </div>

                    <ul className="kv">
                      {(isOpen ? pizzerias : pizzerias.slice(0, 4)).map((pz) => (
                        <li key={pz.id}>
                          <span className="k truncate cursor-pointer hover:text-on-surface transition-colors"
                            onClick={(e) => { e.stopPropagation(); setSelectedPizzeria(pz); }}>
                            {pz.name}
                          </span>
                          <span className="v">{t('common.euro')}{money(pz.margheritaPrice || 0)}</span>
                        </li>
                      ))}
                    </ul>

                    {pizzerias.length > 4 && (
                      <p className="font-label text-[0.7rem] uppercase tracking-[0.1em] text-on-surface-variant text-center mt-3 mb-0 no-print">
                        {isOpen ? t('dashboard.reduce') : t('dashboard.expandMore', { count: pizzerias.length - 4 })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6 min-w-0">
          <section className="panel">
            <div className="section-title">
              <h2 className="text-base">{t('dashboard.latestReviews')}</h2>
              <span className="badge badge-ghost font-mono tabular-nums">
                {reviews.length} {reviews.length === 1 ? t('dashboard.reviewSingular') : t('dashboard.reviewPlural')}
              </span>
            </div>
            <div className="flex flex-col gap-2 max-h-[560px] overflow-y-auto">
              {revLoading ? (
                <p className="font-body text-sm text-on-surface-variant mb-0">{t('common.loading')}</p>
              ) : reviews.length === 0 ? (
                <div className="text-center py-10">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 block">chat_bubble_outline</span>
                  <p className="font-body text-sm text-on-surface-variant mb-0">{t('dashboard.noReviews')}</p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="tile">
                    <div className="flex items-start gap-3">
                      {/* Sigla in monospaziato dentro un quadrato: il cerchio
                          e' l'unica eccezione ammessa, e non e' questa. */}
                      <span className="w-9 h-9 shrink-0 flex items-center justify-center border border-outline-variant bg-surface-dim font-mono text-xs text-on-surface-variant">
                        {getInitials(rev.author)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display uppercase tracking-[0.04em] text-sm truncate">{rev.author}</span>
                          {rev.rating && (
                            <span className="badge badge-ghost font-mono tabular-nums shrink-0">{rev.rating}/10</span>
                          )}
                        </div>
                        <p className="font-body text-sm text-on-surface-variant leading-relaxed mt-1.5 mb-0">{rev.content}</p>
                        <p className="font-label text-[0.68rem] uppercase tracking-[0.09em] text-on-surface-variant/70 mt-1.5 mb-0">
                          {timeAgo(rev.createdAt || rev.timestamp, t)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div className="section-title">
              <h2 className="text-base">{t('dashboard.priceRange')}</h2>
            </div>

            <div className="flex justify-between font-mono text-xs tabular-nums text-on-surface-variant mb-1.5">
              <span>{t('common.euro')}{money(globalMin)}</span>
              <span>{t('common.euro')}{money(globalMax)}</span>
            </div>
            {/* Il segno della media e' l'unica ambra della barra. */}
            <div className="relative h-2 bg-surface-dim border border-outline-variant">
              <span className="absolute top-0 bottom-0 w-[3px] bg-accent"
                style={{ left: `${globalMax > globalMin ? Math.min(100, Math.max(0, ((globalAvg - globalMin) / (globalMax - globalMin)) * 100)) : 50}%` }} />
            </div>
            <p className="font-label text-[0.7rem] uppercase tracking-[0.09em] text-on-surface-variant mt-2 mb-0">
              {t('dashboard.avgPrice')} <span className="font-mono tabular-nums">{t('common.euro')}{money(globalAvg)}</span>
              {' · '}
              {t('dashboard.bestPrice')}: {bestPick.name.slice(0, 22)}
            </p>

            <div className="mt-5 pt-4 border-t border-outline-variant">
              <span className="eyebrow">{t('dashboard.cheapestByTown')}</span>
              <ul className="kv mt-2.5">
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
                      <li key={city}>
                        <span className="k truncate">{city} &middot; {cityCheapest?.name}</span>
                        <span className="v">{t('common.euro')}{money(cityCheapest?.margheritaPrice || 0)}</span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </section>
        </div>
      </div>

      {selectedPizzeria && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4 bg-black/55 no-print"
          style={{ zIndex: 9999 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedPizzeria(null); }}
        >
          <div className="card card-accent w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="eyebrow">{t('prices.detailTitle')}</span>
                <h2 className="mt-1 mb-0">{selectedPizzeria.name}</h2>
              </div>
              <button onClick={() => setSelectedPizzeria(null)} className="btn btn-ghost btn-icon shrink-0">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="chips mt-3">
              <span className="badge badge-ghost">
                {t(`common.${selectedPizzeria.category === 'gourmet' ? 'gourmet' : selectedPizzeria.category === 'wood-fired' ? 'woodFired' : 'traditional'}`)}
              </span>
              <span className="badge badge-ghost inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-mono tabular-nums">{selectedPizzeria.rating}</span>
              </span>
              <span className="badge badge-ghost">{selectedPizzeria.cityName}</span>
            </div>

            <div className="panel mt-5">
              <span className="block font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mb-1.5">
                {t('prices.margherita')}
              </span>
              <span className="flap flap-lg">{money(selectedPizzeria.margheritaPrice)}</span><span className="unit">EUR</span>
            </div>

            <ul className="kv mt-5">
              <li><span className="k">{t('prices.address')}</span><span className="v">{selectedPizzeria.address || '—'}</span></li>
              {selectedPizzeria.frazione && (
                <li><span className="k">{t('prices.frazione')}</span><span className="v">{selectedPizzeria.frazione}</span></li>
              )}
            </ul>

            {selectedPizzeria.description && (
              <div className="mt-5">
                <span className="eyebrow">{t('prices.description')}</span>
                <p className="font-body text-sm mt-1.5 mb-0">
                  {lang === 'it' ? (selectedPizzeria.descriptionIt || selectedPizzeria.description) : selectedPizzeria.description}
                </p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap mt-6 pt-5 border-t border-outline-variant no-print">
              {selectedPizzeria.address && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPizzeria.name + ' ' + selectedPizzeria.address)}`}
                  target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <span className="material-symbols-outlined text-base">map</span>
                  {t('dashboard.maps')}
                </a>
              )}
              <button onClick={() => setSelectedPizzeria(null)} className="btn btn-ghost ml-auto">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
