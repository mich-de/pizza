import { useI18n } from '../../i18n/I18nContext';
import { CATEGORIES, CITY_IDS } from '../../config/adminConfig';

export default function AddModal({ show, addForm, setAddForm, onAdd, onCancel }) {
  const { t } = useI18n();
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        <div className="relative">
          <div className="h-2 bg-gradient-to-r from-primary via-[#E8D5B7] to-tertiary" />
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-headline font-black uppercase text-primary">
                  {t('admin.newPizzeria')}
                </h2>
                <p className="font-body text-sm text-on-surface-variant mt-1">
                  {t('admin.newPizzeriaDesc')}
                </p>
              </div>
              <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center border-2 border-outline-variant hover:border-error hover:bg-error-container transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <div className="bg-background border-2 border-outline-variant p-4 md:p-6">
              <h3 className="font-headline font-black text-xs uppercase tracking-widest text-primary/70 mb-4">
                {t('admin.details')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={`${t('admin.name')} *`} value={addForm.name} onChange={v => setAddForm(f => ({ ...f, name: v }))} />
                <Field label={`${t('admin.city')} *`} type="select" value={addForm.cityId} onChange={v => setAddForm(f => ({ ...f, cityId: v }))} options={CITY_IDS} />
                <Field label={t('admin.address')} value={addForm.address} onChange={v => setAddForm(f => ({ ...f, address: v }))} />
                <Field label={t('admin.phone')} value={addForm.phone} onChange={v => setAddForm(f => ({ ...f, phone: v }))} />
                <Field label={t('admin.category')} type="select" value={addForm.category} onChange={v => setAddForm(f => ({ ...f, category: v }))} options={CATEGORIES} />
                <Field label={t('admin.rating')} type="number" step="0.1" min="0" max="5" value={addForm.rating} onChange={v => setAddForm(f => ({ ...f, rating: v }))} />
                <Field label={t('admin.status')} type="select" value={addForm.status} onChange={v => setAddForm(f => ({ ...f, status: v }))} options={['open', 'closed']} />
                <Field label={t('admin.frazione')} value={addForm.frazione} onChange={v => setAddForm(f => ({ ...f, frazione: v }))} />
              </div>
            </div>

            <div className="mt-4 bg-background border-2 border-outline-variant p-4 md:p-6">
              <h3 className="font-headline font-black text-xs uppercase tracking-widest text-primary/70 mb-4">
                {t('admin.descriptions')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary/70 mb-1">{t('admin.descriptionEn')}</label>
                  <textarea className="w-full bg-surface border-2 border-outline-variant p-3 font-body text-sm text-primary focus:border-primary focus:outline-none transition-colors resize-none" rows="3"
                    value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary/70 mb-1">{t('admin.descriptionIt')}</label>
                  <textarea className="w-full bg-surface border-2 border-outline-variant p-3 font-body text-sm text-primary focus:border-primary focus:outline-none transition-colors resize-none" rows="3"
                    value={addForm.descriptionIt} onChange={e => setAddForm(f => ({ ...f, descriptionIt: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="mt-4 bg-background border-2 border-outline-variant p-4 md:p-6">
              <h3 className="font-headline font-black text-xs uppercase tracking-widest text-primary/70 mb-4">
                {t('admin.extras')}
              </h3>
              <div className="flex items-center gap-6 flex-wrap">
                <label className="flex items-center gap-2 font-headline font-bold uppercase text-sm text-primary cursor-pointer select-none">
                  <input type="checkbox" checked={addForm.isNew} onChange={e => setAddForm(f => ({ ...f, isNew: e.target.checked }))}
                    className="w-4 h-4 accent-primary" />
                  {t('admin.newOpening')}
                </label>
                {addForm.isNew && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-black font-headline uppercase tracking-widest text-primary/70">{t('admin.openingDate')}</label>
                    <input type="month" value={addForm.openedAt} onChange={e => setAddForm(f => ({ ...f, openedAt: e.target.value }))}
                      className="bg-surface border-2 border-outline-variant p-2 font-body text-sm focus:border-primary focus:outline-none" />
                  </div>
                )}
                <label className="flex items-center gap-2 font-headline font-bold uppercase text-sm text-primary cursor-pointer select-none">
                  <input type="checkbox" checked={addForm.addPrice} onChange={e => setAddForm(f => ({ ...f, addPrice: e.target.checked }))}
                    className="w-4 h-4 accent-primary" />
                  {t('admin.addPrice')}
                </label>
                {addForm.addPrice && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-black font-headline uppercase tracking-widest text-primary/70">{t('admin.margheritaPrice')} (€)</label>
                    <input type="number" step="0.5" min="0" max="100" value={addForm.margheritaPrice || ''}
                      onChange={e => setAddForm(f => ({ ...f, margheritaPrice: e.target.value }))}
                      className="w-20 bg-surface border-2 border-outline-variant p-2 font-body text-sm focus:border-primary focus:outline-none" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end border-t-2 border-outline-variant pt-6">
              <button onClick={onCancel}
                className="bg-surface text-on-surface font-headline font-bold uppercase text-sm py-3 px-6 border-2 border-outline-variant shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-surface-variant transition-all">
                {t('admin.cancel')}
              </button>
              <button onClick={onAdd}
                className="bg-primary text-on-primary font-headline font-bold uppercase text-sm py-3 px-8 border-2 border-primary shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-fixed-dim hover:text-on-primary transition-all flex items-center gap-2">
                <span className="material-symbols-outlined">add_business</span>
                {t('admin.add')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, options, step, min, max }) {
  return (
    <div>
      <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary/70 mb-1">{label}</label>
      {type === 'select' ? (
        <select className="w-full bg-surface border-2 border-outline-variant p-2.5 font-body text-sm text-primary focus:border-primary focus:outline-none transition-colors cursor-pointer"
          value={value} onChange={e => onChange(e.target.value)}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} step={step} min={min} max={max}
          className="w-full bg-surface border-2 border-outline-variant p-2.5 font-body text-sm text-primary focus:border-primary focus:outline-none transition-colors"
          value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}
