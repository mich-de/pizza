import { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { CATEGORIES, CITY_IDS, generateId } from '../../config/adminConfig';

const API_BASE = globalThis.process?.env?.VITE_API_BASE || '';

export default function VenueEditModal({ venue, towns, onClose, onSaved, onDeleted }) {
  const { t } = useI18n();
  const isEdit = !!venue;

  const [form, setForm] = useState(() => ({
    name: venue?.name || '',
    cityId: venue?.cityId || CITY_IDS[0],
    address: venue?.address || '',
    phone: venue?.phone || '',
    category: venue?.category || 'traditional',
    rating: venue?.rating ?? 4.0,
    description: venue?.description || '',
    descriptionIt: venue?.descriptionIt || '',
    status: venue?.status || 'open',
    frazione: venue?.frazione || '',
    imageUrl: venue?.imageUrl || '',
    tripadvisor: venue?.tripadvisor || '',
    maps_url: venue?.maps_url || '',
  }));

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  async function fetchCSRF() {
    const res = await fetch(`${API_BASE}/api/csrf-token`, { credentials: 'include' });
    const data = await res.json();
    return data.csrfToken;
  }

  async function handleSave() {
    if (!form.name || !form.cityId) { setError(t('admin.nameRequired')); return; }
    setSaving(true);
    setError('');
    try {
      const csrfToken = await fetchCSRF();
      const url = isEdit
        ? `${API_BASE}/api/pizzerias/${venue.id}`
        : `${API_BASE}/api/pizzerias/single`;
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        ...form,
        rating: parseFloat(form.rating) || 0,
        frazione: form.frazione || null,
        imageUrl: form.imageUrl || null,
        tripadvisor: form.tripadvisor || null,
        maps_url: form.maps_url || null,
      };
      if (!isEdit) body.id = generateId();

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('common.saveError'));
      onSaved?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetch(`${API_BASE}/api/pizzerias/${venue.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('common.error'));
      onDeleted?.(venue.id);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/55 z-[200] flex items-center justify-center p-4 overflow-y-auto no-print" onClick={onClose}>
      {/* Unica superficie a schermo, quindi unica barra ambra (regola 2). */}
      <div className="card card-accent w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <span className="eyebrow">{t('admin.details')}</span>
            <h2 className="mt-1 mb-0">{isEdit ? t('admin.editVenue') : t('admin.addVenue')}</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon shrink-0">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span className="material-symbols-outlined text-base leading-none">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="panel">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <label className="field md:col-span-2">
              <span>{t('admin.name')} *</span>
              <input className="w-full" value={form.name} onChange={e => set('name', e.target.value)} />
            </label>

            <label className="field">
              <span>{t('admin.address')}</span>
              <input className="w-full" value={form.address} onChange={e => set('address', e.target.value)} />
            </label>

            <label className="field">
              <span>{t('admin.frazione')}</span>
              <input className="w-full" value={form.frazione} onChange={e => set('frazione', e.target.value)} />
            </label>

            <label className="field">
              <span>{t('admin.city')}</span>
              <select className="w-full" value={form.cityId} onChange={e => set('cityId', e.target.value)}>
                {CITY_IDS.map(id => (
                  <option key={id} value={id}>{towns?.find(town => town.id === id)?.name || id}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>{t('admin.phone')}</span>
              <input className="w-full" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </label>

            <label className="field">
              <span>{t('admin.category')}</span>
              <select className="w-full" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{t(`common.${cat === 'wood-fired' ? 'woodFired' : cat}`)}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>{t('admin.rating')}</span>
              <input
                type="number" step="0.1" min="0" max="5"
                className="w-full font-mono tabular-nums"
                value={form.rating} onChange={e => set('rating', e.target.value)}
              />
            </label>

            <label className="field md:col-span-2">
              <span>{t('admin.status')}</span>
              <select className="w-full" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="open">{t('admin.statusOpen')}</option>
                <option value="closed">{t('admin.statusClosed')}</option>
                <option value="pending">{t('admin.statusPending')}</option>
              </select>
            </label>
          </div>
        </div>

        <div className="section-title mt-5">
          <h2 className="text-base">{t('admin.descriptions')}</h2>
        </div>
        <label className="field">
          <span>{t('admin.descriptionEn')}</span>
          <textarea rows={3} className="w-full resize-y"
            value={form.description} onChange={e => set('description', e.target.value)} />
        </label>
        <label className="field">
          <span>{t('admin.descriptionIt')} (IT)</span>
          <textarea rows={3} className="w-full resize-y"
            value={form.descriptionIt} onChange={e => set('descriptionIt', e.target.value)} />
        </label>

        <div className="section-title mt-5">
          <h2 className="text-base">{t('admin.extras')}</h2>
        </div>
        <label className="field">
          <span>{t('admin.imageUrl')}</span>
          <input className="w-full font-mono text-sm" value={form.imageUrl}
            onChange={e => set('imageUrl', e.target.value)} placeholder="https://..." />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <label className="field">
            <span>{t('admin.tripadvisor')}</span>
            <input className="w-full font-mono text-sm" value={form.tripadvisor}
              onChange={e => set('tripadvisor', e.target.value)} placeholder="https://..." />
          </label>
          <label className="field">
            <span>{t('admin.mapsUrl')}</span>
            <input className="w-full font-mono text-sm" value={form.maps_url}
              onChange={e => set('maps_url', e.target.value)} placeholder="https://..." />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap mt-6 pt-5 border-t border-outline-variant">
          <div>
            {/* Il rosso solo dove si agisce, e qui l'azione non si annulla. */}
            {isEdit && !confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="btn btn-secondary btn-sm">
                <span className="material-symbols-outlined text-sm">delete</span>
                {t('common.delete')}
              </button>
            ) : isEdit && confirmDelete ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display text-sm uppercase tracking-[0.06em] text-on-surface-variant">
                  {t('admin.confirmDelete')}
                </span>
                <button onClick={handleDelete} disabled={deleting} className="btn btn-secondary btn-sm">
                  {deleting ? t('admin.deleting') : t('admin.confirm')}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm">
                  {t('admin.cancel')}
                </button>
              </div>
            ) : null}
          </div>
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="btn btn-ghost">{t('admin.cancel')}</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              <span className="material-symbols-outlined text-base">check</span>
              {saving ? t('admin.saving') : t('admin.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
