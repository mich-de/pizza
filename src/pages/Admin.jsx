import { useState, useCallback, useMemo, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useAllData } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import StatTile from '../components/StatTile';
import PizzeriaRow from '../components/admin/PizzeriaRow';
import AddModal from '../components/admin/AddModal';
import { CATEGORIES } from '../config/adminConfig';
import { fetchWithAuth, fetchCSRF } from '../services/adminApi';

export default function Admin() {
  const { t } = useI18n();
  const { pizzerias, prices, locations, loading, error: fetchError } = useAllData();

  const [rows, setRows] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', cityId: 'sorrento', address: '', phone: '',
    category: 'traditional', rating: 4.0,
    description: '', descriptionIt: '', status: 'open',
    frazione: '', isNew: false, openedAt: '',
    addPrice: false, margheritaPrice: '',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!loading && pizzerias.length > 0 && locations.length > 0) {
      setRows(pizzerias.map(p => ({
        ...p,
        cityName: locations.find(l => l.id === p.cityId)?.name || p.cityId,
        price: prices.find(pr => pr.pizzeriaId === p.id) || null,
      })));
      setInitialized(true);
    }
  }, [pizzerias, prices, locations, loading]);

  useEffect(() => {
    if (fetchError) setError(fetchError);
  }, [fetchError]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const showToast = useCallback((msg, isError = false) => {
    setToast({ msg, isError, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSessionExpired = useCallback(() => {
    showToast(t('admin.sessionExpired'), true);
    window.location.reload();
  }, [showToast, t]);

  const stats = useMemo(() => {
    const total = rows.length;
    const open = rows.filter(r => r.status === 'open').length;
    const closed = rows.filter(r => r.status === 'closed').length;
    const withPrice = rows.filter(r => r.price?.margheritaPrice != null).length;
    const avgPrice = withPrice > 0
      ? rows.reduce((sum, r) => sum + (r.price?.margheritaPrice || 0), 0) / withPrice
      : 0;
    const byCategory = CATEGORIES.map(cat => ({
      cat,
      count: rows.filter(r => r.category === cat && r.status === 'open').length,
    }));
    return { total, open, closed, withPrice, avgPrice, byCategory };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.cityName?.toLowerCase().includes(q) ||
      r.frazione?.toLowerCase().includes(q) ||
      r.address?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totalPages = useMemo(() =>
    pageSize === Infinity ? 1 : Math.ceil(filteredRows.length / pageSize),
  [filteredRows, pageSize]);

  const paginatedRows = useMemo(() =>
    pageSize === Infinity ? filteredRows : filteredRows.slice((page - 1) * pageSize, page * pageSize),
  [filteredRows, pageSize, page]);

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditForm({
      name: row.name, address: row.address, cityId: row.cityId,
      phone: row.phone || '', category: row.category, rating: row.rating,
      description: row.description || '',
      descriptionIt: row.descriptionIt || '',
      status: row.status,
      frazione: row.frazione || '',
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };
  const cancelDelete = () => { setDeleteId(null); };

  const saveEdit = async () => {
    if (!editForm.name || !editForm.cityId) { showToast(t('admin.nameRequired'), true); return; }
    const rating = parseFloat(editForm.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) { showToast(t('admin.ratingRequired'), true); return; }
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth(`/api/pizzerias/${editingId}`, {
        method: 'PUT',
        headers: { 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ ...editForm, rating }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('common.saveError'));
      }
      setRows(prev => prev.map(r => r.id === editingId ? { ...r, ...editForm, rating } : r));
      setEditingId(null);
      setEditForm({});
      showToast(t('admin.toastPizzeriaUpdated'));
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') { handleSessionExpired(); return; }
      showToast(err.message, true);
    }
  };

  const savePrice = async (pizzeriaId, price) => {
    if (isNaN(price) || price < 0 || price > 100) {
      showToast(t('admin.invalidPrice'), true);
      return;
    }
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth(`/api/prices/${pizzeriaId}`, {
        method: 'PUT',
        headers: { 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ margheritaPrice: price, source: 'admin-manual' }),
      });
      if (!res.ok) throw new Error(t('common.saveError'));
      setRows(prev => prev.map(r =>
        r.id === pizzeriaId
          ? { ...r, price: { ...(r.price || {}), pizzeriaId, margheritaPrice: price, lastUpdated: new Date().toISOString(), source: 'admin-manual' } }
          : r
      ));
      showToast(t('admin.toastPriceUpdated'));
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') { handleSessionExpired(); return; }
      showToast(err.message, true);
    }
  };

  const confirmDelete = async (id) => {
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth(`/api/pizzerias/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('common.error'));
      setRows(prev => prev.filter(r => r.id !== id));
      setDeleteId(null);
      if (editingId === id) cancelEdit();
      showToast(t('admin.toastPizzeriaDeleted'));
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') { handleSessionExpired(); return; }
      showToast(err.message, true);
      setDeleteId(null);
    }
  };

  const addPizzeria = async () => {
    if (!addForm.name || !addForm.cityId) { showToast(t('admin.nameRequired'), true); return; }
    const rating = parseFloat(addForm.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) { showToast(t('admin.ratingRequired'), true); return; }
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth('/api/pizzerias/single', {
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
          descriptionIt: addForm.descriptionIt,
          status: addForm.status,
          frazione: addForm.frazione || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('common.saveError'));

      const newId = data.id || data.pizzeria?.id;
      if (addForm.addPrice && addForm.margheritaPrice && newId) {
        const priceRes = await fetchWithAuth(`/api/prices/${newId}`, {
          method: 'PUT',
          headers: { 'X-CSRF-Token': csrfToken },
          body: JSON.stringify({ margheritaPrice: parseFloat(addForm.margheritaPrice), source: 'admin-manual' }),
        });
        if (!priceRes.ok) console.warn('Price save failed after venue creation');
      }

      showToast(t('admin.toastPizzeriaAdded'));
      setShowAddModal(false);
      setAddForm({
        name: '', cityId: 'sorrento', address: '', phone: '',
        category: 'traditional', rating: 4.0,
        description: '', descriptionIt: '', status: 'open',
        frazione: '', isNew: false, openedAt: '',
        addPrice: false, margheritaPrice: '',
      });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') { handleSessionExpired(); return; }
      showToast(err.message, true);
    }
  };

  if (loading || !initialized) return <LoadingSpinner fullScreen />;

  return (
    <div className="w-full">
      {toast && (
        <div key={toast.id} className="fixed top-4 right-4 z-[100] max-w-sm bg-surface shadow-lg no-print">
          <div className={`alert ${toast.isError ? 'alert-error' : 'alert-success'}`}>
            <span className="material-symbols-outlined text-base leading-none">
              {toast.isError ? 'error' : 'check_circle'}
            </span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Niente `PageHeader` qui: questa e' una scheda dentro il Pannello, che
          la sua testatina ce l'ha gia'. Due testatine impilate vogliono dire
          due foto, due tratti tricolore e lo stesso occhiello scritto due
          volte a quattro centimetri di distanza. Qui basta il titolo di
          sezione, col conteggio nel badge — che e' dove vanno i conteggi. */}
      <div className="section-title">
        <h2 className="text-base">{t('admin.title')}</h2>
        <span className="badge badge-ghost font-mono tabular-nums">{rows.length}</span>
      </div>
      <p className="muted small mb-6">{t('admin.subtitle')}</p>

      {/* Quattro conteggi in monospaziato: il flap resta ai prezzi delle righe. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatTile icon="storefront" label={t('admin.totalVenues')} value={stats.total} />
        <StatTile icon="check_circle" label={t('admin.openVenues')} value={stats.open} />
        <StatTile icon="sell" label={t('admin.withPrice')} value={stats.withPrice} />
        <StatTile icon="trending_up" label={t('admin.avgPrice')} value={`${t('common.euro')}${stats.avgPrice.toFixed(2)}`} />
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span className="material-symbols-outlined text-base leading-none">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tutto quel che compone la richiesta — azioni, ricerca, impaginazione —
          non va su carta. */}
      <div className="panel mb-6 no-print">
        <div className="flex gap-3 flex-wrap items-center mb-4">
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <span className="material-symbols-outlined text-base">add</span>
            {t('admin.addNew')}
          </button>
          <button onClick={() => window.location.reload()} className="btn btn-ghost">
            <span className="material-symbols-outlined text-base">refresh</span>
            {t('admin.reload')}
          </button>
        </div>

        <div className="flex gap-3 flex-wrap items-end">
          <label className="field flex-1 min-w-[14rem] mb-0">
            <span>{t('admin.searchPlaceholder')}</span>
            <input
              className="w-full"
              placeholder={t('admin.searchPlaceholder')}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="field mb-0">
            <span>{t('admin.rowsPerPage')}</span>
            <select
              value={pageSize === Infinity ? 'all' : pageSize}
              onChange={(e) => setPageSize(e.target.value === 'all' ? Infinity : Number(e.target.value))}
            >
              <option value="10">{t('admin.pageSize', { n: 10 })}</option>
              <option value="25">{t('admin.pageSize', { n: 25 })}</option>
              <option value="50">{t('admin.pageSize', { n: 50 })}</option>
              <option value="all">{t('admin.allPages')}</option>
            </select>
          </label>
          {search && (
            <button onClick={() => setSearch('')} className="btn btn-ghost">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
          <span className="badge badge-ghost font-mono tabular-nums mb-[.7rem]">
            {filteredRows.length}/{rows.length}
          </span>
        </div>
      </div>

      {/* Pizzeria list */}
      <div className="stack">
        {paginatedRows.map((row) => (
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
            price={row.price}
            onPriceChange={() => {}}
            onPriceSave={savePrice}
          />
        ))}
      </div>

      {filteredRows.length === 0 && (
        <div className="panel text-center py-16">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant block">search_off</span>
          <h3 className="mt-3 mb-1">{t('admin.noResult')}</h3>
          <p className="font-body text-sm text-on-surface-variant mb-0">{t('admin.noResultHint')}</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 flex-wrap mt-8 pt-6 border-t border-outline-variant no-print">
          <span className="font-mono text-sm tabular-nums text-on-surface-variant">
            {t('admin.paginationOf', {
              from: (page - 1) * pageSize + 1,
              to: Math.min(page * pageSize, filteredRows.length),
              total: filteredRows.length,
            })}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost btn-sm">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              {t('admin.previous')}
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-ghost btn-sm">
              {t('admin.next')}
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      <AddModal
        show={showAddModal}
        addForm={addForm}
        setAddForm={setAddForm}
        onAdd={addPizzeria}
        onCancel={() => setShowAddModal(false)}
      />

      {deleteId && (
        <div className="fixed inset-0 bg-black/55 z-[200] flex items-center justify-center p-4 no-print">
          <div className="card card-accent w-full max-w-md">
            <span className="eyebrow">{t('common.delete')}</span>
            <h2 className="mt-1">{t('admin.deleteConfirmTitle', { name: rows.find(r => r.id === deleteId)?.name })}</h2>
            {/* L'ambra avverte, il rosso sta solo sul pulsante che cancella. */}
            <div className="alert alert-warning mb-5">
              <span className="material-symbols-outlined text-base leading-none">warning</span>
              <span>{t('admin.deleteWarning')}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={cancelDelete} className="btn btn-ghost">
                {t('admin.cancel')}
              </button>
              <button onClick={() => confirmDelete(deleteId)} className="btn btn-secondary">
                <span className="material-symbols-outlined text-base">delete_forever</span>
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
