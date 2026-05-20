import { PAGE_SIZE } from '../../config/pricesConfig';

const priceTierFn = (price, min, range) => {
  if (range === 0) return 'mid';
  const ratio = (price - min) / range;
  if (ratio < 0.33) return 'cheap';
  if (ratio < 0.66) return 'mid';
  return 'expensive';
};

const tierColors = {
  cheap: { text: 'text-tertiary', bg: 'bg-tertiary', bar: 'bg-tertiary', row: 'bg-tertiary-container/15' },
  mid: { text: 'text-primary', bg: 'bg-primary-fixed-dim', bar: 'bg-primary-fixed-dim', row: '' },
  expensive: { text: 'text-secondary', bg: 'bg-secondary', bar: 'bg-secondary', row: 'bg-secondary-container/15' },
};

export default function PricesTable({ sorted, stats, page, setPage, t, editingId, editForm, setEditForm, onStartEdit, onSaveEdit, onCancelEdit, onDelete, editMode, setSelected }) {
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const barWidth = (price) => stats.range > 0 ? ((price - stats.min) / stats.range) * 100 : 50;

  return (
    <div>
      {sorted.length === 0 ? (
        <div className="bg-surface border-4 border-primary p-12 text-center shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] mb-6">
          <span className="material-symbols-outlined text-6xl text-primary mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>local_pizza</span>
          <p className="font-headline font-black text-3xl uppercase text-primary">{t('prices.noResults') || 'Nessuna pizzeria trovata'}</p>
          <p className="font-body text-lg text-on-surface-variant mt-2">{t('prices.adjustFilters') || 'Prova a modificare i filtri di ricerca'}</p>
        </div>
      ) : (
        <div className="bg-surface border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary text-on-primary uppercase tracking-wider text-sm border-b-4 border-primary">
                  <th className="p-4 border-r-2 border-outline-variant font-black font-headline w-10 hidden md:table-cell">#</th>
                  <th className="p-4 border-r-2 border-outline-variant font-black font-headline">{t('prices.pizzeria')}</th>
                  <th className="p-4 border-r-2 border-outline-variant font-black font-headline">{t('prices.city')}</th>
                  <th className="p-4 border-r-2 border-outline-variant font-black font-headline text-center w-28 hidden md:table-cell">{t('prices.category')}</th>
                  <th className="p-4 border-r-2 border-outline-variant font-black font-headline text-center w-36">{t('prices.margherita')}</th>
                  <th className="p-4 border-r-2 border-outline-variant font-black font-headline text-center hidden md:table-cell">{t('prices.priceDistribution')}</th>
                  <th className="p-4 border-r-2 border-outline-variant font-black font-headline text-center w-16">{t('prices.rating')}</th>
                  <th className="p-4 font-black font-headline text-center w-24">{t('prices.details')}</th>
                  {editMode && <th className="p-4 font-black font-headline text-center w-28">{t('common.edit')}</th>}
                </tr>
              </thead>
              <tbody>
                {paginated.map((pz, idx) => {
                  const tier = priceTierFn(pz.margheritaPrice, stats.min, stats.range);
                  const tc = tierColors[tier];
                  const isEditing = editingId === pz.pizzeriaId;
                  const rowNum = page * PAGE_SIZE + idx + 1;
                  return (
                    <tr
                      key={`${pz.id}-${idx}`}
                      className={`border-b border-outline-variant transition-colors hover:bg-surface-variant/60 ${tc.row}`}
                    >
                      <td className="p-4 border-r-2 border-outline-variant font-mono text-sm text-on-surface-variant/60 hidden md:table-cell">{rowNum}</td>
                      <td className="p-4 border-r-2 border-outline-variant">
                        {isEditing ? (
                          <input type="text" className="w-full bg-surface border-2 border-primary p-1.5 font-body font-bold text-primary focus:border-secondary" value={editForm.name || pz.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
                        ) : (
                          <>
                            <div className="font-headline font-bold text-base flex items-center gap-2">
                              <span className={pz.status === 'closed' ? 'text-on-surface-variant/50' : 'text-primary'}>{pz.name}</span>
                              {pz.status === 'closed' && (
                                <span className="bg-error text-on-error font-headline font-black text-[10px] uppercase tracking-wider px-1.5 py-0.5">{t('explore.closedPermanently')}</span>
                              )}
                            </div>
                            <div className="font-label text-xs text-on-surface-variant/70 mt-0.5">{pz.address}</div>
                          </>
                        )}
                      </td>
                      <td className="p-4 border-r-2 border-outline-variant">
                        {isEditing ? (
                          <input type="text" className="w-full bg-surface border-2 border-primary p-1.5 font-body font-bold text-primary focus:border-secondary" value={editForm.cityId || pz.cityId || pz.cityName} onChange={(e) => setEditForm(f => ({ ...f, cityId: e.target.value }))} />
                        ) : (
                          <span className="font-body font-semibold text-base text-on-surface">{pz.cityName}</span>
                        )}
                      </td>
                      <td className="p-4 border-r-2 border-outline-variant text-center hidden md:table-cell">
                        {isEditing ? (
                          <select className="w-full bg-background border-2 border-primary p-1.5 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer" value={editForm.category || pz.category} onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))}>
                            <option value="traditional">{t('common.traditional')}</option>
                            <option value="gourmet">{t('common.gourmet')}</option>
                            <option value="wood-fired">{t('common.woodFired')}</option>
                            <option value="restaurant">{t('common.restaurant')}</option>
                          </select>
                        ) : (
                          <span className="inline-block bg-surface-variant text-on-surface-variant font-label font-bold text-xs uppercase px-2.5 py-1 rounded-sm border border-outline-variant">
                            {t(`common.${pz.category === 'wood-fired' ? 'woodFired' : pz.category}`)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 border-r-2 border-outline-variant text-center">
                        {isEditing ? (
                          <input type="number" step="0.10" min="0" max="100" className="w-24 bg-background border-2 border-primary p-1.5 font-body font-bold text-primary focus:border-secondary text-center" value={editForm.margheritaPrice ?? pz.margheritaPrice} onChange={(e) => setEditForm(f => ({ ...f, margheritaPrice: e.target.value }))} />
                        ) : (
                          <span className={`font-headline font-black text-xl md:text-2xl ${tc.text}`}>
                            &euro;{pz.margheritaPrice?.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 border-r-2 border-outline-variant hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-4 bg-surface-dim border border-outline-variant overflow-hidden rounded-sm">
                            <div className={`h-full transition-all ${tc.bar} rounded-sm`} style={{ width: `${barWidth(pz.margheritaPrice)}%` }} />
                          </div>
                          <span className={`font-label text-xs font-bold w-8 text-right ${tc.text}`}>
                            {tier === 'cheap' ? '\u20AC' : tier === 'expensive' ? '\u20AC\u20AC\u20AC' : '\u20AC\u20AC'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 border-r-2 border-outline-variant text-center">
                        <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-sm px-2 py-0.5">
                          <span className="material-symbols-outlined text-amber-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="font-headline font-bold text-sm text-amber-800">{pz.rating}</span>
                        </div>
                      </td>
                      <td className="p-4 border-r-2 border-outline-variant text-center">
                        <button
                          onClick={() => setSelected(pz)}
                          className="inline-flex items-center gap-1.5 bg-primary text-on-primary font-headline font-bold uppercase text-xs py-2 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-all hover:-translate-y-0.5"
                        >
                          <span className="material-symbols-outlined text-sm">info</span>
                          <span className="hidden sm:inline">{t('prices.details')}</span>
                        </button>
                      </td>
                      {editMode && (
                        <td className="p-4 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            {isEditing ? (
                              <>
                                <button onClick={onSaveEdit} className="bg-primary text-on-primary font-headline font-bold uppercase py-1.5 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-fixed-dim transition-colors text-xs">OK</button>
                                <button onClick={onCancelEdit} className="bg-surface text-primary font-headline font-bold uppercase py-1.5 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors text-xs">{t('admin.cancel')}</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => onStartEdit(pz)} className="inline-flex items-center gap-1 bg-secondary text-on-secondary font-headline font-bold uppercase text-xs py-1.5 px-2.5 border-2 border-secondary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary-container transition-colors">
                                  <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button onClick={() => onDelete(pz.pizzeriaId)} className="inline-flex items-center gap-1 bg-error text-on-error font-headline font-bold uppercase text-xs py-1.5 px-2.5 border-2 border-error shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors">
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sorted.length > 0 && totalPages > 1 && (
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
          <span className="font-label text-sm text-on-surface-variant order-3">{sorted.length} {sorted.length === 1 ? 'pizzeria' : 'pizzerie'}</span>
        </div>
      )}
    </div>
  );
}
