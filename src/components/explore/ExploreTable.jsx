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
  const tierBgColors = { cheap: 'bg-tertiary/5', mid: '', expensive: 'bg-secondary/5' };

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const barWidth = (price) => stats.range > 0 ? ((price - stats.min) / stats.range) * 100 : 50;

  return (
    <div>
      <div className="bg-surface border border-outline-variant rounded-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-variant/70 text-on-surface-variant/80 font-label text-xs uppercase tracking-wider border-b border-outline-variant">
                <th className="p-4 border-r border-outline-variant font-semibold w-10">#</th>
                <th className="p-4 border-r border-outline-variant font-semibold">{t('prices.pizzeria')}</th>
                <th className="p-4 border-r border-outline-variant font-semibold">{t('prices.city')}</th>
                <th className="p-4 border-r border-outline-variant font-semibold text-center w-28">{t('prices.category')}</th>
                <th className="p-4 border-r border-outline-variant font-semibold text-center w-28">{t('prices.margherita')}</th>
                <th className="p-4 border-r border-outline-variant font-semibold text-center w-40">{t('prices.priceDistribution')}</th>
                <th className="p-4 font-semibold text-center w-16">{t('prices.rating')}</th>
              </tr>
            </thead>
            <tbody className="font-body text-sm">
              {paginated.map((pz, idx) => {
                const tier = priceTier(pz.margheritaPrice);
                return (
                  <tr
                    key={`${pz.id}-${idx}`}
                    onClick={() => onSelect?.(pz)}
                    className={`group border-b border-outline-variant cursor-pointer transition-all duration-200 ${tierBgColors[tier]} hover:bg-primary/[0.04]`}
                  >
                    <td className="p-4 border-r border-outline-variant font-mono text-xs text-on-surface-variant/50 align-top relative">
                      <span className="absolute left-0 top-4 bottom-4 w-0.5 bg-primary rounded-full scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-top" />
                      {page * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="p-4 border-r border-outline-variant align-top">
                      <div className="font-medium text-on-surface group-hover:text-primary transition-colors duration-200">{pz.name}</div>
                      <div className="text-xs text-on-surface-variant/60 mt-0.5">{pz.address}</div>
                    </td>
                    <td className="p-4 border-r border-outline-variant text-on-surface-variant/80 align-top group-hover:text-primary/80 transition-colors duration-200">{pz.cityName}</td>
                    <td className="p-4 border-r border-outline-variant text-center align-top">
                      <span className="font-label text-xs text-on-surface-variant/60 group-hover:text-primary/60 transition-colors duration-200">{t(`common.${pz.category === 'wood-fired' ? 'woodFired' : pz.category}`)}</span>
                    </td>
                    <td className="p-4 border-r border-outline-variant text-center align-top">
                      <span className={`font-display font-bold text-lg transition-all duration-200 ${tierColors[tier]} group-hover:scale-110 inline-block`}>
                        €{pz.margheritaPrice?.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 border-r border-outline-variant align-top">
                      <div className="flex items-center gap-2 h-9">
                        <div className="flex-1 h-2 bg-surface-dim rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${tierBarColors[tier]} group-hover:opacity-80`} style={{ width: `${barWidth(pz.margheritaPrice)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center align-top">
                      <div className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-secondary text-sm transition-transform duration-200 group-hover:scale-110" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-medium text-on-surface group-hover:text-primary transition-colors duration-200">{pz.rating}</span>
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
        <div className="flex items-center justify-between mb-8">
          <span className="font-label text-sm text-on-surface-variant/60">
            {t('prices.page')} {page + 1} {t('prices.of')} {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-9 h-9 flex items-center justify-center rounded-sm border border-outline-variant bg-surface text-on-surface-variant/70 hover:bg-surface-variant hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-label text-sm"
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
                  className={`w-9 h-9 rounded-sm font-label text-sm font-medium transition-colors ${
                    pageNum === page
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant bg-surface text-on-surface-variant/70 hover:bg-surface-variant'
                  }`}
                >
                  {pageNum + 1}
                </button>
              ));
            })()}
            {totalPages > 5 && page < totalPages - 3 && <span className="px-1 text-on-surface-variant/40 font-label">…</span>}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="w-9 h-9 flex items-center justify-center rounded-sm border border-outline-variant bg-surface text-on-surface-variant/70 hover:bg-surface-variant hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-label text-sm"
            >
              →
            </button>
          </div>
          <span className="font-label text-sm text-on-surface-variant/60">{t('sidebar.pizzeriasCount', { count: sorted.length })}</span>
        </div>
      )}
    </div>
  );
}
