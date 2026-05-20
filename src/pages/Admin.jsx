import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { useAllData } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import PizzeriaRow from '../components/admin/PizzeriaRow';
import AddModal from '../components/admin/AddModal';
import { CATEGORIES } from '../config/adminConfig';

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
    } catch (err) {
      console.debug('Token refresh failed', err);
    }
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
    setTimeout(() => navigate('/login'), 1500);
  }, [navigate, showToast, t]);

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
    <div className="p-6 md:p-12">
      {toast && (
        <div key={toast.id} className="fixed top-4 right-4 z-[100]">
          <div className={`font-headline font-bold uppercase px-6 py-3 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex items-center gap-3 ${
            toast.isError ? 'bg-error text-on-error' : 'bg-primary text-on-primary'
          }`}>
            <span className="material-symbols-outlined">
              {toast.isError ? 'error' : 'check_circle'}
            </span>
            {toast.msg}
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-headline font-black uppercase text-sm tracking-[0.2em] text-on-surface-variant">
            {t('admin.subtitle')}
          </span>
          <span className="w-8 h-[2px] bg-outline-variant" />
          <span className="font-label font-bold uppercase text-xs tracking-wider text-on-surface-variant/60">
            {rows.length} venues
          </span>
        </div>
        <h1 className="font-headline font-black text-5xl md:text-7xl uppercase tracking-tight leading-none text-primary">
          {t('admin.title')}
        </h1>
      </div>

      {/* Stats banner */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex-1 min-w-[160px] bg-surface border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-5">
          <div className="font-headline font-black text-4xl md:text-5xl text-primary">{stats.total}</div>
          <div className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-1">{t('admin.totalVenues')}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-surface border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-5">
          <div className="font-headline font-black text-4xl md:text-5xl text-tertiary">{stats.open}</div>
          <div className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-1">{t('admin.openVenues')}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-surface border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-5">
          <div className="font-headline font-black text-4xl md:text-5xl text-primary">{stats.withPrice}</div>
          <div className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-1">{t('admin.withPrice')}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-surface border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-5">
          <div className="font-headline font-black text-4xl md:text-5xl text-secondary">&euro;{stats.avgPrice.toFixed(1)}</div>
          <div className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-1">{t('admin.avgPrice')}</div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 bg-error-container text-on-error-container border-4 border-error p-4 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <span className="material-symbols-outlined text-2xl">error</span>
          <span className="font-headline font-bold uppercase text-sm">{error}</span>
        </div>
      )}

      {/* Actions bar */}
      <div className="mb-6 flex gap-3 flex-wrap items-center justify-between">
        <div className="flex gap-3 flex-wrap items-center">
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-on-primary font-headline font-bold uppercase py-3.5 px-7 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-all">
            <span className="material-symbols-outlined">add</span> {t('admin.addNew')}
          </button>
          <button onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-surface text-primary font-headline font-bold uppercase py-3.5 px-7 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-all">
            <span className="material-symbols-outlined">refresh</span> {t('admin.reload')}
          </button>
        </div>
      </div>

      {/* Search & filters */}
      <div className="mb-6 flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 md:max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 text-xl">search</span>
          <input className="w-full bg-surface border-4 border-primary py-3.5 pl-12 pr-4 font-body font-bold text-primary uppercase focus:outline-none focus:border-secondary shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
            placeholder={t('admin.searchPlaceholder')} type="text" value={search}
            onChange={(e) => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
        <select value={pageSize === Infinity ? 'all' : pageSize}
          onChange={(e) => setPageSize(e.target.value === 'all' ? Infinity : Number(e.target.value))}
          className="bg-surface border-4 border-primary py-3.5 px-5 font-body font-bold text-primary uppercase focus:outline-none focus:border-secondary cursor-pointer shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
          <option value="10">{t('admin.pageSize', { n: 10 })}</option>
          <option value="25">{t('admin.pageSize', { n: 25 })}</option>
          <option value="50">{t('admin.pageSize', { n: 50 })}</option>
          <option value="all">{t('admin.allPages')}</option>
        </select>
        <span className="font-headline font-bold text-sm uppercase text-on-surface-variant bg-surface-variant border-2 border-primary px-3 py-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
          {filteredRows.length}/{rows.length}
        </span>
      </div>

      {/* Pizzeria list */}
      <div className="space-y-5">
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
        <div className="text-center py-16 bg-surface border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <span className="material-symbols-outlined text-6xl text-outline mb-4 block">search_off</span>
          <div className="font-headline font-black text-2xl uppercase text-on-surface-variant">{t('admin.noResult')}</div>
          <p className="font-body text-sm text-on-surface-variant/60 mt-2">{t('admin.noResultHint')}</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t-4 border-primary">
          <span className="font-body font-bold text-sm text-on-surface-variant">
            {t('admin.paginationOf', {
              from: (page - 1) * pageSize + 1,
              to: Math.min(page * pageSize, filteredRows.length),
              total: filteredRows.length,
            })}
          </span>
          <div className="flex gap-3">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-6 py-3 border-4 border-primary font-headline font-bold uppercase text-sm disabled:opacity-30 hover:bg-primary hover:text-on-primary transition-all shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
              {t('admin.previous')}
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-6 py-3 border-4 border-primary font-headline font-bold uppercase text-sm disabled:opacity-30 hover:bg-primary hover:text-on-primary transition-all shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
              {t('admin.next')}
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
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-surface border-4 border-error shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-3xl text-error">warning</span>
                <h2 className="text-xl font-headline font-black uppercase text-error leading-tight">
                  {t('admin.deleteConfirmTitle', { name: rows.find(r => r.id === deleteId)?.name })}
                </h2>
              </div>
              <p className="font-body text-sm text-on-surface-variant mb-6 leading-relaxed">
                {t('admin.deleteWarning')}
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={cancelDelete}
                  className="bg-surface text-on-surface font-headline font-bold uppercase text-sm py-3 px-6 border-2 border-outline-variant shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-surface-variant transition-all">
                  {t('admin.cancel')}
                </button>
                <button onClick={() => confirmDelete(deleteId)}
                  className="bg-error text-on-error font-headline font-bold uppercase text-sm py-3 px-6 border-2 border-error shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error/80 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined">delete_forever</span> {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
