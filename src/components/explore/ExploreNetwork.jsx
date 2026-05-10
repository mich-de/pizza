export default function ExploreNetwork({ data, networkStats, grouped, cityNames, selectedCity, setSelectedCity, t }) {
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
          <h3 className="text-3xl font-display font-black uppercase border-b-4 border-primary mb-6 pb-2 inline-block">
            {t('network.cityClusters')}
          </h3>
          <div className="flex flex-col gap-4">
            {cityNames.map((city) => {
              const pizzerias = grouped[city];
              const avgCityPrice = pizzerias.reduce((s, p) => s + (p.margheritaPrice || 0), 0) / pizzerias.length;
              const isActive = selectedCity === city;
              return (
                <button
                  key={city}
                  onClick={() => setSelectedCity(isActive ? null : city)}
                  className={`w-full text-left border-4 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-[6px_6px_0px_0px_rgba(255,204,0,1)]'
                      : 'bg-surface hover:bg-surface-variant'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-display font-black text-2xl uppercase">{city}</h4>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined">store</span>
                      <span className="font-headline font-bold text-lg">{pizzerias.length}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="font-label font-bold uppercase text-sm opacity-70">
                      {pizzerias.length} {t('network.pizzerias')}
                    </span>
                    <span className="font-headline font-bold text-xl">
                      €{avgCityPrice.toFixed(2)} {t('network.avg')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7">
          <h3 className="text-3xl font-display font-black uppercase border-b-4 border-primary mb-6 pb-2 inline-block">
            {selectedCity ? t('network.cityConnections', { city: selectedCity }) : t('network.allConnections')}
          </h3>
          <div className="flex flex-col gap-4">
            {selectedData.map((pz) => (
              <div
                key={pz.id}
                className="bg-surface border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
              >
                <div className="w-12 h-12 bg-primary text-on-primary flex items-center justify-center border-2 border-primary flex-shrink-0">
                  <span className="material-symbols-outlined">store</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-headline font-black uppercase truncate">{pz.name}</h4>
                  <p className="text-xs font-body text-on-surface-variant">{pz.address}</p>
                  <div className="flex items-center gap-4 text-sm font-label font-bold uppercase text-on-surface-variant">
                    <span>{pz.cityName}</span>
                    <span>{t(`common.${pz.category === 'wood-fired' ? 'woodFired' : pz.category}`)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-headline font-bold text-xl text-primary">
                    €{pz.margheritaPrice?.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-label text-sm">{pz.rating}</span>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pz.name + ' ' + pz.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 border-2 border-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined">map</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const bgMap = {
    primary: 'bg-primary text-on-primary',
    primaryContainer: 'bg-primary-container text-primary',
    tertiary: 'bg-tertiary text-on-tertiary',
    secondary: 'bg-secondary text-on-secondary',
  };
  return (
    <div className={`border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] ${bgMap[color] || bgMap.primary}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <p className="font-label text-xs uppercase tracking-widest">{title}</p>
      </div>
      <p className="font-headline text-4xl font-black">{value}</p>
    </div>
  );
}
