import { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { CATEGORIES, CITY_IDS } from '../../config/adminConfig';
import { useDateTime } from '../../prefs/DateTimeContext';

/* La categoria e' un tratto di colore a sinistra, non un fondo pieno: la riga
   resta una riga di tabellone e il colore dice a colpo d'occhio di che tipo e'. */
const CATEGORY_STYLES = {
  'traditional': 'border-l-tertiary',
  'gourmet': 'border-l-primary',
  'wood-fired': 'border-l-secondary',
};

/* Lo stato usa i badge del sistema: `pending` e' ambra perche' e' l'unica
   voce che chiede un intervento, e l'ambra e' il colore del segnale. */
const STATUS_BADGE = {
  open: 'badge-success',
  closed: 'badge-error',
  pending: 'badge-warning',
};

export default function PizzeriaRow({ row, isEditing, editForm, setEditForm, onStartEdit, onSaveEdit, onCancelEdit, onDelete, price, onPriceSave }) {
  const { t } = useI18n();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [priceDirty, setPriceDirty] = useState(false);
  const [localPrice, setLocalPrice] = useState(price?.margheritaPrice ?? '');
  const [savingPrice, setSavingPrice] = useState(false);

  const catStyle = CATEGORY_STYLES[row.category] || 'border-l-outline';

  const handlePriceChange = (val) => {
    setLocalPrice(val);
    setPriceDirty(true);
  };

  const handlePriceSave = async () => {
    if (!onPriceSave) return;
    setSavingPrice(true);
    await onPriceSave(row.id, parseFloat(localPrice));
    setSavingPrice(false);
    setPriceDirty(false);
  };

  return (
    <div className={`tile border-l-4 ${catStyle} ${isEditing ? 'highlight' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="tile-title">{row.name}</h3>
            <span className={`badge ${STATUS_BADGE[row.status] || 'badge-ghost'}`}>
              {row.status === 'open' ? t('admin.open') : row.status === 'closed' ? t('admin.closed') : row.status}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 text-sm text-on-surface-variant font-body">
            <span className="material-symbols-outlined text-base opacity-60">location_on</span>
            <span>{row.address}</span>
            <span className="text-outline">&middot;</span>
            <span className="font-semibold text-on-surface">{row.cityName}</span>
            {row.frazione && (
              <>
                <span className="text-outline">&middot;</span>
                <span>{row.frazione}</span>
              </>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2 mt-2.5">
            <span className="badge badge-ghost">{row.category}</span>
            {/* La stella resta neutra: l'ambra e' riservata al segnale. */}
            <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums text-on-surface-variant">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {row.rating?.toFixed(1)}
            </span>
            {row.phone && (
              <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant font-body">
                <span className="material-symbols-outlined text-sm">call</span> {row.phone}
              </span>
            )}
          </div>
        </div>

        {isEditing ? (
          <EditForm
            editForm={editForm}
            setEditForm={setEditForm}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
            onDelete={() => setShowDeleteConfirm(true)}
            t={t}
          />
        ) : (
          <ViewMode
            row={row}
            price={price}
            localPrice={localPrice}
            priceDirty={priceDirty}
            savingPrice={savingPrice}
            onPriceChange={handlePriceChange}
            onPriceSave={handlePriceSave}
            onEdit={onStartEdit}
            onDelete={() => setShowDeleteConfirm(true)}
            t={t}
          />
        )}
      </div>

      {showDeleteConfirm && (
        <DeleteConfirm
          name={row.name}
          onConfirm={() => { onDelete(); setShowDeleteConfirm(false); }}
          onCancel={() => setShowDeleteConfirm(false)}
          t={t}
        />
      )}
    </div>
  );
}

function ViewMode({ price, localPrice, priceDirty, savingPrice, onPriceChange, onPriceSave, onEdit, onDelete, t }) {
  const { formatDate } = useDateTime();
  const hasPrice = price && price.margheritaPrice != null;
  const displayPrice = priceDirty ? localPrice : (hasPrice ? price.margheritaPrice : '');

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-outline-variant sm:border-l sm:pl-4 no-print">
      <div className="flex flex-col items-start sm:items-end min-w-[100px]">
        <div className="flex items-center gap-1.5">
          <span className="font-display text-sm uppercase tracking-[0.1em] text-on-surface-variant">&euro;</span>
          <input
            type="number"
            step="0.5"
            min="0"
            max="100"
            value={displayPrice}
            onChange={(e) => onPriceChange(e.target.value)}
            className={`w-20 text-right font-mono tabular-nums ${priceDirty ? 'text-accent' : ''}`}
            placeholder="—"
          />
        </div>
        <span className="font-label text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mt-1">
          {t('admin.margherita')}
        </span>
        {price?.lastUpdated && !priceDirty && (
          <span className="font-mono text-[0.62rem] text-on-surface-variant/60 mt-0.5">
            {formatDate(price.lastUpdated)}
          </span>
        )}
      </div>

      {priceDirty && (
        <button onClick={onPriceSave} disabled={savingPrice} className="btn btn-primary btn-sm">
          {savingPrice ? <span className="animate-pulse">{t('admin.saving')}</span> : t('admin.savePrice')}
        </button>
      )}

      <div className="flex items-center gap-2">
        <button onClick={onEdit} className="btn btn-ghost btn-sm">
          <span className="material-symbols-outlined text-sm">edit</span>
          {t('admin.edit')}
        </button>
        {/* Il rosso solo qui: e' l'unica azione che non si annulla. */}
        <button onClick={onDelete} className="btn btn-secondary btn-sm">
          {t('admin.delete')}
        </button>
      </div>
    </div>
  );
}

function EditForm({ editForm, setEditForm, onSave, onCancel, onDelete, t }) {
  return (
    <div className="panel flex flex-col gap-3 w-full md:w-[480px] no-print">
      <h4 className="font-display text-sm font-semibold uppercase tracking-[0.09em] text-on-surface">{t('admin.editDetails')}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
        <Field label={t('admin.name')} value={editForm.name} onChange={v => setEditForm(f => ({ ...f, name: v }))} />
        <Field label={t('admin.city')} type="select" value={editForm.cityId} onChange={v => setEditForm(f => ({ ...f, cityId: v }))} options={CITY_IDS} />
        <Field label={t('admin.address')} value={editForm.address} onChange={v => setEditForm(f => ({ ...f, address: v }))} />
        <Field label={t('admin.phone')} value={editForm.phone} onChange={v => setEditForm(f => ({ ...f, phone: v }))} />
        <Field label={t('admin.category')} type="select" value={editForm.category} onChange={v => setEditForm(f => ({ ...f, category: v }))} options={CATEGORIES} />
        <Field label={t('admin.rating')} type="number" step="0.1" min="0" max="5" value={editForm.rating} onChange={v => setEditForm(f => ({ ...f, rating: v }))} />
        <Field label={t('admin.status')} type="select" value={editForm.status} onChange={v => setEditForm(f => ({ ...f, status: v }))} options={['open', 'closed']} />
        <Field label={t('admin.frazione')} value={editForm.frazione} onChange={v => setEditForm(f => ({ ...f, frazione: v }))} />
      </div>
      <label className="field">
        <span>{t('admin.descriptionEn')}</span>
        <textarea className="w-full" rows="2"
          value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
      </label>
      <label className="field">
        <span>{t('admin.descriptionIt')}</span>
        <textarea className="w-full" rows="2"
          value={editForm.descriptionIt} onChange={e => setEditForm(f => ({ ...f, descriptionIt: e.target.value }))} />
      </label>
      <div className="flex items-center gap-2 pt-3 border-t border-outline-variant">
        <button onClick={onSave} className="btn btn-primary btn-sm">
          <span className="material-symbols-outlined text-sm">check</span> {t('admin.ok')}
        </button>
        <button onClick={onCancel} className="btn btn-ghost btn-sm">
          <span className="material-symbols-outlined text-sm">close</span> {t('admin.cancel')}
        </button>
        <button onClick={onDelete} className="btn btn-secondary btn-sm ml-auto">
          <span className="material-symbols-outlined text-sm">delete</span> {t('admin.delete')}
        </button>
      </div>
    </div>
  );
}

function DeleteConfirm({ name, onConfirm, onCancel, t }) {
  return (
    <div className="fixed inset-0 bg-black/55 z-[200] flex items-center justify-center p-4 no-print">
      <div className="card card-accent w-full max-w-md">
        <div className="alert alert-error mb-4">
          <span className="material-symbols-outlined text-base leading-none">warning</span>
          <span>
            <strong>{t('admin.deleteConfirmTitle', { name })}</strong>
            {t('admin.deleteWarning')}
          </span>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="btn btn-ghost">{t('admin.cancel')}</button>
          <button onClick={onConfirm} className="btn btn-secondary">
            <span className="material-symbols-outlined text-base">delete_forever</span> {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, options, step, min, max }) {
  return (
    <label className="field">
      <span>{label}</span>
      {type === 'select' ? (
        <select className="w-full" value={value} onChange={e => onChange(e.target.value)}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} step={step} min={min} max={max} className="w-full"
          value={value} onChange={e => onChange(e.target.value)} />
      )}
    </label>
  );
}
