import { useState, useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader, StatCard } from '../components/ui';
import { groupByCity } from '../utils/groupByCity';

export default function Network() {
  const { data, loading } = useStitchedData();
  const [selectedCity, setSelectedCity] = useState(null);
  const { t } = useI18n();

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
    <div className="p-6 md:p-12">
      <PageHeader
        title={t('network.title')}
        subtitle={t('network.subtitle')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard title={t('network.totalNodes')} value={stats.totalPizzerias} icon="store" color="primary" />
        <StatCard title={t('network.clusters')} value={stats.clusters} icon="hub" color="primaryContainer" />
        <StatCard title={t('network.avgRating')} value={stats.avgRating.toFixed(1)} icon="star" color="tertiary" />
        <StatCard title={t('network.avgPrice')} value={`€${stats.avgPrice.toFixed(2)}`} icon="euro" color="secondary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <h3 className="text-2xl font-display font-bold border-b border-outline-variant pb-2 mb-6 inline-block">
            {t('network.cityClusters')}
          </h3>
          <div className="flex flex-col gap-3">
            {cityNames.map((city) => {
              const pizzerias = grouped[city];
              const avgCityPrice = pizzerias.reduce((s, p) => s + (p.margheritaPrice || 0), 0) / pizzerias.length;
              const isActive = selectedCity === city;
              return (
                <button
                  key={city}
                  onClick={() => setSelectedCity(isActive ? null : city)}
                  className={`w-full text-left border rounded-sm p-5 transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface border-outline-variant hover:bg-surface-variant'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-display font-bold text-xl ${isActive ? 'text-on-primary' : ''}`}>{city}</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-lg">store</span>
                      <span className="font-label font-semibold text-base">{pizzerias.length}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`font-label text-sm tracking-wider ${isActive ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                      {pizzerias.length} {t('network.pizzerias')}
                    </span>
                    <span className={`font-display font-bold text-lg ${isActive ? 'text-on-primary' : ''}`}>
                      €{avgCityPrice.toFixed(2)} {t('network.avg')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7">
          <h3 className="text-2xl font-display font-bold border-b border-outline-variant pb-2 mb-6 inline-block">
            {selectedCity ? t('network.cityConnections', { city: selectedCity }) : t('network.allConnections')}
          </h3>
          <div className="flex flex-col gap-3">
            {(selectedCity ? selectedData : data).map((pz) => (
              <div
                key={pz.id}
                className="bg-surface border border-outline-variant rounded-sm p-4 flex items-center gap-4 hover-lift"
              >
                <div className="w-11 h-11 bg-primary/10 text-primary rounded-sm flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined">store</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-label font-semibold text-sm truncate">{pz.name}</h4>
                  <p className="text-xs font-body text-on-surface-variant/60 truncate">{pz.address}</p>
                  <div className="flex items-center gap-3 text-xs font-label text-on-surface-variant/70 mt-0.5">
                    <span>{pz.cityName}</span>
                    <span>·</span>
                    <span>{categoryLabels[pz.category] || pz.category}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display font-bold text-lg">€{pz.margheritaPrice?.toFixed(2)}</div>
                  <div className="flex items-center gap-1 justify-end text-primary/70">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-label font-semibold text-sm">{pz.rating}</span>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pz.name + ' ' + pz.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border border-outline-variant rounded-sm flex items-center justify-center hover:bg-primary hover:text-on-primary hover:border-primary transition-colors flex-shrink-0 text-on-surface-variant"
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
