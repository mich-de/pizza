import { useI18n } from '../../i18n/I18nContext';
import { CATEGORIES, CITY_IDS } from '../../config/adminConfig';

export default function AddModal({ show, addForm, setAddForm, onAdd, onCancel }) {
  const { t } = useI18n();
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/55 z-[200] flex items-center justify-center p-4 no-print">
      {/* La scheda dove si lavora porta la barra ambra in testa: qui e' l'unica
          superficie a schermo, quindi la barra e' una sola (regola 2). */}
      <div className="card card-accent w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <span className="eyebrow">{t('admin.details')}</span>
            <h2 className="mt-1 mb-1">{t('admin.newPizzeria')}</h2>
            <p className="font-body text-sm text-on-surface-variant">{t('admin.newPizzeriaDesc')}</p>
          </div>
          <button onClick={onCancel} className="btn btn-ghost btn-icon shrink-0">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="panel">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
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

        <div className="section-title mt-5">
          <h2 className="text-base">{t('admin.descriptions')}</h2>
        </div>
        <label className="field">
          <span>{t('admin.descriptionEn')}</span>
          <textarea className="w-full" rows="3"
            value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
        </label>
        <label className="field">
          <span>{t('admin.descriptionIt')}</span>
          <textarea className="w-full" rows="3"
            value={addForm.descriptionIt} onChange={e => setAddForm(f => ({ ...f, descriptionIt: e.target.value }))} />
        </label>

        <div className="section-title mt-5">
          <h2 className="text-base">{t('admin.extras')}</h2>
        </div>
        <div className="flex items-center gap-x-6 gap-y-3 flex-wrap">
          <label className="checkline">
            <input type="checkbox" checked={addForm.isNew} onChange={e => setAddForm(f => ({ ...f, isNew: e.target.checked }))} />
            <span className="font-display text-sm uppercase tracking-[0.06em]">{t('admin.newOpening')}</span>
          </label>
          {addForm.isNew && (
            <div className="flex items-center gap-2">
              <span className="font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant">{t('admin.openingDate')}</span>
              <input type="month" value={addForm.openedAt} onChange={e => setAddForm(f => ({ ...f, openedAt: e.target.value }))} />
            </div>
          )}
          <label className="checkline">
            <input type="checkbox" checked={addForm.addPrice} onChange={e => setAddForm(f => ({ ...f, addPrice: e.target.checked }))} />
            <span className="font-display text-sm uppercase tracking-[0.06em]">{t('admin.addPrice')}</span>
          </label>
          {addForm.addPrice && (
            <div className="flex items-center gap-2">
              <span className="font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant">{t('admin.margheritaPrice')} (&euro;)</span>
              <input type="number" step="0.5" min="0" max="100" className="w-20 text-right font-mono tabular-nums"
                value={addForm.margheritaPrice || ''}
                onChange={e => setAddForm(f => ({ ...f, margheritaPrice: e.target.value }))} />
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2 justify-end border-t border-outline-variant pt-5">
          <button onClick={onCancel} className="btn btn-ghost">{t('admin.cancel')}</button>
          <button onClick={onAdd} className="btn btn-primary">
            <span className="material-symbols-outlined text-base">add_business</span>
            {t('admin.add')}
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
