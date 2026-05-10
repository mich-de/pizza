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
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-headline font-black uppercase text-primary">
              {isEdit ? t('admin.editVenue') : t('admin.addVenue')}
            </h2>
            <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-error-container text-on-error-container border-2 border-on-error-container p-3 font-headline font-bold uppercase text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-label text-xs tracking-wider text-on-surface-variant mb-1 uppercase">
                {t('admin.name')} *
              </label>
              <input
                className="w-full bg-surface border-2 border-primary py-2 px-3 font-label uppercase focus:outline-none focus:border-secondary"
                value={form.name} onChange={e => set('name', e.target.value)}
              />
            </div>

            <div>
              <label className="block font-label text-xs tracking-wider text-on-surface-variant mb-1 uppercase">
                {t('admin.address')}
              </label>
              <input
                className="w-full bg-surface border-2 border-primary py-2 px-3 font-label uppercase focus:outline-none focus:border-secondary"
                value={form.address} onChange={e => set('address', e.target.value)}
              />
            </div>

            <div>
              <label className="block font-label text-xs tracking-wider text-on-surface-variant mb-1 uppercase">
                {t('admin.frazione')}
              </label>
              <input
                className="w-full bg-surface border-2 border-primary py-2 px-3 font-label uppercase focus:outline-none focus:border-secondary"
                value={form.frazione} onChange={e => set('frazione', e.target.value)}
              />
            </div>

            <div>
              <label className="block font-label text-xs tracking-wider text-on-surface-variant mb-1 uppercase">
                {t('admin.city')}
              </label>
              <select
                className="w-full bg-surface border-2 border-primary py-2 px-3 font-label uppercase focus:outline-none focus:border-secondary cursor-pointer"
                value={form.cityId} onChange={e => set('cityId', e.target.value)}
              >
                {CITY_IDS.map(id => (
                  <option key={id} value={id}>{towns?.find(t => t.id === id)?.name || id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-label text-xs tracking-wider text-on-surface-variant mb-1 uppercase">
                {t('admin.phone')}
              </label>
              <input
                className="w-full bg-surface border-2 border-primary py-2 px-3 font-label uppercase focus:outline-none focus:border-secondary"
                value={form.phone} onChange={e => set('phone', e.target.value)}
              />
            </div>

            <div>
              <label className="block font-label text-xs tracking-wider text-on-surface-variant mb-1 uppercase">
                {t('admin.category')}
              </label>
              <select
                className="w-full bg-surface border-2 border-primary py-2 px-3 font-label uppercase focus:outline-none focus:border-secondary cursor-pointer"
                value={form.category} onChange={e => set('category', e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{t(`common.${cat === 'wood-fired' ? 'woodFired' : cat}`)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-label text-xs tracking-wider text-on-surface-variant mb-1 uppercase">
                {t('admin.rating')}
              </label>
              <input
                type="number" step="0.1" min="0" max="5"
                className="w-full bg-surface border-2 border-primary py-2 px-3 font-label uppercase focus:outline-none focus:border-secondary"
                value={form.rating} onChange={e => set('rating', e.target.value)}
              />
            </div>

            <div>
              <label className="block font-label text-xs tracking-wider text-on-surface-variant mb-1 uppercase">
                {t('admin.status')}
              </label>
              <select
                className="w-full bg-surface border-2 border-primary py-2 px-3 font-label uppercase focus:outline-none focus:border-secondary cursor-pointer"
                value={form.status} onChange={e => set('status', e.target.value)}
              >
                <option value="open">{t('admin.statusOpen')}</option>
                <option value="closed">{t('admin.statusClosed')}</option>
                <option value="pending">{t('admin.statusPending')}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-label text-xs tracking-wider text-on-surface-variant mb-1 uppercase">
                {t('admin.descriptionEn')}
              </label>
              <textarea
                rows={3}
                className="w-full bg-surface border-2 border-primary py-2 px-3 font-body text-sm focus:outline-none focus:border-secondary resize-y"
                value={form.description} onChange={e => set('description', e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-label text-xs tracking-wider text-on-surface-variant mb-1 uppercase">
                {t('admin.descriptionIt')} (IT)
              </label>
              <textarea
                rows={3}
                className="w-full bg-surface border-2 border-primary py-2 px-3 font-body text-sm focus:outline-none focus:border-secondary resize-y"
                value={form.descriptionIt} onChange={e => set('descriptionIt', e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-label text-xs tracking-wider text-on-surface-variant mb-1 uppercase">
                {t('admin.imageUrl')}
              </label>
              <input
                className="w-full bg-surface border-2 border-primary py-2 px-3 font-label uppercase focus:outline-none focus:border-secondary"
                value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block font-label text-xs tracking-wider text-on-surface-variant mb-1 uppercase">
                {t('admin.tripadvisor')}
              </label>
              <input
                className="w-full bg-surface border-2 border-primary py-2 px-3 font-label uppercase focus:outline-none focus:border-secondary"
                value={form.tripadvisor} onChange={e => set('tripadvisor', e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block font-label text-xs tracking-wider text-on-surface-variant mb-1 uppercase">
                {t('admin.mapsUrl')}
              </label>
              <input
                className="w-full bg-surface border-2 border-primary py-2 px-3 font-label uppercase focus:outline-none focus:border-secondary"
                value={form.maps_url} onChange={e => set('maps_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-outline-variant">
            <div>
              {isEdit && !confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="bg-secondary text-on-tertiary font-headline font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors text-sm"
                >
                  {t('common.delete')}
                </button>
              ) : isEdit && confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="font-headline font-bold uppercase text-sm text-on-surface-variant">{t('admin.confirmDelete')}</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-secondary text-on-tertiary font-headline font-bold uppercase py-2 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors text-xs"
                  >
                    {deleting ? t('admin.deleting') : t('admin.confirm')}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="bg-surface text-primary font-headline font-bold uppercase py-2 px-3 border-2 border-primary text-xs"
                  >
                    {t('admin.cancel')}
                  </button>
                </div>
              ) : null}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="bg-surface text-primary font-headline font-bold uppercase py-3 px-6 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors"
              >
                {t('admin.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-on-primary font-headline font-bold uppercase py-3 px-6 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50"
              >
                {saving ? t('admin.saving') : t('admin.save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
