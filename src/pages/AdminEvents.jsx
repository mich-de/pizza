import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext';
import LoadingSpinner from '../components/LoadingSpinner';
import PosterDrop from '../components/admin/PosterDrop';
import { fetchWithAuth, fetchCSRF } from '../services/adminApi';

/* La scheda vuota di un evento nuovo. Sta qui fuori dal componente perche' e'
   una costante, non uno stato: rigenerarla a ogni disegno faceva ripartire
   l'effetto che azzera il modulo. */
const EMPTY = {
  title: '', titleIt: '', dateStart: '', dateEnd: '', cityId: '',
  venue: '', description: '', descriptionIt: '', type: 'festival',
  imageUrl: '', highlights: [],
};

export default function AdminEvents({ onDataChange }) {
  const { t, lang } = useI18n();
  const [events, setEvents] = useState([]);
  const [towns, setTowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  // null = nessun modulo aperto; 'new' = inserimento; altrimenti l'id in modifica
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const [evts, twns] = await Promise.all([
        fetch('/api/data/events').then(r => r.json()),
        fetch('/api/data/towns').then(r => r.json()),
      ]);
      setEvents(Array.isArray(evts) ? evts : []);
      setTowns(Array.isArray(twns) ? twns : []);
    } catch {
      showToast(t('adminEvents.loadError'), true);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(EMPTY); setEditing('new'); };

  const openEdit = (ev) => {
    setForm({
      ...EMPTY, ...ev,
      imageUrl: ev.imageUrl || '',
      highlights: Array.isArray(ev.highlights) ? ev.highlights : [],
    });
    setEditing(ev.id);
  };

  const closeForm = () => { setEditing(null); setForm(EMPTY); };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.dateStart || !form.dateEnd || !form.cityId) {
      showToast(t('adminEvents.errorRequired'), true);
      return;
    }
    if (form.dateEnd < form.dateStart) {
      showToast(t('adminEvents.errorDateOrder'), true);
      return;
    }

    setSaving(true);
    try {
      const csrfToken = await fetchCSRF();
      const isNew = editing === 'new';
      const body = {
        ...form,
        // Vuoto vuol dire «nessuna immagine», e in archivio si scrive `null`.
        imageUrl: form.imageUrl.trim() || null,
        highlights: form.highlights.filter(h => h.trim()),
      };
      const res = await fetchWithAuth(
        isNew ? '/api/admin/events' : `/api/admin/events/${editing}`,
        { method: isNew ? 'POST' : 'PUT', headers: { 'X-CSRF-Token': csrfToken }, body: JSON.stringify(body) }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t('adminEvents.saveError'));
      }
      showToast(isNew ? t('adminEvents.created') : t('adminEvents.updated'));
      closeForm();
      await load();
      onDataChange?.();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth(`/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      if (!res.ok) throw new Error(t('adminEvents.deleteError'));
      showToast(t('adminEvents.deleted'));
      await load();
      onDataChange?.();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const townName = (id) => towns.find(c => c.id === id)?.name || id;
  const knownTypes = [...new Set(events.map(e => e.type).filter(Boolean))];
  // Il piu' vicino per primo: e' quello su cui si interviene.
  const sorted = [...events].sort((a, b) => (a.dateStart || '').localeCompare(b.dateStart || ''));

  return (
    <div className="w-full">
      {toast && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm bg-surface shadow-lg no-print">
          <div className={`alert ${toast.isError ? 'alert-error' : 'alert-success'}`}>
            <span className="material-symbols-outlined text-base leading-none">
              {toast.isError ? 'error' : 'check_circle'}
            </span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      <div className="section-title">
        <h2 className="text-base">{t('adminEvents.title')}</h2>
        <span className="badge badge-ghost font-mono tabular-nums">{events.length}</span>
        {editing === null && (
          <button onClick={openNew} className="btn btn-primary btn-sm no-print">
            <span className="material-symbols-outlined text-sm">add</span>
            {t('adminEvents.new')}
          </button>
        )}
      </div>
      <p className="muted small mb-6">{t('adminEvents.subtitle')}</p>

      {editing !== null && (
        <EventForm
          form={form}
          set={set}
          setForm={setForm}
          towns={towns}
          knownTypes={knownTypes}
          saving={saving}
          isNew={editing === 'new'}
          onSubmit={handleSave}
          onCancel={closeForm}
          t={t}
        />
      )}

      {sorted.length === 0 && editing === null && (
        <div className="panel text-center py-12">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">event_busy</span>
          <h3 className="mt-3 mb-1">{t('adminEvents.empty')}</h3>
          <p className="font-body text-sm text-on-surface-variant mb-0">{t('adminEvents.emptyDesc')}</p>
        </div>
      )}

      <div className="stack">
        {sorted.map(ev => (
          <EventRow
            key={ev.id}
            ev={ev}
            lang={lang}
            t={t}
            townName={townName}
            saving={saving}
            confirming={confirmDelete === ev.id}
            onEdit={() => openEdit(ev)}
            onAskDelete={() => setConfirmDelete(ev.id)}
            onCancelDelete={() => setConfirmDelete(null)}
            onConfirmDelete={() => handleDelete(ev.id)}
          />
        ))}
      </div>
    </div>
  );
}

function EventRow({ ev, lang, t, townName, saving, confirming, onEdit, onAskDelete, onCancelDelete, onConfirmDelete }) {
  const [y, m, d] = (ev.dateStart || '').split('-');
  const title = lang === 'it' ? (ev.titleIt || ev.title) : ev.title;

  return (
    <div className="tile relative">
      {confirming && (
        /* La conferma copre la tessera invece di aprire una finestra: quello
           che si sta per cancellare resta sotto gli occhi mentre si decide. */
        <div className="absolute inset-0 z-10 bg-surface/95 flex flex-col items-center justify-center gap-3 p-4 text-center">
          <p className="font-body text-sm mb-0">{t('adminEvents.confirmDelete')}</p>
          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={onConfirmDelete} disabled={saving} className="btn btn-secondary btn-sm">
              {saving ? <span className="spinner" /> : <span className="material-symbols-outlined text-sm">delete</span>}
              {t('adminEvents.delete')}
            </button>
            <button onClick={onCancelDelete} disabled={saving} className="btn btn-ghost btn-sm">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 flex-1 min-w-[15rem]">
          {/* Un flap solo per tessera: la data d'inizio, che e' il dato su cui
              si ordina e si decide. L'anno sta sotto come unita'. */}
          <div className="shrink-0 text-center">
            <span className="flap">{d && m ? `${d}.${m}` : '--.--'}</span>
            <span className="unit block text-center">{y || '----'}</span>
          </div>
          {/* La miniatura solo se c'e': un riquadro vuoto al suo posto direbbe
              «manca qualcosa» su ogni evento che la locandina non ce l'ha. */}
          {ev.imageUrl && (
            <img src={ev.imageUrl} alt=""
              className="w-14 h-14 shrink-0 object-cover border border-outline-variant bg-surface-dim" />
          )}
          <div className="min-w-0">
            <h3 className="mb-1">{title}</h3>
            <p className="font-mono text-xs text-on-surface-variant mb-2">
              {townName(ev.cityId)}{ev.venue ? ` · ${ev.venue}` : ''}
            </p>
            <div className="flex gap-2 flex-wrap items-center">
              <span className="badge badge-ghost">{ev.type}</span>
              <span className="font-mono tabular-nums text-xs text-on-surface-variant">
                {ev.dateStart} → {ev.dateEnd}
              </span>
            </div>
          </div>
        </div>

        {/* Modificare ed eliminare compongono una richiesta: fuori di stampa. */}
        <div className="flex gap-2 shrink-0 no-print">
          <button onClick={onEdit} disabled={saving} className="btn btn-ghost btn-sm">
            <span className="material-symbols-outlined text-sm">edit</span>
            {t('adminEvents.edit')}
          </button>
          {/* Neutro, non rosso: qui si chiede di eliminare, non si elimina.
              Nove pulsanti rossi in colonna si annullano a vicenda e il rosso
              smette di dire «attento». Il rosso e' due righe piu' su, sulla
              conferma, che e' il punto in cui il gesto diventa irreversibile. */}
          <button onClick={onAskDelete} disabled={saving}
            className="btn btn-ghost btn-sm" title={t('adminEvents.delete')}>
            <span className="material-symbols-outlined text-sm">delete</span>
            <span className="sr-only sm:not-sr-only">{t('adminEvents.delete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function EventForm({ form, set, setForm, towns, knownTypes, saving, isNew, onSubmit, onCancel, t }) {
  return (
    /* Un modulo compone la richiesta: su carta sparisce. */
    <form onSubmit={onSubmit} className="panel mb-8 no-print">
      <div className="section-title">
        <h2 className="text-base">{isNew ? t('adminEvents.newTitle') : t('adminEvents.editTitle')}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <label className="field">
          <span>{t('adminEvents.fieldTitle')} (EN)</span>
          <input type="text" className="w-full" value={form.title} onChange={set('title')} maxLength={120} required />
        </label>
        <label className="field">
          <span>{t('adminEvents.fieldTitle')} (IT)</span>
          <input type="text" className="w-full" value={form.titleIt} onChange={set('titleIt')} maxLength={120} />
        </label>

        <label className="field">
          <span>{t('adminEvents.fieldDateStart')}</span>
          <input type="date" className="w-full font-mono tabular-nums" value={form.dateStart} onChange={set('dateStart')} required />
        </label>
        <label className="field">
          <span>{t('adminEvents.fieldDateEnd')}</span>
          <input type="date" className="w-full font-mono tabular-nums" value={form.dateEnd} onChange={set('dateEnd')} required />
        </label>

        <label className="field">
          <span>{t('adminEvents.fieldCity')}</span>
          <select className="w-full" value={form.cityId} onChange={set('cityId')} required>
            <option value="">{t('adminEvents.chooseCity')}</option>
            {towns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{t('adminEvents.fieldType')}</span>
          <input type="text" className="w-full" value={form.type} onChange={set('type')} list="tipi-evento" maxLength={40} required />
          <datalist id="tipi-evento">
            {knownTypes.map(k => <option key={k} value={k} />)}
          </datalist>
        </label>
      </div>

      <label className="field">
        <span>{t('adminEvents.fieldVenue')}</span>
        <input type="text" className="w-full" value={form.venue} onChange={set('venue')} maxLength={160} />
      </label>

      <label className="field">
        <span>{t('adminEvents.fieldDescription')} (EN)</span>
        <textarea className="w-full" rows={3} value={form.description} onChange={set('description')} maxLength={2000} />
      </label>
      <label className="field">
        <span>{t('adminEvents.fieldDescription')} (IT)</span>
        <textarea className="w-full" rows={3} value={form.descriptionIt} onChange={set('descriptionIt')} maxLength={2000} />
      </label>

      <label className="field">
        <span>{t('adminEvents.fieldHighlights')}</span>
        {/* Una voce per riga: incollare un elenco e' il gesto piu' probabile. */}
        <textarea
          className="w-full"
          rows={3}
          value={form.highlights.join('\n')}
          onChange={(e) => setForm(f => ({ ...f, highlights: e.target.value.split('\n').slice(0, 12) }))}
          placeholder={t('adminEvents.highlightsPlaceholder')}
        />
      </label>

      {/* La locandina si trascina dentro o si sceglie da disco. Il campo di
          testo col percorso da scrivere a mano non c'e' piu': chiedeva di
          conoscere un file che dal Pannello non si poteva caricare. */}
      <PosterDrop
        value={form.imageUrl || null}
        disabled={saving}
        onChange={(url) => setForm(f => ({ ...f, imageUrl: url || '' }))}
      />

      <div className="flex gap-2 flex-wrap mt-4">
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? <span className="spinner" /> : <span className="material-symbols-outlined text-base">save</span>}
          {saving ? t('adminEvents.saving') : t('adminEvents.save')}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="btn btn-ghost">
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
