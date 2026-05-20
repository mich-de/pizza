export default function ExploreCards({ filtered, stats, t, lang, onSelect, onReportPrice }) {

  const handleCardClick = (pz) => {
    onSelect?.(pz);
  };

  const handleReportClick = (pz, e) => {
    e.stopPropagation();
    onReportPrice?.(pz);
  };

  const priceTier = (price) => {
    if (stats.range === 0) return 'mid';
    const ratio = (price - stats.min) / stats.range;
    if (ratio < 0.33) return 'cheap';
    if (ratio < 0.66) return 'mid';
    return 'expensive';
  };

  const tierAccent = (tier) => {
    switch (tier) {
      case 'cheap': return 'border-l-tertiary';
      case 'expensive': return 'border-l-secondary';
      default: return 'border-l-primary-fixed-dim';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {filtered.map((pz) => {
        const tier = priceTier(pz.margheritaPrice);
        const borderColor = tierAccent(tier);
        return (
          <article
            key={pz.id}
            onClick={() => !pz.closed && handleCardClick(pz)}
            className={`bg-surface border-4 border-primary shadow-[5px_5px_0px_0px_rgba(26,26,26,1)] flex flex-col group relative overflow-hidden hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_rgba(26,26,26,1)] transition-all cursor-pointer border-l-8 ${borderColor} ${pz.status === 'closed' ? 'opacity-70' : ''}`}
          >
            {pz.status === 'closed' && (
              <div className="absolute top-0 left-0 right-0 bg-error text-on-error font-headline font-black text-xs uppercase tracking-widest text-center py-1.5 z-10">
                {t('explore.closedPermanently')}
              </div>
            )}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline font-black text-xl md:text-2xl text-primary group-hover:text-secondary transition-colors leading-tight truncate">{pz.name}</h3>
                  <p className="font-body font-semibold text-on-surface-variant text-sm flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-sm flex-shrink-0 text-primary/60">location_on</span>
                    <span className="truncate">{pz.frazione ? `${pz.frazione}, ${pz.address}` : pz.address}</span>
                  </p>
                  <p className="font-label font-bold text-xs text-on-surface-variant/70 uppercase tracking-wider mt-0.5">{pz.cityName}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="font-headline font-black text-2xl md:text-3xl text-primary leading-none">
                    &euro;{pz.margheritaPrice?.toFixed(2)}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="material-symbols-outlined text-amber-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-headline font-bold text-sm text-primary">{pz.rating}</span>
                  </div>
                </div>
              </div>
              <p className="font-body font-semibold text-sm text-on-surface-variant mb-4 flex-1 leading-relaxed line-clamp-2">
                {lang === 'it' ? (pz.descriptionIt || pz.description) : pz.description}
              </p>
              <div className="border-t-4 border-primary pt-4 mt-auto flex items-center justify-between">
                <button
                  onClick={(e) => handleReportClick(pz, e)}
                  className="inline-flex items-center gap-1.5 font-headline font-bold uppercase text-xs bg-surface-variant text-primary px-3 py-2 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  {t('explore.reportPrice')}
                </button>
                <div className="flex gap-2">
                  <a
                    href={pz.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pz.name + ' ' + pz.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-primary text-on-primary font-headline font-bold uppercase text-xs py-2 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="material-symbols-outlined text-sm">map</span>
                    {t('explore.maps')}
                  </a>
                  {pz.tripadvisor && (
                    <a
                      href={pz.tripadvisor}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-tertiary-container text-tertiary font-headline font-bold uppercase text-xs py-2 px-3 border-2 border-tertiary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-tertiary hover:text-on-tertiary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="material-symbols-outlined text-sm">travel_explore</span>
                      {t('explore.tripAdvisor')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
