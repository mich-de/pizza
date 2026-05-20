import { PAGE_SIZE } from '../../config/exploreConfig';

export default function ExploreTable({ sorted, stats, page, setPage, t, onSelect }) {
  const priceTier = (price) => {
    if (stats.range === 0) return 'mid';
    const ratio = (price - stats.min) / stats.range;
    if (ratio < 0.33) return 'cheap';
    if (ratio < 0.66) return 'mid';
    return 'expensive';
  };

  const tierColors = { cheap: 'text-tertiary', mid: 'text-primary', expensive: 'text-secondary' };
  const tierBarColors = { cheap: 'bg-tertiary', mid: 'bg-primary-fixed-dim', expensive: 'bg-secondary' };
  const tierBgColors = { cheap: 'bg-tertiary-container/10', mid: '', expensive: 'bg-secondary-container/10' };

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const barWidth = (price) => stats.range > 0 ? ((price - stats.min) / stats.range) * 100 : 50;

  return (
    <div>
      <div className="bg-surface border-4 border-primary shadow-[5px_5px_0px_0px_rgba(26,26,26,1)] overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary text-on-primary font-headline font-black uppercase tracking-wider text-sm border-b-4 border-primary">
                <th className="p-4 border-r-2 border-outline-variant w-10 hidden md:table-cell">#</th>
                <th className="p-4 border-r-2 border-outline-variant">{t('prices.pizzeria')}</th>
                <th className="p-4 border-r-2 border-outline-variant">{t('prices.city')}</th>
                <th className="p-4 border-r-2 border-outline-variant text-center w-28 hidden md:table-cell">{t('prices.category')}</th>
                <th className="p-4 border-r-2 border-outline-variant text-center w-32">{t('prices.margherita')}</th>
                <th className="p-4 border-r-2 border-outline-variant text-center hidden md:table-cell">{t('prices.priceDistribution')}</th>
                <th className="p-4 text-center w-16">{t('prices.rating')}</th>
              </tr>
            </thead>
            <tbody className="font-body">
              {paginated.map((pz, idx) => {
                const tier = priceTier(pz.margheritaPrice);
                return (
                  <tr
                    key={`${pz.id}-${idx}`}
                    onClick={() => onSelect?.(pz)}
                    className={`group border-b-2 border-outline-variant cursor-pointer transition-colors ${tierBgColors[tier]} hover:bg-primary-container/20`}
                  >
                    <td className="p-4 border-r-2 border-outline-variant font-mono text-sm text-on-surface-variant/50 align-top relative hidden md:table-cell">
                      <span className="absolute left-0 top-4 bottom-4 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                      {page * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="p-4 border-r-2 border-outline-variant align-top">
                      <div className="font-headline font-bold text-base group-hover:text-secondary transition-colors flex items-center gap-2">
                        <span className={pz.status === 'closed' ? 'text-on-surface-variant/50' : 'text-primary'}>{pz.name}</span>
                        {pz.status === 'closed' && (
                          <span className="bg-error text-on-error font-headline font-black text-[10px] uppercase tracking-wider px-1.5 py-0.5">{t('explore.closedPermanently')}</span>
                        )}
                      </div>
                      <div className="font-label text-xs text-on-surface-variant/60 mt-0.5">{pz.address}</div>
                    </td>
                    <td className="p-4 border-r-2 border-outline-variant align-top">
                      <span className="font-body font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">{pz.cityName}</span>
                    </td>
                    <td className="p-4 border-r-2 border-outline-variant text-center align-top hidden md:table-cell">
                      <span className="inline-block bg-surface-variant text-on-surface-variant font-label font-bold text-xs uppercase px-2.5 py-1 rounded-sm border border-outline-variant">
                        {t(`common.${pz.category === 'wood-fired' ? 'woodFired' : pz.category}`)}
                      </span>
                    </td>
                    <td className="p-4 border-r-2 border-outline-variant text-center align-top">
                      <span className={`font-headline font-black text-xl transition-all ${tierColors[tier]} group-hover:scale-110 inline-block`}>
                        &euro;{pz.margheritaPrice?.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 border-r-2 border-outline-variant align-top hidden md:table-cell">
                      <div className="flex items-center gap-2 h-9">
                        <div className="flex-1 h-3 bg-surface-dim border border-outline-variant overflow-hidden rounded-sm">
                          <div className={`h-full transition-all ${tierBarColors[tier]} rounded-sm`} style={{ width: `${barWidth(pz.margheritaPrice)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center align-top">
                      <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-sm px-2 py-0.5">
                        <span className="material-symbols-outlined text-amber-600 text-sm transition-transform group-hover:scale-110" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-headline font-bold text-sm text-amber-800">{pz.rating}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-surface border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-4">
          <span className="font-label text-sm font-bold text-on-surface-variant order-2 sm:order-1">
            {t('prices.page')} {page + 1} {t('prices.of')} {totalPages}
          </span>
          <div className="flex gap-1.5 order-1 sm:order-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 border-2 border-primary font-headline font-bold uppercase text-sm bg-background text-primary hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
            >
              &larr;
            </button>
            {(() => {
              const pageNumbers = [];
              const maxButtons = 5;
              let startPage = Math.max(0, page - 2);
              let endPage = Math.min(totalPages, startPage + maxButtons);
              if (endPage - startPage < maxButtons) {
                startPage = Math.max(0, endPage - maxButtons);
              }
              for (let i = startPage; i < endPage; i++) pageNumbers.push(i);
              return pageNumbers.map((pageNum) => (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 border-2 border-primary font-headline font-bold text-sm transition-all ${pageNum === page ? 'bg-primary text-on-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]' : 'bg-background text-primary hover:bg-surface-variant'}`}
                >
                  {pageNum + 1}
                </button>
              ));
            })()}
            {totalPages > 5 && page < totalPages - 3 && <span className="px-1 self-center font-headline font-bold text-primary">&hellip;</span>}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-4 py-2 border-2 border-primary font-headline font-bold uppercase text-sm bg-background text-primary hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
            >
              &rarr;
            </button>
          </div>
          <span className="font-label text-sm text-on-surface-variant order-3">{t('sidebar.pizzeriasCount', { count: sorted.length })}</span>
        </div>
      )}
    </div>
  );
}
