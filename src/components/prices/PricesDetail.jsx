import PriceProposalForm from '../explore/PriceProposalForm';
import { useState } from 'react';
import { createPortal } from 'react-dom';

export function DetailModal({ selected, setSelected, stats, t, lang }) {
  if (!selected) return null;

  const delta = selected.margheritaPrice - stats.avg;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60"
      onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
    >
      <div className="bg-background border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary text-on-primary p-6 flex items-center justify-between">
          <h2 className="font-headline font-black text-2xl uppercase tracking-tight">{t('prices.detailTitle')}</h2>
          <button onClick={() => setSelected(null)} className="w-10 h-10 flex items-center justify-center border-2 border-on-primary hover:bg-secondary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Pizzeria name + badges */}
          <div className="border-b-4 border-primary pb-4">
            <h3 className="text-3xl font-headline font-black text-primary uppercase tracking-tight">{selected.name}</h3>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="bg-primary text-on-primary font-headline font-bold uppercase text-xs py-1 px-3">
                {t(`common.${selected.category === 'wood-fired' ? 'woodFired' : selected.category}`)}
              </span>
              <div className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-bold">{selected.rating}</span>
              </div>
              {selected.margheritaPrice === stats.min && (
                <span className="bg-tertiary-container text-tertiary font-headline font-bold uppercase text-xs py-1 px-3 border-2 border-tertiary">{t('prices.cheapest')}</span>
              )}
              {selected.margheritaPrice === stats.max && (
                <span className="bg-secondary-container text-secondary font-headline font-bold uppercase text-xs py-1 px-3 border-2 border-secondary">{t('prices.priciest')}</span>
              )}
            </div>
          </div>

          {/* Description */}
          {selected.description && (
            <div>
              <div className="text-xs font-black font-headline uppercase tracking-widest text-on-surface-variant mb-1">{t('prices.description')}</div>
              <p className="font-body font-semibold text-primary">{lang === 'it' ? (selected.descriptionIt || selected.description) : selected.description}</p>
            </div>
          )}

          {/* Data fields */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-surface-variant border-2 border-primary p-4">
              <div className="text-xs font-black font-headline uppercase tracking-widest text-on-surface-variant mb-1">{t('prices.address')}</div>
              <div className="font-body font-bold text-primary">{selected.address || '—'}</div>
            </div>

            <div className="bg-surface-variant border-2 border-primary p-4">
              <div className="text-xs font-black font-headline uppercase tracking-widest text-on-surface-variant mb-1">{t('prices.phone')}</div>
              <div className="font-body font-bold text-primary">{selected.phone || '—'}</div>
            </div>

            {/* Margherita price card */}
            <div className="bg-primary-container border-4 border-primary p-4 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <div className="text-xs font-black font-headline uppercase tracking-widest text-primary mb-1">🍕 {t('prices.margherita')}</div>
              <div className="text-4xl font-black font-headline text-primary">€{selected.margheritaPrice?.toFixed(2)}</div>
              <div className="mt-2">
                <span className={`font-headline font-bold uppercase text-xs py-1 px-3 border-2 ${
                  delta < 0 ? 'bg-tertiary-container text-tertiary border-tertiary'
                    : delta > 0 ? 'bg-secondary-container text-secondary border-secondary'
                    : 'bg-surface-variant text-primary border-primary'
                }`}>
                  {delta < 0 ? t('prices.belowAvg') : delta > 0 ? t('prices.aboveAvg') : t('prices.atAvg')} ({delta < 0 ? '' : '+'}{delta.toFixed(2)})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-variant border-2 border-primary p-4">
                <div className="text-xs font-black font-headline uppercase tracking-widest text-on-surface-variant mb-1">{t('prices.lastUpdated')}</div>
                <div className="font-body font-bold text-primary">{formatDate(selected.lastUpdated, lang)}</div>
              </div>
              <div className="bg-surface-variant border-2 border-primary p-4">
                <div className="text-xs font-black font-headline uppercase tracking-widest text-on-surface-variant mb-1">{t('prices.source')}</div>
                <div className="font-body font-bold text-primary">{selected.priceSource === 'verified' ? t('prices.verified') : t('prices.unverified')}</div>
              </div>
            </div>
          </div>

          {/* Segnala prezzo section */}
          <ReportPriceSection selected={selected} t={t} />

          {/* Action buttons */}
          <div className="flex gap-4 pt-2">
            {selected.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.name + ' ' + selected.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-primary text-on-primary font-label font-bold uppercase text-sm py-3 px-6 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-colors"
              >
                <span className="material-symbols-outlined">location_on</span>
                {t('prices.openMaps')}
              </a>
            )}
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-2 bg-background text-primary font-label font-bold uppercase text-sm py-3 px-6 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
              {t('prices.closeModal')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ReportPriceSection({ selected, t }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t-4 border-primary pt-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-surface-variant text-primary font-headline font-bold uppercase py-3 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:text-on-secondary hover:border-secondary transition-colors"
        >
          <span className="material-symbols-outlined">edit_note</span>
          Segnala prezzo errato
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-headline font-black uppercase text-base text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">edit_note</span>
              Segnala prezzo errato
            </h4>
            <button
              onClick={() => setOpen(false)}
              className="font-label text-xs font-bold uppercase text-on-surface-variant hover:text-primary transition-colors"
            >
              Annulla
            </button>
          </div>
          <PriceProposalForm
            pizzeriaId={selected.pizzeriaId || selected.id}
            pizzeriaName={selected.name}
            currentPrice={selected.margheritaPrice}
            onSubmitted={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

function formatDate(iso, lang) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function EditRow({ row, editForm, setEditForm, onSave, onCancel, t }) {
  return (
    <tr className="bg-primary-container">
      <td className="p-4 border-r-2 border-primary font-mono text-xs text-on-surface-variant">{row.pizzeriaId}</td>
      <td className="p-4 border-r-2 border-primary">
        <div className="font-bold">{row.name}</div>
        <div className="text-xs text-on-surface-variant">{row.cityName}</div>
      </td>
      <td className="p-4 border-r-2 border-primary text-sm">{row.cityName}</td>
      <td className="p-4 border-r-2 border-primary text-sm">{t(`common.${row.category === 'wood-fired' ? 'woodFired' : row.category}`)}</td>
      <td className="p-4 border-r-2 border-primary text-center">
        <input
          type="number" step="0.10" min="0" max="100"
          className="w-20 bg-background border-2 border-primary p-1 font-body font-bold text-primary focus:border-secondary"
          value={editForm.margheritaPrice}
          onChange={(e) => setEditForm(f => ({ ...f, margheritaPrice: e.target.value }))}
        />
      </td>
      <td className="p-4 border-r-2 border-primary">
        <select
          className="bg-background border-2 border-primary p-1 font-body font-bold text-primary focus:border-secondary cursor-pointer"
          value={editForm.source}
          onChange={(e) => setEditForm(f => ({ ...f, source: e.target.value }))}
        >
          <option value="verified">{t('prices.verified')}</option>
          <option value="unverified">{t('prices.unverified')}</option>
        </select>
      </td>
      <td className="p-4 border-r-2 border-primary">
        <input
          type="date"
          className="bg-background border-2 border-primary p-1 font-body font-bold text-primary focus:border-secondary"
          value={editForm.lastUpdated ? editForm.lastUpdated.slice(0, 10) : ''}
          onChange={(e) => setEditForm(f => ({ ...f, lastUpdated: new Date(e.target.value).toISOString() }))}
        />
      </td>
      <td className="p-4 text-center">
        <div className="flex items-center gap-2 justify-center">
          <button onClick={onSave} className="bg-primary text-on-primary font-headline font-bold uppercase py-1 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-container hover:text-on-primary-container transition-colors text-xs">OK</button>
          <button onClick={onCancel} className="bg-surface text-primary font-headline font-bold uppercase py-1 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors text-xs">{t('admin.cancel')}</button>
        </div>
      </td>
    </tr>
  );
}
