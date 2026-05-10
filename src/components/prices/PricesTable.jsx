import { PAGE_SIZE } from '../../config/pricesConfig';

export default function PricesTable({ sorted, stats, page, setPage, t, editingId, editForm, setEditForm, onStartEdit, onSaveEdit, onCancelEdit, onDelete, editMode, setSelected }) {
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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

  const barWidth = (price) => stats.range > 0 ? ((price - stats.min) / stats.range) * 100 : 50;

  return (
    <div>
      {sorted.length === 0 ? (
        <div className="bg-surface border-4 border-primary p-12 text-center shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] mb-6">
          <span className="material-symbols-outlined text-5xl text-primary mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>local_pizza</span>
          <p className="font-headline font-black text-2xl uppercase text-primary">Nessuna pizzeria trovata</p>
          <p className="font-body text-on-surface-variant mt-2">Prova a modificare i filtri di ricerca</p>
        </div>
      ) : (
      <section className="bg-background border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary text-on-primary font-headline uppercase tracking-widest text-sm border-b-4 border-primary">
                <th className="p-4 border-r-2 border-outline-variant font-bold w-8">#</th>
                <th className="p-4 border-r-2 border-outline-variant font-bold">{t('prices.pizzeria')}</th>
                <th className="p-4 border-r-2 border-outline-variant font-bold">{t('prices.city')}</th>
                <th className="p-4 border-r-2 border-outline-variant font-bold text-center w-32">{t('prices.category')}</th>
                <th className="p-4 border-r-2 border-outline-variant font-bold text-center w-40">{t('prices.margherita')}</th>
                <th className="p-4 border-r-2 border-outline-variant font-bold text-center w-40">{t('prices.priceDistribution')}</th>
                <th className="p-4 border-r-2 border-outline-variant font-bold text-center w-16">{t('prices.rating')}</th>
                <th className="p-4 font-bold text-center w-24">{t('prices.details')}</th>
                {editMode && <th className="p-4 font-bold text-center w-24">Azioni</th>}
              </tr>
            </thead>
            <tbody className="font-body font-semibold">
              {paginated.map((pz, idx) => {
                const tier = priceTier(pz.margheritaPrice);
                const isEditing = editingId === pz.pizzeriaId;
                return (
                  <tr
                    key={`${pz.id}-${idx}`}
                    className={`border-b-2 border-primary hover:bg-surface-variant transition-colors ${tier === 'cheap' ? 'bg-tertiary-container/20' : tier === 'expensive' ? 'bg-secondary-container/20' : ''}`}
                  >
                    <td className="p-4 border-r-2 border-primary font-mono text-xs text-on-surface-variant">{page * PAGE_SIZE + idx + 1}</td>
                    <td className="p-4 border-r-2 border-primary">
                      {isEditing ? (
                        <input type="text" className="w-full bg-surface border-2 border-primary p-1 font-body font-bold text-primary focus:border-secondary" value={editForm.name || pz.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
                      ) : (
                        <>
                          <div className="font-bold">{pz.name}</div>
                          <div className="text-xs text-on-surface-variant">{pz.address}</div>
                        </>
                      )}
                    </td>
                    <td className="p-4 border-r-2 border-primary text-sm">
                      {isEditing ? (
                        <input type="text" className="w-full bg-surface border-2 border-primary p-1 font-body font-bold text-primary focus:border-secondary" value={editForm.cityId || pz.cityId || pz.cityName} onChange={(e) => setEditForm(f => ({ ...f, cityId: e.target.value }))} />
                      ) : (
                        pz.cityName
                      )}
                    </td>
                    <td className="p-4 border-r-2 border-primary text-sm text-center">
                      {isEditing ? (
                        <select className="w-full bg-background border-2 border-primary p-1 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer" value={editForm.category || pz.category} onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))}>
                          <option value="traditional">{t('common.traditional')}</option>
                          <option value="gourmet">{t('common.gourmet')}</option>
                          <option value="wood-fired">{t('common.woodFired')}</option>
                          <option value="restaurant">{t('common.restaurant')}</option>
                        </select>
                      ) : (
                        t(`common.${pz.category === 'wood-fired' ? 'woodFired' : pz.category}`)
                      )}
                    </td>
                    <td className="p-4 border-r-2 border-primary text-center">
                      {isEditing ? (
                        <input type="number" step="0.10" min="0" max="100" className="w-20 bg-background border-2 border-primary p-1 font-body font-bold text-primary focus:border-secondary" value={editForm.margheritaPrice ?? pz.margheritaPrice} onChange={(e) => setEditForm(f => ({ ...f, margheritaPrice: e.target.value }))} />
                      ) : (
                        <span className={`font-headline font-black text-lg ${tier === 'cheap' ? 'text-tertiary' : tier === 'expensive' ? 'text-secondary' : 'text-primary'}`}>
                          €{pz.margheritaPrice?.toFixed(2)}
                        </span>
                      )}
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
                    <td className="p-4 border-r-2 border-primary text-center">
                      <button
                        onClick={() => setSelected(pz)}
                        className="inline-flex items-center gap-1 bg-primary text-on-primary font-headline font-bold uppercase text-xs py-1 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">info</span>
                      </button>
                    </td>
                    {editMode && (
                      <td className="p-4 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          {isEditing ? (
                            <>
                              <button onClick={onSaveEdit} className="bg-primary text-on-primary font-headline font-bold uppercase py-1 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-container hover:text-on-primary-container transition-colors text-xs">OK</button>
                              <button onClick={onCancelEdit} className="bg-surface text-primary font-headline font-bold uppercase py-1 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors text-xs">{t('admin.cancel')}</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => onStartEdit(pz)} className="inline-flex items-center gap-1 bg-secondary text-on-secondary font-headline font-bold uppercase text-xs py-1 px-3 border-2 border-secondary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary-container transition-colors">
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                              <button onClick={() => onDelete(pz.pizzeriaId)} className="inline-flex items-center gap-1 bg-error text-on-error font-headline font-bold uppercase text-xs py-1 px-3 border-2 border-error shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors">
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
      </section>
      )}

      {sorted.length > 0 && totalPages > 1 && (
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
