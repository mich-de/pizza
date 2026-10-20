import { useState, useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader } from '../components/ui';
import StatTile from '../components/StatTile';
import { groupByCity } from '../utils/groupByCity';

export default function Network() {
  const { data, loading } = useStitchedData();
  const [selectedCity, setSelectedCity] = useState(null);
  const { t, money } = useI18n();

  const grouped = useMemo(() => groupByCity(data), [data]);
  const cityNames = useMemo(() => Object.keys(grouped), [grouped]);

  const stats = useMemo(() => ({
    totalPizzerias: data.length,
    avgRating: data.length > 0 ? data.reduce((s, p) => s + p.rating, 0) / data.length : 0,
    avgPrice: data.length > 0 ? data.reduce((s, p) => s + (p.margheritaPrice || 0), 0) / data.length : 0,
    clusters: cityNames.length,
  }), [data, cityNames]);

  const selectedData = selectedCity ? grouped[selectedCity] || [] : [];

  const categoryLabels = {
    traditional: t('common.traditional'),
    gourmet: t('common.gourmet'),
    'wood-fired': t('common.woodFired'),
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="container fade-in">
      <PageHeader
        eyebrow={t('common.peninsula')}
        title={t('network.title')}
        subtitle={t('network.subtitle')}
      />

      {/* Quattro conteggi in monospaziato, non quattro flap: il flap resta uno
          solo, sulla testatina dell'elenco a destra. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <StatTile icon="store" label={t('network.totalNodes')} value={stats.totalPizzerias} />
        <StatTile icon="hub" label={t('network.clusters')} value={stats.clusters} />
        <StatTile icon="star" label={t('network.avgRating')} value={stats.avgRating.toFixed(1)} />
        <StatTile icon="euro" label={t('network.avgPrice')} value={`€${money(stats.avgPrice)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Scegliere il cluster compone la richiesta: su carta sparisce. */}
        <div className="lg:col-span-5 no-print">
          <div className="section-title">{t('network.cityClusters')}</div>
          <div className="stack">
            {cityNames.map((city) => {
              const pizzerias = grouped[city];
              const avgCityPrice = pizzerias.reduce((s, p) => s + (p.margheritaPrice || 0), 0) / pizzerias.length;
              const isActive = selectedCity === city;
              return (
                <button
                  key={city}
                  onClick={() => setSelectedCity(isActive ? null : city)}
                  aria-pressed={isActive}
                  className={`tile w-full text-left ${isActive ? 'highlight' : ''}`}
                >
                  <div className="tile-head">
                    <span className="tile-title">{city}</span>
                    <span className="badge badge-ghost font-mono tabular-nums">{pizzerias.length}</span>
                  </div>
                  <div className="flex justify-between items-center gap-3 mt-2">
                    <span className="font-label text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant">
                      {t('network.pizzerias')}
                    </span>
                    <span className="font-mono tabular-nums text-sm">
                      €{money(avgCityPrice)} <span className="text-on-surface-variant">{t('network.avg')}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="section-title mb-0">
              {selectedCity ? t('network.cityConnections', { city: selectedCity }) : t('network.allConnections')}
            </div>
            {/* L'unico flap della schermata: quanti nodi si stanno leggendo. */}
            <span className="flap">{(selectedCity ? selectedData : data).length}</span>
          </div>
          <div className="stack">
            {(selectedCity ? selectedData : data).map((pz) => (
              <div key={pz.id} className="tile flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant shrink-0">store</span>
                <div className="flex-1 min-w-0">
                  <h4 className="tile-title truncate mb-0.5">{pz.name}</h4>
                  <p className="tile-desc truncate mb-1">{pz.address}</p>
                  <div className="chips">
                    <span className="chip">{pz.cityName}</span>
                    <span className="chip">{categoryLabels[pz.category] || pz.category}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono tabular-nums text-base">€{money(pz.margheritaPrice)}</div>
                  <div className="flex items-center gap-1 justify-end text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">star</span>
                    <span className="font-mono tabular-nums text-sm">{pz.rating}</span>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pz.name + ' ' + pz.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-icon btn-sm shrink-0 no-print"
                  aria-label={pz.name}
                >
                  <span className="material-symbols-outlined text-lg">map</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
