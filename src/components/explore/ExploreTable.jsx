import { PAGE_SIZE, priceTier, tierLabel } from '../../config/pricesConfig';
import Pagination from '../ui/Pagination';

/* Il livello di prezzo qualifica: verde «economico», inchiostro «caro».
   Nessun fondo di riga colorato — colora la riga e sembra selezionata. */
const tierColors = { cheap: 'text-tertiary', mid: 'text-on-surface', expensive: 'text-secondary' };
const tierBarColors = { cheap: 'bg-tertiary', mid: 'bg-primary-fixed-dim', expensive: 'bg-secondary' };

export default function ExploreTable({ sorted, stats, page, setPage, t, onSelect }) {
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const barWidth = (price) => stats.range > 0 ? ((price - stats.min) / stats.range) * 100 : 50;

  return (
    <div>
      <div className="table-wrap mb-6">
        <table>
          <thead>
            <tr>
              <th className="w-10 hidden md:table-cell">#</th>
              <th>{t('prices.pizzeria')}</th>
              <th>{t('prices.city')}</th>
              <th className="w-28 hidden md:table-cell">{t('prices.category')}</th>
              <th className="w-32 text-right">{t('prices.margherita')}</th>
              <th className="hidden md:table-cell">{t('prices.priceDistribution')}</th>
              <th className="w-16 text-right">{t('prices.rating')}</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((pz, idx) => {
              const tier = priceTier(pz.margheritaPrice, stats.min, stats.range);
              return (
                <tr
                  key={`${pz.id}-${idx}`}
                  onClick={() => onSelect?.(pz)}
                  className="group cursor-pointer"
                >
                  <td className="font-mono text-xs text-on-surface-variant/50 hidden md:table-cell relative">
                    {/* Il tratto ambra che scorre col puntatore: dice quale riga
                        si sta per aprire, e sparisce appena si esce. */}
                    <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-accent scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                    {page * PAGE_SIZE + idx + 1}
                  </td>
                  <td>
                    <div className="font-display font-semibold uppercase tracking-[0.01em] text-[0.95rem] flex items-center gap-2">
                      <span className={pz.status === 'closed' ? 'text-on-surface-variant/50 line-through' : ''}>{pz.name}</span>
                      {pz.status === 'closed' && (
                        <span className="badge badge-error">{t('explore.closedPermanently')}</span>
                      )}
                    </div>
                    <div className="font-body text-xs text-on-surface-variant/60 mt-0.5">{pz.address}</div>
                  </td>
                  <td><span className="font-body">{pz.cityName}</span></td>
                  <td className="hidden md:table-cell">
                    <span className="badge badge-ghost">
                      {t(`common.${pz.category === 'wood-fired' ? 'woodFired' : pz.category}`)}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`font-mono text-lg font-semibold tabular-nums tracking-tight ${tierColors[tier]}`}>
                      &euro;{pz.margheritaPrice?.toFixed(2)}
                    </span>
                  </td>
                  <td className="hidden md:table-cell">
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 h-2.5 bg-surface-dim border border-outline-variant overflow-hidden" style={{ borderRadius: 0 }}>
                        <div className={`h-full transition-all ${tierBarColors[tier]}`} style={{ width: `${barWidth(pz.margheritaPrice)}%`, borderRadius: 0 }} />
                      </div>
                      <span className={`font-mono text-xs w-9 text-right ${tierColors[tier]}`}>
                        {tierLabel(tier)}
                      </span>
                    </div>
                  </td>
                  <td className="text-right">
                    {/* Stella neutra: l'ambra e' il colore del segnale, e un
                        segnale su ogni riga non segnala piu' niente. */}
                    <span className="inline-flex items-center gap-1 text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="font-mono text-sm tabular-nums text-on-surface">{pz.rating}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        t={t}
        summary={t('sidebar.pizzeriasCount', { count: sorted.length })}
      />
    </div>
  );
}
