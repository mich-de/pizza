import { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { CATEGORIES, CITY_IDS } from '../../config/adminConfig';

const CATEGORY_STYLES = {
  'traditional': 'border-l-tertiary bg-tertiary-container/30',
  'gourmet': 'border-l-primary bg-primary-container/20',
  'wood-fired': 'border-l-secondary bg-secondary-container/20',
};

const STATUS_COLORS = {
  open: 'text-tertiary bg-tertiary-container/60',
  closed: 'text-error bg-error-container/60',
  pending: 'text-[#B8860B] bg-[#FFF8DC]/60',
};

export default function PizzeriaRow({ row, isEditing, editForm, setEditForm, onStartEdit, onSaveEdit, onCancelEdit, onDelete, price, onPriceSave }) {
  const { t } = useI18n();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [priceDirty, setPriceDirty] = useState(false);
  const [localPrice, setLocalPrice] = useState(price?.margheritaPrice ?? '');
  const [savingPrice, setSavingPrice] = useState(false);

  const catStyle = CATEGORY_STYLES[row.category] || 'border-l-surface-variant bg-surface';

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
    <div
      className={`relative border-l-8 ${catStyle} border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all duration-300 overflow-hidden ${
        isEditing ? 'ring-2 ring-primary-fixed-dim scale-[1.01]' : 'hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-0.5'
      }`}
    >
      <div className={`p-5 flex flex-col md:flex-row md:items-start gap-4 ${isEditing ? 'bg-primary-container/10' : ''}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-headline font-black text-xl text-primary leading-tight">{row.name}</h3>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-headline font-bold uppercase tracking-widest ${STATUS_COLORS[row.status] || 'bg-surface-variant text-on-surface-variant'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'open' ? 'bg-tertiary' : row.status === 'closed' ? 'bg-error' : 'bg-[#B8860B]'}`} />
              {row.status === 'open' ? t('admin.open') : row.status === 'closed' ? t('admin.closed') : row.status}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5 text-sm text-on-surface-variant font-body">
            <span className="material-symbols-outlined text-base text-primary-fixed-dim">location_on</span>
            <span>{row.address}</span>
            <span className="text-outline">·</span>
            <span className="font-bold text-secondary">{row.cityName}</span>
            {row.frazione && (
              <>
                <span className="text-outline">·</span>
                <span>{row.frazione}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs font-body">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-container/40 text-primary rounded-none font-headline font-bold uppercase tracking-wider">
              {row.category === 'traditional' ? '🍕' : row.category === 'gourmet' ? '✨' : '🔥'} {row.category}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary-container/40 text-secondary rounded-none">
              <span className="text-[#FFD700]">★</span> {row.rating?.toFixed(1)}
            </span>
            {row.phone && (
              <span className="inline-flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-xs">call</span> {row.phone}
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
  const hasPrice = price && price.margheritaPrice != null;
  const displayPrice = priceDirty ? localPrice : (hasPrice ? price.margheritaPrice : '');

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-3 sm:pt-0 border-t-2 sm:border-t-0 border-outline-variant sm:border-l-2 sm:pl-4 sm:border-outline-variant">
      <div className="flex flex-col items-start sm:items-end min-w-[100px]">
        <div className="flex items-center gap-2">
          <span className="font-headline font-black text-sm uppercase tracking-widest text-on-surface-variant">€</span>
          <input
            type="number"
            step="0.5"
            min="0"
            max="100"
            value={displayPrice}
            onChange={(e) => onPriceChange(e.target.value)}
            className={`w-20 text-right bg-transparent border-b-2 font-headline font-black text-xl focus:outline-none transition-colors ${
              priceDirty ? 'border-primary text-primary' : 'border-outline-variant text-secondary hover:border-primary'
            }`}
            placeholder="—"
          />
        </div>
        <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">
          {t('admin.margherita')}
        </span>
        {price?.lastUpdated && !priceDirty && (
          <span className="text-[9px] font-body text-outline mt-0.5">
            {new Date(price.lastUpdated).toLocaleDateString()}
          </span>
        )}
      </div>

      {priceDirty && (
        <button
          onClick={onPriceSave}
          disabled={savingPrice}
          className="bg-primary text-on-primary font-headline font-bold uppercase text-xs py-2 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-fixed-dim hover:text-on-primary transition-all disabled:opacity-50 flex items-center gap-1"
        >
          {savingPrice ? (
            <span className="animate-pulse">{t('admin.saving')}</span>
          ) : (
            <>{t('admin.savePrice')}</>
          )}
        </button>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="bg-surface text-primary font-headline font-bold uppercase text-xs py-2 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-all flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          {t('admin.edit')}
        </button>
        <button
          onClick={onDelete}
          className="bg-surface text-error font-headline font-bold uppercase text-xs py-2 px-3 border-2 border-error shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error hover:text-on-error transition-all"
        >
          {t('admin.delete')}
        </button>
      </div>
    </div>
  );
}

function EditForm({ editForm, setEditForm, onSave, onCancel, onDelete, t }) {
  return (
    <div className="flex flex-col gap-3 w-full md:w-[480px] bg-surface p-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
      <h4 className="font-headline font-black text-sm uppercase tracking-widest text-primary mb-1">{t('admin.editDetails')}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t('admin.name')} value={editForm.name} onChange={v => setEditForm(f => ({ ...f, name: v }))} />
        <Field label={t('admin.city')} type="select" value={editForm.cityId} onChange={v => setEditForm(f => ({ ...f, cityId: v }))} options={CITY_IDS} />
        <Field label={t('admin.address')} value={editForm.address} onChange={v => setEditForm(f => ({ ...f, address: v }))} />
        <Field label={t('admin.phone')} value={editForm.phone} onChange={v => setEditForm(f => ({ ...f, phone: v }))} />
        <Field label={t('admin.category')} type="select" value={editForm.category} onChange={v => setEditForm(f => ({ ...f, category: v }))} options={CATEGORIES} />
        <Field label={t('admin.rating')} type="number" step="0.1" min="0" max="5" value={editForm.rating} onChange={v => setEditForm(f => ({ ...f, rating: v }))} />
        <Field label={t('admin.status')} type="select" value={editForm.status} onChange={v => setEditForm(f => ({ ...f, status: v }))} options={['open', 'closed']} />
        <Field label={t('admin.frazione')} value={editForm.frazione} onChange={v => setEditForm(f => ({ ...f, frazione: v }))} />
      </div>
      <div>
        <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary/70 mb-1">{t('admin.descriptionEn')}</label>
        <textarea className="w-full bg-background border-2 border-outline-variant p-2 font-body text-sm text-primary focus:border-primary focus:outline-none transition-colors resize-none" rows="2"
          value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div>
        <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary/70 mb-1">{t('admin.descriptionIt')}</label>
        <textarea className="w-full bg-background border-2 border-outline-variant p-2 font-body text-sm text-primary focus:border-primary focus:outline-none transition-colors resize-none" rows="2"
          value={editForm.descriptionIt} onChange={e => setEditForm(f => ({ ...f, descriptionIt: e.target.value }))} />
      </div>
      <div className="flex items-center gap-2 pt-1 border-t-2 border-outline-variant">
        <button onClick={onSave} className="bg-primary text-on-primary font-headline font-bold uppercase text-xs py-2.5 px-5 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-fixed-dim hover:text-on-primary transition-all flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">check</span> {t('admin.ok')}
        </button>
        <button onClick={onCancel} className="bg-surface text-on-surface font-headline font-bold uppercase text-xs py-2.5 px-5 border-2 border-outline-variant shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-surface-variant transition-all flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">close</span> {t('admin.cancel')}
        </button>
        <button onClick={onDelete} className="bg-surface text-error font-headline font-bold uppercase text-xs py-2.5 px-5 border-2 border-error shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error hover:text-on-error transition-all ml-auto flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">delete</span> {t('admin.delete')}
        </button>
      </div>
    </div>
  );
}

function DeleteConfirm({ name, onConfirm, onCancel, t }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface border-4 border-error shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-3xl text-error">warning</span>
            <h2 className="text-xl font-headline font-black uppercase text-error leading-tight">
              {t('admin.deleteConfirmTitle', { name })}
            </h2>
          </div>
          <p className="font-body text-on-surface-variant mb-6 text-sm">
            {t('admin.deleteWarning')}
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={onCancel} className="bg-surface text-on-surface font-headline font-bold uppercase text-sm py-3 px-6 border-2 border-outline-variant shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-surface-variant transition-all">{t('admin.cancel')}</button>
            <button onClick={onConfirm} className="bg-error text-on-error font-headline font-bold uppercase text-sm py-3 px-6 border-2 border-error shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error/80 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined">delete_forever</span> {t('common.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, options, step, min, max }) {
  return (
    <div>
      <label className="block text-[10px] font-black font-headline uppercase tracking-widest text-primary/70 mb-1">{label}</label>
      {type === 'select' ? (
        <select className="w-full bg-background border-2 border-outline-variant p-2 font-body text-sm text-primary focus:border-primary focus:outline-none transition-colors cursor-pointer"
          value={value} onChange={e => onChange(e.target.value)}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} step={step} min={min} max={max}
          className="w-full bg-background border-2 border-outline-variant p-2 font-body text-sm text-primary focus:border-primary focus:outline-none transition-colors"
          value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}
