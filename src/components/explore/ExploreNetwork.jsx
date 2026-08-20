import { useI18n } from '../../i18n/I18nContext';

export default function ExploreNetwork({ data, networkStats, grouped, cityNames, selectedCity, setSelectedCity, t, onSelect }) {
  const { money } = useI18n();
  const selectedData = selectedCity ? (grouped[selectedCity] || []) : data;

  return (
    <div>
      {/* Il quadro della rete: un flap solo — il prezzo medio, che e' la
          risposta che si viene a cercare — e gli altri conteggi in colonna
          chiave/valore accanto. Due palette affiancate competono. */}
      <div className="panel mb-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-9">
          <div className="shrink-0">
            <span className="block font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mb-1.5">
              {t('network.avgPrice')}
            </span>
            <span className="flap flap-lg">{money(networkStats.avgPrice)}</span><span className="unit">EUR</span>
          </div>

          <ul className="kv flex-1 min-w-0 md:grid-cols-3">
            <li><span className="k">{t('network.totalNodes')}</span><span className="v">{networkStats.totalPizzerias}</span></li>
            <li><span className="k">{t('network.clusters')}</span><span className="v">{networkStats.clusters}</span></li>
            <li><span className="k">{t('network.avgRating')}</span><span className="v">{networkStats.avgRating.toFixed(1)}</span></li>
          </ul>
        </div>
      </div>

      {/* 7/5, non 1/1: la colonna dove si legge il risultato comanda. */}
      <div className="split">
        <div>
          <div className="section-title">
            <h2>{selectedCity ? t('network.cityConnections', { city: selectedCity }) : t('network.allConnections')}</h2>
          </div>
          <div className="flex flex-col gap-2 fade-in">
            {selectedData.map((pz) => (
              <div
                key={pz.id}
                onClick={() => onSelect?.(pz)}
                className="tile flex items-center gap-4 cursor-pointer"
              >
                <span className="w-10 h-10 shrink-0 flex items-center justify-center border border-outline-variant bg-surface-dim text-on-surface-variant">
                  <span className="material-symbols-outlined text-lg">store</span>
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="tile-title text-base truncate flex items-center gap-2">
                    <span className={pz.status === 'closed' ? 'text-on-surface-variant/50 line-through' : ''}>{pz.name}</span>
                    {pz.status === 'closed' && (
                      <span className="badge badge-error">{t('explore.closedPermanently')}</span>
                    )}
                  </h3>
                  <p className="font-body text-xs text-on-surface-variant/70 truncate mt-0.5">{pz.address}</p>
                  <div className="flex items-center gap-2 mt-1 font-label text-[0.68rem] uppercase tracking-[0.09em] text-on-surface-variant">
                    <span>{pz.cityName}</span>
                    <span className="text-outline">&middot;</span>
                    <span>{t(`common.${pz.category === 'wood-fired' ? 'woodFired' : pz.category}`)}</span>
                  </div>
                </div>
                <div className="price shrink-0">
                  <p className="font-mono text-lg font-semibold tabular-nums tracking-tight">&euro;{money(pz.margheritaPrice)}</p>
                  {/* Stella neutra: l'ambra segnala, e un segnale su ogni riga
                      non segnala piu' niente. */}
                  <p className="flex items-center justify-end gap-1 mt-0.5 font-mono text-xs tabular-nums text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {pz.rating}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pz.name + ' ' + pz.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="btn btn-ghost btn-sm btn-icon shrink-0 no-print"
                  title={t('explore.maps')}
                >
                  <span className="material-symbols-outlined text-base">map</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title">
            <h2>{t('network.cityClusters')}</h2>
          </div>
          {/* Scegliere il cluster e' comporre la richiesta: su carta sparisce. */}
          <div className="flex flex-col gap-2 no-print">
            {cityNames.map((city) => {
              const pizzerias = grouped[city];
              const avgCityPrice = pizzerias.reduce((s, p) => s + (p.margheritaPrice || 0), 0) / pizzerias.length;
              const isActive = selectedCity === city;
              return (
                <button
                  key={city}
                  onClick={() => setSelectedCity(isActive ? null : city)}
                  /* Il cluster attivo prende la barra ambra interna di
                     `.tile.highlight`: e' un segnale di stato, non un fondo. */
                  className={`tile text-left w-full ${isActive ? 'highlight' : ''}`}
                >
                  <div className="tile-head">
                    <h3 className="tile-title text-base">{city}</h3>
                    <span className="inline-flex items-center gap-1.5 font-mono text-sm tabular-nums text-on-surface-variant">
                      <span className="material-symbols-outlined text-base">store</span>
                      {pizzerias.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="font-label text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant">
                      {t('network.avg')}
                    </span>
                    <span className="font-mono text-base font-semibold tabular-nums tracking-tight">
                      &euro;{money(avgCityPrice)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
