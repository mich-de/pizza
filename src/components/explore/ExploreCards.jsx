export default function ExploreCards({ filtered, t, lang, onSelect, onReportPrice }) {

  const handleCardClick = (pz) => {
    onSelect?.(pz);
  };

  const handleReportClick = (pz, e) => {
    e.stopPropagation();
    onReportPrice?.(pz);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {filtered.map((pz) => (
        <article
          key={pz.id}
          onClick={() => handleCardClick(pz)}
          className="bg-surface border border-outline-variant rounded-sm flex flex-col group relative overflow-hidden hover-lift cursor-pointer"
        >
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-display font-bold group-hover:text-primary transition-colors leading-tight truncate">{pz.name}</h3>
                <p className="font-body text-on-surface-variant text-xs flex items-center gap-1 mt-0.5 truncate">
                  <span className="material-symbols-outlined text-sm flex-shrink-0">location_on</span>
                  {pz.frazione ? `${pz.frazione}, ${pz.address}` : pz.address}
                </p>
                <p className="font-body text-on-surface-variant text-xs">{pz.cityName}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="font-display font-bold text-lg text-primary">
                  {t('common.euro')}{pz.margheritaPrice?.toFixed(2)}
                </div>
                <div className="flex items-center justify-end gap-1 font-label font-semibold text-xs text-primary/70">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  {pz.rating}
                </div>
              </div>
            </div>
            <p className="font-body text-sm text-on-surface-variant mb-3 flex-1 leading-relaxed">{lang === 'it' ? (pz.descriptionIt || pz.description) : pz.description}</p>
            <div className="border-t border-outline-variant pt-3 mt-auto flex items-center justify-between">
              <button
                onClick={(e) => handleReportClick(pz, e)}
                className="inline-flex items-center gap-1 text-[11px] font-label font-medium tracking-wider text-primary bg-primary/5 border border-primary/20 rounded-sm px-2.5 py-1 hover:bg-primary hover:text-on-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">edit_note</span>
                {t('explore.reportPrice')}
              </button>
              <div className="flex gap-1.5">
                <a
                  href={pz.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pz.name + ' ' + pz.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-primary text-on-primary font-label font-medium text-[11px] py-1.5 px-2.5 rounded-sm hover:opacity-90 transition-opacity"
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
                    className="flex items-center gap-1 bg-tertiary/10 text-tertiary font-label font-medium text-[11px] py-1.5 px-2.5 rounded-sm border border-tertiary/20 hover:bg-tertiary hover:text-on-tertiary transition-colors"
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
      ))}
    </div>
  );
}
