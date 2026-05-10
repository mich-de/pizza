import { StatCard } from '../ui';

export default function ExploreNetwork({ data, networkStats, grouped, cityNames, selectedCity, setSelectedCity, t, onSelect }) {
  const selectedData = selectedCity ? (grouped[selectedCity] || []) : data;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard title={t('network.totalNodes')} value={networkStats.totalPizzerias} icon="store" color="primary" />
        <StatCard title={t('network.clusters')} value={networkStats.clusters} icon="hub" color="primaryContainer" />
        <StatCard title={t('network.avgRating')} value={networkStats.avgRating.toFixed(1)} icon="star" color="tertiary" />
        <StatCard title={t('network.avgPrice')} value={`€${networkStats.avgPrice.toFixed(2)}`} icon="euro" color="secondary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <h3 className="text-2xl font-display font-bold text-primary border-b border-outline-variant pb-3 mb-6">
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
                  className={`w-full text-left rounded-sm border transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface border-outline-variant hover:bg-surface-variant hover:border-primary/30'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-display font-bold text-xl ${isActive ? 'text-on-primary' : 'text-primary'}`}>{city}</h4>
                      <div className={`flex items-center gap-1.5 text-sm ${isActive ? 'text-on-primary/80' : 'text-primary'}`}>
                        <span className="material-symbols-outlined text-lg">store</span>
                        <span className="font-display font-bold">{pizzerias.length}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`font-label text-xs ${isActive ? 'text-on-primary/60' : 'text-on-surface-variant/60'}`}>
                        {t('network.pizzerias')}
                      </span>
                      <span className={`font-display font-bold text-lg ${isActive ? 'text-on-primary' : 'text-primary'}`}>
                        €{avgCityPrice.toFixed(2)} <span className={`font-label text-xs font-medium ${isActive ? 'text-on-primary/60' : 'text-on-surface-variant/60'}`}>{t('network.avg')}</span>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7">
          <h3 className="text-2xl font-display font-bold text-primary border-b border-outline-variant pb-3 mb-6">
            {selectedCity ? t('network.cityConnections', { city: selectedCity }) : t('network.allConnections')}
          </h3>
          <div className="flex flex-col gap-3">
            {selectedData.map((pz) => (
              <div
                key={pz.id}
                onClick={() => onSelect?.(pz)}
                className="bg-surface border border-outline-variant rounded-sm p-4 flex items-center gap-4 hover:bg-surface-variant/50 transition-colors cursor-pointer"
              >
                <div className="w-11 h-11 bg-primary/10 text-primary rounded-sm flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined">store</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-bold text-base text-primary truncate">{pz.name}</h4>
                  <p className="text-xs font-body text-on-surface-variant/70 truncate">{pz.address}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="font-label text-[11px] font-medium text-on-surface-variant/50">{pz.cityName}</span>
                    <span className="font-label text-[11px] font-medium text-on-surface-variant/50">·</span>
                    <span className="font-label text-[11px] font-medium text-on-surface-variant/50">
                      {t(`common.${pz.category === 'wood-fired' ? 'woodFired' : pz.category}`)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display font-bold text-lg text-primary">
                    €{pz.margheritaPrice?.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-label text-sm text-on-surface">{pz.rating}</span>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pz.name + ' ' + pz.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-9 h-9 flex items-center justify-center rounded-sm border border-outline-variant text-on-surface-variant/50 hover:bg-primary hover:text-on-primary hover:border-primary transition-colors flex-shrink-0"
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
