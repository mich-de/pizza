import { useI18n } from '../../i18n/I18nContext';
import { CATEGORIES, CITY_IDS } from '../../config/adminConfig';

export default function AddModal({ show, addForm, setAddForm, onAdd, onCancel, onAddToServer }) {
  const { t } = useI18n();
  if (!show) return null;

  const hasServer = typeof onAddToServer === 'function';

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-headline font-black uppercase text-primary mb-6">{t('admin.newPizzeria')}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('admin.name') + ' *'} value={addForm.name} onChange={v => setAddForm(f => ({ ...f, name: v }))} />
            <Field label={t('admin.city') + ' *'} type="select" value={addForm.cityId} onChange={v => setAddForm(f => ({ ...f, cityId: v }))} options={CITY_IDS} />
            <Field label={t('admin.address')} value={addForm.address} onChange={v => setAddForm(f => ({ ...f, address: v }))} />
            <Field label={t('admin.phone')} value={addForm.phone} onChange={v => setAddForm(f => ({ ...f, phone: v }))} />
            <Field label={t('admin.category')} type="select" value={addForm.category} onChange={v => setAddForm(f => ({ ...f, category: v }))} options={CATEGORIES} />
            <Field label={t('admin.rating')} type="number" step="0.1" min="0" max="5" value={addForm.rating} onChange={v => setAddForm(f => ({ ...f, rating: v }))} />
            <Field label={t('admin.status')} type="select" value={addForm.status} onChange={v => setAddForm(f => ({ ...f, status: v }))} options={['open', 'closed']} />
            <Field label={t('admin.frazione')} value={addForm.frazione} onChange={v => setAddForm(f => ({ ...f, frazione: v }))} />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary mb-1">{t('admin.descriptionEn')}</label>
            <textarea className="w-full bg-background border-2 border-primary p-2 font-body text-primary focus:border-secondary" rows="2"
              value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary mb-1">{t('admin.descriptionIt')}</label>
            <textarea className="w-full bg-background border-2 border-primary p-2 font-body text-primary focus:border-secondary" rows="2"
              value={addForm.descriptionIt} onChange={e => setAddForm(f => ({ ...f, descriptionIt: e.target.value }))} />
          </div>

          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 font-headline font-bold uppercase text-primary cursor-pointer">
              <input type="checkbox" checked={addForm.isNew} onChange={e => setAddForm(f => ({ ...f, isNew: e.target.checked }))} />
              {t('admin.newOpening')}
            </label>
            {addForm.isNew && (
              <Field label={t('admin.openingDate')} type="month" value={addForm.openedAt} onChange={v => setAddForm(f => ({ ...f, openedAt: v }))} />
            )}
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <button onClick={onCancel} className="bg-surface text-primary font-headline font-bold uppercase py-3 px-6 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors">{t('admin.cancel')}</button>
            {hasServer && (
              <button onClick={onAddToServer} className="bg-tertiary text-on-tertiary font-headline font-bold uppercase py-3 px-6 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-tertiary-container transition-colors">{t('admin.addToServer')}</button>
            )}
            <button onClick={onAdd} className="bg-primary text-on-primary font-headline font-bold uppercase py-3 px-6 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-container hover:text-on-primary-container transition-colors">{t('admin.add')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, options, step, min, max }) {
  return (
    <div>
      <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary mb-1">{label}</label>
      {type === 'select' ? (
        <select className="w-full bg-background border-2 border-primary p-2 font-body text-primary focus:border-secondary"
          value={value} onChange={e => onChange(e.target.value)}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} step={step} min={min} max={max}
          className="w-full bg-background border-2 border-primary p-2 font-body text-primary focus:border-secondary"
          value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}
