import { useI18n } from '../../i18n/I18nContext';
import ContributeBox from '../ContributeBox';
import { createPortal } from 'react-dom';
import { useDateTime } from '../../prefs/DateTimeContext';

export function DetailModal({ selected, setSelected, stats, t, lang }) {
  const { money } = useI18n();
  const { formatDate } = useDateTime();
  if (!selected) return null;

  const delta = selected.margheritaPrice - stats.avg;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 no-print"
      onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
    >
      {/* Una sola barra ambra per schermata: e' questa scheda. */}
      <div className="card card-accent w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="eyebrow">{t('prices.detailTitle')}</span>
            <h2 className="mt-1 mb-0">{selected.name}</h2>
          </div>
          <button onClick={() => setSelected(null)} className="btn btn-ghost btn-icon shrink-0">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="chips mt-3">
          {selected.status === 'closed' && (
            <span className="badge badge-error">{t('explore.closedPermanently')}</span>
          )}
          <span className="badge badge-ghost">
            {t(`common.${selected.category === 'wood-fired' ? 'woodFired' : selected.category}`)}
          </span>
          {/* Stella neutra: l'ambra segnala, non qualifica. */}
          <span className="badge badge-ghost inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="font-mono tabular-nums">{selected.rating}</span>
          </span>
          {selected.margheritaPrice === stats.min && (
            <span className="badge badge-success">{t('prices.cheapest')}</span>
          )}
          {selected.margheritaPrice === stats.max && (
            <span className="badge badge-error">{t('prices.priciest')}</span>
          )}
        </div>

        {/* Il flap della schermata: il prezzo, che e' il dato che si viene a
            cercare. Tutto il resto e' chiave/valore. */}
        <div className="panel mt-5">
          <span className="block font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mb-1.5">
            {t('prices.margherita')}
          </span>
          <span className="flap flap-lg">{money(selected.margheritaPrice)}</span><span className="unit">EUR</span>
          <p className="font-label text-[0.72rem] uppercase tracking-[0.09em] text-on-surface-variant mt-2.5">
            {delta < 0 ? t('prices.belowAvg') : delta > 0 ? t('prices.aboveAvg') : t('prices.atAvg')}
            {' '}
            <span className="font-mono tabular-nums">({delta < 0 ? '' : '+'}{money(delta)})</span>
          </p>
        </div>

        <ul className="kv mt-5">
          <li><span className="k">{t('prices.address')}</span><span className="v">{selected.address || '—'}</span></li>
          <li><span className="k">{t('prices.phone')}</span><span className="v">{selected.phone || '—'}</span></li>
          <li><span className="k">{t('prices.lastUpdated')}</span><span className="v">{formatDate(selected.lastUpdated)}</span></li>
          <li>
            <span className="k">{t('prices.source')}</span>
            <span className="v">{selected.priceSource === 'verified' ? t('prices.verified') : t('prices.unverified')}</span>
          </li>
        </ul>

        {selected.description && (
          <div className="mt-5">
            <span className="eyebrow">{t('prices.description')}</span>
            <p className="font-body text-sm mt-1.5 mb-0">
              {lang === 'it' ? (selected.descriptionIt || selected.description) : selected.description}
            </p>
          </div>
        )}

        <ReportPriceSection selected={selected} t={t} />

        <div className="flex gap-2 flex-wrap mt-6 pt-5 border-t border-outline-variant no-print">
          {selected.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.name + ' ' + selected.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <span className="material-symbols-outlined text-base">location_on</span>
              {t('prices.openMaps')}
            </a>
          )}
          <button onClick={() => setSelected(null)} className="btn btn-ghost ml-auto">
            {t('prices.closeModal')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ReportPriceSection({ selected, t }) {
  return (
    <ContributeBox
      pizzeriaId={selected.pizzeriaId || selected.id}
      pizzeriaName={selected.name}
      currentPrice={selected.margheritaPrice}
      priceLabel={t('prices.reportWrongPrice')}
      className="mt-6 pt-5 border-t border-outline-variant"
    />
  );
}

export function EditRow({ row, editForm, setEditForm, onSave, onCancel, t }) {
  return (
    /* La riga in modifica prende la barra ambra interna della tessera attiva:
       e' un segnale di stato, non un fondo colorato. */
    <tr className="row-editing">
      <td className="font-mono text-xs text-on-surface-variant">{row.pizzeriaId}</td>
      <td>
        <div className="font-display uppercase tracking-[0.04em]">{row.name}</div>
        <div className="font-label text-[0.68rem] uppercase tracking-[0.09em] text-on-surface-variant mt-0.5">{row.cityName}</div>
      </td>
      <td className="text-sm">{row.cityName}</td>
      <td className="text-sm">{t(`common.${row.category === 'wood-fired' ? 'woodFired' : row.category}`)}</td>
      <td className="text-center">
        <input
          type="number" step="0.10" min="0" max="100"
          className="w-20 text-center font-mono tabular-nums"
          value={editForm.margheritaPrice}
          onChange={(e) => setEditForm(f => ({ ...f, margheritaPrice: e.target.value }))}
        />
      </td>
      <td>
        <select
          value={editForm.source}
          onChange={(e) => setEditForm(f => ({ ...f, source: e.target.value }))}
        >
          <option value="verified">{t('prices.verified')}</option>
          <option value="unverified">{t('prices.unverified')}</option>
        </select>
      </td>
      <td>
        <input
          type="date"
          className="font-mono"
          value={editForm.lastUpdated ? editForm.lastUpdated.slice(0, 10) : ''}
          onChange={(e) => setEditForm(f => ({ ...f, lastUpdated: new Date(e.target.value).toISOString() }))}
        />
      </td>
      <td className="text-center">
        <div className="flex items-center gap-2 justify-center no-print">
          <button onClick={onSave} className="btn btn-primary btn-sm">{t('admin.ok')}</button>
          <button onClick={onCancel} className="btn btn-ghost btn-sm">{t('admin.cancel')}</button>
        </div>
      </td>
    </tr>
  );
}
