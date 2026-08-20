import { PAGE_SIZE, priceTier, tierLabel } from '../../config/pricesConfig';
import Pagination from '../ui/Pagination';

/* Il livello di prezzo qualifica, quindi non tocca mai il colore d'azione:
   verde «economico», inchiostro «caro», blu di struttura in mezzo. Niente
   fondo di riga colorato — su una tabella fa sembrare la riga selezionata,
   e non lo e'. Il colore sta sul numero e sulla barra, dove significa. */
const tierColors = {
  cheap: { text: 'text-tertiary', bar: 'bg-tertiary' },
  mid: { text: 'text-on-surface', bar: 'bg-primary-fixed-dim' },
  expensive: { text: 'text-secondary', bar: 'bg-secondary' },
};

export default function PricesTable({ sorted, stats, page, setPage, t, editingId, editForm, setEditForm, onStartEdit, onSaveEdit, onCancelEdit, onDelete, editMode, setSelected }) {
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const barWidth = (price) => stats.range > 0 ? ((price - stats.min) / stats.range) * 100 : 50;

  return (
    <div>
      {sorted.length === 0 ? (
        <div className="card text-center py-12 mb-6">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/50 mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>local_pizza</span>
          <h2 className="mb-1">{t('prices.noResults')}</h2>
          <p className="font-body text-on-surface-variant">{t('prices.noResultsDesc')}</p>
        </div>
      ) : (
        /* Il tabellone vero e proprio: intestazione fissa in inchiostro,
           righe separate da filetti. Le colonne non hanno bordi verticali —
           una griglia completa disegna la tabella invece dei dati. */
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
                <th className="w-24 text-center no-print">{t('prices.details')}</th>
                {editMode && <th className="w-28 text-center no-print">{t('common.edit')}</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.map((pz, idx) => {
                const tier = priceTier(pz.margheritaPrice, stats.min, stats.range);
                const tc = tierColors[tier];
                const isEditing = editingId === pz.pizzeriaId;
                const rowNum = page * PAGE_SIZE + idx + 1;
                return (
                  <tr key={`${pz.id}-${idx}`}>
                    <td className="font-mono text-xs text-on-surface-variant/60 hidden md:table-cell">{rowNum}</td>
                    <td>
                      {isEditing ? (
                        <input type="text" className="w-full" value={editForm.name || pz.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
                      ) : (
                        <>
                          <div className="font-display font-semibold uppercase tracking-[0.01em] text-[0.95rem] flex items-center gap-2">
                            <span className={pz.status === 'closed' ? 'text-on-surface-variant/50 line-through' : ''}>{pz.name}</span>
                            {pz.status === 'closed' && (
                              <span className="badge badge-error">{t('explore.closedPermanently')}</span>
                            )}
                          </div>
                          <div className="font-body text-xs text-on-surface-variant/70 mt-0.5">{pz.address}</div>
                        </>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input type="text" className="w-full" value={editForm.cityId || pz.cityId || pz.cityName} onChange={(e) => setEditForm(f => ({ ...f, cityId: e.target.value }))} />
                      ) : (
                        <span className="font-body">{pz.cityName}</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell">
                      {isEditing ? (
                        <select className="w-full" value={editForm.category || pz.category} onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))}>
                          <option value="traditional">{t('common.traditional')}</option>
                          <option value="gourmet">{t('common.gourmet')}</option>
                          <option value="wood-fired">{t('common.woodFired')}</option>
                          <option value="restaurant">{t('common.restaurant')}</option>
                        </select>
                      ) : (
                        <span className="badge badge-ghost">
                          {t(`common.${pz.category === 'wood-fired' ? 'woodFired' : pz.category}`)}
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      {isEditing ? (
                        <input type="number" step="0.10" min="0" max="100" className="w-24 text-right" value={editForm.margheritaPrice ?? pz.margheritaPrice} onChange={(e) => setEditForm(f => ({ ...f, margheritaPrice: e.target.value }))} />
                      ) : (
                        /* Cifre monospaziate a bandiera destra: incolonnate,
                           i centesimi si confrontano a colpo d'occhio. Niente
                           flap qui — venti palette in colonna smettono di
                           essere «l'unica cosa nera della pagina». */
                        <span className={`font-mono text-lg font-semibold tabular-nums tracking-tight ${tc.text}`}>
                          &euro;{pz.margheritaPrice?.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex-1 h-2.5 bg-surface-dim border border-outline-variant overflow-hidden" style={{ borderRadius: 0 }}>
                          <div className={`h-full transition-all ${tc.bar}`} style={{ width: `${barWidth(pz.margheritaPrice)}%`, borderRadius: 0 }} />
                        </div>
                        <span className={`font-mono text-xs w-9 text-right ${tc.text}`}>
                          {tierLabel(tier)}
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      {/* La stella resta un glifo neutro: l'ambra segnala, e
                          un segnale su ogni riga non segnala piu' niente. */}
                      <span className="inline-flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-mono text-sm tabular-nums text-on-surface">{pz.rating}</span>
                      </span>
                    </td>
                    <td className="text-center no-print">
                      <button onClick={() => setSelected(pz)} className="btn btn-ghost btn-sm">
                        <span className="material-symbols-outlined text-sm">info</span>
                        <span className="hidden sm:inline">{t('prices.details')}</span>
                      </button>
                    </td>
                    {editMode && (
                      <td className="text-center no-print">
                        <div className="flex items-center gap-1.5 justify-center">
                          {isEditing ? (
                            <>
                              <button onClick={onSaveEdit} className="btn btn-primary btn-sm">OK</button>
                              <button onClick={onCancelEdit} className="btn btn-ghost btn-sm">{t('admin.cancel')}</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => onStartEdit(pz)} className="btn btn-ghost btn-sm btn-icon" title={t('common.edit')}>
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                              {/* L'unico rosso della tabella: qui si cancella. */}
                              <button onClick={() => onDelete(pz.pizzeriaId)} className="btn btn-secondary btn-sm btn-icon" title={t('common.delete')}>
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
      )}

      {sorted.length > 0 && (
        <Pagination
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          t={t}
          summary={`${sorted.length} ${sorted.length === 1 ? t('prices.pizzeriaSingular') : t('prices.pizzeriaPlural')}`}
        />
      )}
    </div>
  );
}
