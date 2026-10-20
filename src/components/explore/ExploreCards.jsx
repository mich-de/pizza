import { useI18n } from '../../i18n/I18nContext';
import { priceTier } from '../../config/pricesConfig';

/* La categoria di prezzo e' un tratto di colore a sinistra, non una cornice
   colorata: la tessera resta una tessera di tabellone e il tratto dice, prima
   di leggere la cifra, in che fascia sta. */
const TIER_ACCENT = {
  cheap: 'border-l-tertiary',
  mid: 'border-l-primary-fixed-dim',
  expensive: 'border-l-secondary',
};

export default function ExploreCards({ filtered, stats, t, lang, onSelect, onReportPrice }) {
  const { money } = useI18n();

  const handleCardClick = (pz) => {
    onSelect?.(pz);
  };

  const handleReportClick = (pz, e) => {
    e.stopPropagation();
    onReportPrice?.(pz);
  };

  return (
    /* `fade-in` accende l'entrata sfalsata delle tessere: una piega dopo
       l'altra, e si ferma alla sesta — oltre diventa attesa invece di ritmo. */
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 fade-in">
      {filtered.map((pz) => {
        const tier = priceTier(pz.margheritaPrice, stats.min, stats.range);
        return (
          <article
            key={pz.id}
            onClick={() => !pz.closed && handleCardClick(pz)}
            className={`tile border-l-4 ${TIER_ACCENT[tier]} flex flex-col group cursor-pointer ${pz.status === 'closed' ? 'opacity-70' : ''}`}
          >
            <div className="tile-head">
              <div className="flex-1 min-w-0">
                <h3 className="tile-title truncate group-hover:text-secondary transition-colors">{pz.name}</h3>
                <p className="font-body text-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm shrink-0 opacity-60">location_on</span>
                  <span className="truncate">{pz.frazione ? `${pz.frazione}, ${pz.address}` : pz.address}</span>
                </p>
                <span className="eyebrow mt-1.5">{pz.cityName}</span>
              </div>

              {/* Un flap solo per tessera: e' il prezzo, cioe' il dato che si
                  sta cercando. Il punteggio gli sta sotto in glifo neutro —
                  due palette accanto competono e non si legge piu' nessuna. */}
              <div className="price shrink-0">
                <span className="flap">{money(pz.margheritaPrice)}</span><span className="unit">EUR</span>
                <span className="flex items-center justify-end gap-1 mt-1.5 font-mono text-xs tabular-nums text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  {pz.rating}
                </span>
              </div>
            </div>

            {pz.status === 'closed' && (
              <span className="badge badge-error mt-3 self-start">{t('explore.closedPermanently')}</span>
            )}

            <p className="tile-desc flex-1 line-clamp-2">
              {lang === 'it' ? (pz.descriptionIt || pz.description) : pz.description}
            </p>

            {/* La fascia dei comandi: serve a comporre la richiesta, non a
                leggere il risultato, quindi su carta sparisce. */}
            <div className="border-t border-outline-variant pt-3 mt-auto flex items-center justify-between gap-2 flex-wrap no-print">
              <button
                onClick={(e) => handleReportClick(pz, e)}
                className="btn btn-ghost btn-sm"
              >
                <span className="material-symbols-outlined text-sm">edit_note</span>
                {t('explore.reportPrice')}
              </button>
              <div className="flex gap-2">
                <a
                  href={pz.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pz.name + ' ' + pz.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
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
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="material-symbols-outlined text-sm">travel_explore</span>
                    {t('explore.tripAdvisor')}
                  </a>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
