import { PAGE_SIZE } from '../../config/exploreConfig';

export default function ExploreTable({ sorted, stats, page, setPage, t }) {
  const priceTier = (price) => {
    if (stats.range === 0) return 'mid';
    const ratio = (price - stats.min) / stats.range;
    if (ratio < 0.33) return 'cheap';
    if (ratio < 0.66) return 'mid';
    return 'expensive';
  };

  const tierLabel = (tier) => {
    switch (tier) {
      case 'cheap': return '€';
      case 'mid': return '€€';
      case 'expensive': return '€€€';
    }
  };

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const barWidth = (price) => stats.range > 0 ? ((price - stats.min) / stats.range) * 100 : 50;

  return (
    <div>
      <section className="bg-background border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary text-on-primary font-headline uppercase tracking-widest text-sm border-b-4 border-primary">
                <th className="p-4 border-r-2 border-outline-variant font-bold w-8">#</th>
                <th className="p-4 border-r-2 border-outline-variant font-bold">{t('prices.pizzeria')}</th>
                <th className="p-4 border-r-2 border-outline-variant font-bold">{t('prices.city')}</th>
                <th className="p-4 border-r-2 border-outline-variant font-bold text-center w-32">{t('prices.category')}</th>
                <th className="p-4 border-r-2 border-outline-variant font-bold text-center w-32">{t('prices.margherita')}</th>
                <th className="p-4 border-r-2 border-outline-variant font-bold text-center w-40">{t('prices.priceDistribution')}</th>
                <th className="p-4 border-r-2 border-outline-variant font-bold text-center w-16">{t('prices.rating')}</th>
              </tr>
            </thead>
            <tbody className="font-body font-semibold">
              {paginated.map((pz, idx) => {
                const tier = priceTier(pz.margheritaPrice);
                return (
                  <tr
                    key={`${pz.id}-${idx}`}
                    className={`border-b-2 border-primary hover:bg-surface-variant transition-colors ${tier === 'cheap' ? 'bg-tertiary-container/20' : tier === 'expensive' ? 'bg-secondary-container/20' : ''}`}
                  >
                    <td className="p-4 border-r-2 border-primary font-mono text-xs text-on-surface-variant">{page * PAGE_SIZE + idx + 1}</td>
                    <td className="p-4 border-r-2 border-primary">
                      <div className="font-bold">{pz.name}</div>
                      <div className="text-xs text-on-surface-variant">{pz.address}</div>
                    </td>
                    <td className="p-4 border-r-2 border-primary text-sm">{pz.cityName}</td>
                    <td className="p-4 border-r-2 border-primary text-sm text-center">{t(`common.${pz.category === 'wood-fired' ? 'woodFired' : pz.category}`)}</td>
                    <td className="p-4 border-r-2 border-primary text-center">
                      <span className={`font-headline font-black text-lg ${tier === 'cheap' ? 'text-tertiary' : tier === 'expensive' ? 'text-secondary' : 'text-primary'}`}>
                        €{pz.margheritaPrice?.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 border-r-2 border-primary">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-surface-dim border border-outline-variant overflow-hidden">
                          <div className={`h-full transition-all ${tier === 'cheap' ? 'bg-tertiary' : tier === 'expensive' ? 'bg-secondary' : 'bg-primary-fixed-dim'}`} style={{ width: `${barWidth(pz.margheritaPrice)}%` }} />
                        </div>
                        <span className="font-label text-xs font-bold text-on-surface-variant w-10 text-right">{tierLabel(tier)}</span>
                      </div>
                    </td>
                    <td className="p-4 border-r-2 border-primary text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="text-sm font-bold">{pz.rating}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {totalPages > 1 && (
        <section className="flex items-center justify-between mb-8">
          <span className="font-label text-sm font-bold text-on-surface-variant">
            {t('prices.page')} {page + 1} {t('prices.of')} {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 border-2 border-primary font-headline font-bold uppercase text-sm bg-background text-primary hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
            >
              ←
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
                  className={`w-10 h-10 border-2 border-primary font-headline font-bold text-sm transition-colors ${pageNum === page ? 'bg-primary text-on-primary' : 'bg-background text-primary hover:bg-surface-variant'}`}
                >
                  {pageNum + 1}
                </button>
              ));
            })()}
            {totalPages > 5 && page < totalPages - 3 && <span className="px-2 font-headline font-bold text-primary">…</span>}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-4 py-2 border-2 border-primary font-headline font-bold uppercase text-sm bg-background text-primary hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
            >
              →
            </button>
          </div>
          <span className="font-label text-sm text-on-surface-variant">{sorted.length} {sorted.length === 1 ? 'pizzeria' : 'pizzerie'}</span>
        </section>
      )}
    </div>
  );
}
