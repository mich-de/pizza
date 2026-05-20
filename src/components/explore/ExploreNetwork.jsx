export default function ExploreNetwork({ data, networkStats, grouped, cityNames, selectedCity, setSelectedCity, t, onSelect }) {
  const selectedData = selectedCity ? (grouped[selectedCity] || []) : data;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="bg-surface border-4 border-primary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <div className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-1">{t('network.totalNodes')}</div>
          <div className="font-headline font-black text-4xl text-primary">{networkStats.totalPizzerias}</div>
        </div>
        <div className="bg-primary-container border-4 border-primary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <div className="font-label font-bold text-xs uppercase tracking-widest text-primary/70 mb-1">{t('network.clusters')}</div>
          <div className="font-headline font-black text-4xl text-primary">{networkStats.clusters}</div>
        </div>
        <div className="bg-tertiary-container border-4 border-tertiary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <div className="font-label font-bold text-xs uppercase tracking-widest text-tertiary/70 mb-1">{t('network.avgRating')}</div>
          <div className="font-headline font-black text-4xl text-tertiary">{networkStats.avgRating.toFixed(1)}</div>
        </div>
        <div className="bg-secondary-container border-4 border-secondary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <div className="font-label font-bold text-xs uppercase tracking-widest text-secondary/70 mb-1">{t('network.avgPrice')}</div>
          <div className="font-headline font-black text-4xl text-secondary">&euro;{networkStats.avgPrice.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <h3 className="font-headline font-black text-2xl md:text-3xl uppercase text-primary border-b-4 border-primary pb-3 mb-6">
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
                  className={`w-full text-left border-4 transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]'
                      : 'bg-surface border-primary shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(26,26,26,1)]'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-headline font-black text-xl ${isActive ? 'text-on-primary' : 'text-primary'}`}>{city}</h4>
                      <div className={`flex items-center gap-1.5 text-sm ${isActive ? 'text-on-primary/80' : 'text-primary'}`}>
                        <span className="material-symbols-outlined text-lg">store</span>
                        <span className="font-headline font-bold">{pizzerias.length}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`font-label font-bold text-xs uppercase ${isActive ? 'text-on-primary/60' : 'text-on-surface-variant/60'}`}>
                        {t('network.pizzerias')}
                      </span>
                      <span className={`font-headline font-black text-lg ${isActive ? 'text-on-primary' : 'text-primary'}`}>
                        &euro;{avgCityPrice.toFixed(2)} <span className={`font-label text-xs font-bold uppercase ${isActive ? 'text-on-primary/60' : 'text-on-surface-variant/60'}`}>{t('network.avg')}</span>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7">
          <h3 className="font-headline font-black text-2xl md:text-3xl uppercase text-primary border-b-4 border-primary pb-3 mb-6">
            {selectedCity ? t('network.cityConnections', { city: selectedCity }) : t('network.allConnections')}
          </h3>
          <div className="flex flex-col gap-3">
            {selectedData.map((pz) => (
              <div
                key={pz.id}
                onClick={() => onSelect?.(pz)}
                className="bg-surface border-4 border-primary shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] p-4 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(26,26,26,1)] transition-all cursor-pointer"
              >
                <div className="w-12 h-12 bg-primary text-on-primary flex items-center justify-center border-2 border-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">store</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-headline font-bold text-base truncate flex items-center gap-2">
                    <span className={pz.status === 'closed' ? 'text-on-surface-variant/50' : 'text-primary'}>{pz.name}</span>
                    {pz.status === 'closed' && (
                      <span className="bg-error text-on-error font-headline font-black text-[10px] uppercase tracking-wider px-1.5 py-0.5">{t('explore.closedPermanently')}</span>
                    )}
                  </h4>
                  <p className="font-label text-xs text-on-surface-variant/70 truncate">{pz.address}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="font-label font-bold text-xs uppercase text-on-surface-variant/50">{pz.cityName}</span>
                    <span className="font-label text-xs text-on-surface-variant/30">&middot;</span>
                    <span className="font-label font-bold text-xs uppercase text-on-surface-variant/50">
                      {t(`common.${pz.category === 'wood-fired' ? 'woodFired' : pz.category}`)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-headline font-black text-xl text-primary">
                    &euro;{pz.margheritaPrice?.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <span className="material-symbols-outlined text-amber-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-headline font-bold text-sm text-primary">{pz.rating}</span>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pz.name + ' ' + pz.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-10 h-10 flex items-center justify-center border-2 border-primary bg-background text-primary hover:bg-primary hover:text-on-primary transition-colors flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
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
