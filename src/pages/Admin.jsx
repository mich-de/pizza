import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { useAllData } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader } from '../components/ui';
import PizzeriaRow from '../components/admin/PizzeriaRow';
import AddModal from '../components/admin/AddModal';
import { generateId } from '../config/adminConfig';

const API_BASE = globalThis.process?.env?.VITE_API_BASE || '';

async function fetchWithAuth(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (res.status === 401) {
    try {
      const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (refreshRes.ok) {
        return fetch(`${API_BASE}${url}`, {
          ...options,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...options.headers },
        });
      }
    } catch {}
    throw new Error('SESSION_EXPIRED');
  }
  return res;
}

async function fetchCSRF() {
  const res = await fetch(`${API_BASE}/api/csrf-token`, { credentials: 'include' });
  const data = await res.json();
  return data.csrfToken;
}

export default function Admin() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { pizzerias, locations, loading, error: fetchError } = useAllData();

  const [rows, setRows] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', cityId: 'sorrento', address: '', phone: '', category: 'traditional',
    rating: 4.0, description: '', status: 'open', frazione: '',
    imageUrl: '/images/pizzerias/pizza-1.jpg', isNew: false, openedAt: ''
  });
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { if (fetchError) setError(t('admin.connError') + fetchError); }, [fetchError, t]);

  useEffect(() => {
    if (!pizzerias.length || !locations.length) return;
    setRows(pizzerias.map(p => ({
      ...p,
      cityName: locations.find(l => l.id === p.cityId)?.name || p.cityId,
    })));
    setInitialized(true);
  }, [pizzerias, locations]);

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.cityName.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const showToast = useCallback((msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditForm({
      name: row.name, address: row.address, cityId: row.cityId,
      phone: row.phone || '', category: row.category, rating: row.rating,
      description: row.description || '', status: row.status,
      frazione: row.frazione || '',
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };
  const cancelDelete = () => { setDeleteId(null); };

  const saveEdit = async () => {
    if (!editForm.name || !editForm.cityId) { showToast('Nome e Città obbligatori', true); return; }
    const rating = parseFloat(editForm.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) { showToast('Voto deve essere tra 0 e 5', true); return; }
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth(`${API_BASE}/api/pizzerias/${editingId}`, {
        method: 'PUT',
        headers: { 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ ...editForm, rating }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore aggiornamento');
      }
      setRows(prev => prev.map(r => r.id === editingId ? { ...r, ...editForm, rating } : r));
      setDirty(false);
      setEditingId(null);
      setEditForm({});
      showToast(t('admin.toastPizzeriaUpdated'));
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        navigate('/login');
        return;
      }
      showToast(err.message, true);
    }
  };

  const confirmDelete = async (id) => {
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth(`${API_BASE}/api/pizzerias/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore eliminazione');
      setRows(prev => prev.filter(r => r.id !== id));
      setDeleteId(null);
      if (editingId === id) cancelEdit();
      showToast(t('admin.toastPizzeriaDeleted'));
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        navigate('/login');
        return;
      }
      showToast(err.message, true);
      setDeleteId(null);
    }
  };

  const addPizzeriaToServer = async () => {
    if (!addForm.name || !addForm.cityId) { showToast('Nome e Città obbligatori', true); return; }
    const rating = parseFloat(addForm.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) { showToast('Voto deve essere tra 0 e 5', true); return; }

    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth(`${API_BASE}/api/pizzerias/single`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          name: addForm.name,
          cityId: addForm.cityId,
          address: addForm.address,
          phone: addForm.phone,
          category: addForm.category,
          rating,
          description: addForm.description,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore creazione');
      }
      showToast(t('admin.toastPizzeriaAdded'));
      setShowAddModal(false);
      setAddForm({ name: '', cityId: 'sorrento', address: '', phone: '', category: 'traditional',
        rating: 4.0, description: '', status: 'open', frazione: '',
        imageUrl: '/images/pizzerias/pizza-1.jpg', isNew: false, openedAt: '' });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        navigate('/login');
        return;
      }
      showToast(err.message, true);
    }
  };

  const addPizzeria = () => {
    if (!addForm.name || !addForm.cityId) { showToast('Nome e Città obbligatori', true); return; }
    const rating = parseFloat(addForm.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) { showToast('Voto deve essere tra 0 e 5', true); return; }
    const newP = {
      id: generateId(), ...addForm, rating,
      frazione: addForm.frazione || null,
      openedAt: addForm.isNew ? (addForm.openedAt || new Date().toISOString().slice(0, 7)) : '',
    };
    setRows(prev => [...prev, { ...newP, cityName: locations.find(l => l.id === newP.cityId)?.name || newP.cityId }]);
    setDirty(true);
    setShowAddModal(false);
    setAddForm({ name: '', cityId: 'sorrento', address: '', phone: '', category: 'traditional',
      rating: 4.0, description: '', status: 'open', frazione: '',
      imageUrl: '/images/pizzerias/pizza-1.jpg', isNew: false, openedAt: '' });
    showToast(t('admin.toastPizzeriaAdded'));
  };

  const exportJSON = () => {
    const json = rows.map(r => ({
      id: r.id, name: r.name, address: r.address, cityId: r.cityId,
      phone: r.phone || '', category: r.category, rating: r.rating,
      description: r.description || '', status: r.status,
      frazione: r.frazione || null, imageUrl: r.imageUrl || '',
      ...(r.isNew && { isNew: true }), ...(r.openedAt && { openedAt: r.openedAt }),
    }));
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'venues.json'; a.click();
    URL.revokeObjectURL(url);
    showToast(t('admin.toastExported'));
  };

  const reloadFromServer = () => window.location.reload();

  if (loading || !initialized) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 md:p-12">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] font-headline font-bold uppercase px-6 py-3 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] ${toast.isError ? 'bg-secondary text-on-tertiary' : 'bg-primary text-on-primary'}`}>
          {toast.msg}
        </div>
      )}

      <PageHeader title={t('admin.title')} subtitle={t('admin.subtitle')}>
        <div className="flex gap-3 flex-wrap">
          <button onClick={reloadFromServer} className="flex items-center gap-2 bg-surface text-primary font-headline font-bold uppercase py-3 px-6 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors">
            <span className="material-symbols-outlined">refresh</span> {t('admin.reload')}
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-primary text-on-primary font-headline font-bold uppercase py-3 px-6 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-container hover:text-on-primary-container transition-colors">
            <span className="material-symbols-outlined">add</span> {t('admin.addNew')}
          </button>
          <button onClick={exportJSON} className="flex items-center gap-2 bg-surface text-primary font-headline font-bold uppercase py-3 px-6 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors">
            <span className="material-symbols-outlined">download</span> {t('admin.exportJSON')}
          </button>
        </div>
      </PageHeader>

      {error && (
        <div className="mb-6 bg-error-container text-on-error-container border-4 border-on-error-container p-4 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <span className="material-symbols-outlined text-2xl">error</span>
          <span className="font-headline font-bold uppercase">{error}</span>
        </div>
      )}

      {dirty && (
        <div className="mb-6 bg-secondary text-on-tertiary border-4 border-primary p-4 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <span className="material-symbols-outlined text-on-tertiary text-2xl">warning</span>
          <span className="font-headline font-bold uppercase">{t('admin.unsavedWarning')}</span>
        </div>
      )}

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1 md:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary">search</span>
          <input className="w-full bg-surface border-2 border-primary py-3 pl-12 pr-4 font-label uppercase focus:outline-none focus:border-secondary"
            placeholder={t('admin.searchPlaceholder')} type="text" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="font-headline font-bold text-lg text-primary self-center">{filteredRows.length}/{rows.length}</span>
      </div>

      <div className="space-y-4">
        {filteredRows.map((row) => (
          <PizzeriaRow
            key={row.id}
            row={row}
            isEditing={editingId === row.id}
            editForm={editForm}
            setEditForm={setEditForm}
            onStartEdit={() => startEdit(row)}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onDelete={() => setDeleteId(row.id)}
          />
        ))}
      </div>

      {filteredRows.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant font-headline font-bold uppercase">Nessun risultato</div>
      )}

      <AddModal
        show={showAddModal}
        addForm={addForm}
        setAddForm={setAddForm}
        onAdd={addPizzeria}
        onCancel={() => setShowAddModal(false)}
        onAddToServer={addPizzeriaToServer}
      />

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-headline font-black uppercase text-primary mb-4">
                Eliminare definitivamente {rows.find(r => r.id === deleteId)?.name}?
              </h2>
              <div className="flex gap-3 justify-end">
                <button onClick={cancelDelete} className="bg-surface text-primary font-headline font-bold uppercase py-3 px-6 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors">Annulla</button>
                <button onClick={() => confirmDelete(deleteId)} className="bg-secondary text-on-tertiary font-headline font-bold uppercase py-3 px-6 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors">Elimina</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 bg-surface-variant border-4 border-primary p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <h3 className="text-xl font-black font-headline uppercase text-primary mb-3">Guida Rapida</h3>
        <ul className="font-body font-bold text-on-surface-variant space-y-2 text-sm">
          <li>• Clicca <strong>Modifica</strong> su una pizzeria per cambiare i dati</li>
          <li>• <strong>Esporta JSON</strong> scarica il file venues.json in locale</li>
          <li>• <strong>Ricarica</strong> rilegge i dati dal server</li>
          <li>• Le operazioni di scrittura richiedono autenticazione admin</li>
        </ul>
      </div>
    </div>
  );
}
