import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import { checkAuth } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader } from '../components/ui';
import PricesTable from '../components/prices/PricesTable';
import { DetailModal } from '../components/prices/PricesDetail';

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
    } catch (e) { console.error(e); }
    throw new Error('SESSION_EXPIRED');
  }
  return res;
}

async function fetchCSRF() {
  const res = await fetch(`${API_BASE}/api/csrf-token`, { credentials: 'include' });
  const data = await res.json();
  return data.csrfToken;
}

export default function Prices() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { data: allData, loading } = useStitchedData();

  const [zoneFilter, setZoneFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');

  const [sortBy, setSortBy] = useState('price-asc');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [rows, setRows] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth().then(user => setIsAdmin(user?.role === 'admin')).catch(() => {});
  }, []);

  const [prevAllData, setPrevAllData] = useState([]);
  if (allData !== prevAllData && allData.length > 0) {
    setPrevAllData(allData);
    const merged = allData.map((pz) => ({
      priceId: pz.priceId || null,
      pizzeriaId: pz.id,
      name: pz.name,
      cityName: pz.cityName,
      category: pz.category,
      margheritaPrice: pz.margheritaPrice || 0,
      currency: pz.currency || 'EUR',
      lastUpdated: pz.lastUpdated || new Date().toISOString(),
      source: pz.priceSource || 'unverified',
    }));
    setRows(merged);
    setInitialized(true);
  }

  const [prevEditMode, setPrevEditMode] = useState(false);
  const [prevInitialized, setPrevInitialized] = useState(false);
  if (editMode !== prevEditMode || initialized !== prevInitialized) {
    setPrevEditMode(editMode);
    setPrevInitialized(initialized);
    if (!editMode && initialized) { setEditingId(null); setEditForm({}); }
  }

  const data = editMode && initialized ? rows : allData;

  const cities = useMemo(() => ['all', ...new Set(data.map((d) => d.cityName))], [data]);
  const categories = useMemo(() => ['all', ...new Set(data.map((d) => d.category))], [data]);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      const matchZone = zoneFilter === 'all' || p.cityName === zoneFilter;
      const matchCat = catFilter === 'all' || p.category === catFilter;
      const matchPriceMin = priceMin === '' || p.margheritaPrice >= parseFloat(priceMin);
      const matchPriceMax = priceMax === '' || p.margheritaPrice <= parseFloat(priceMax);
      return matchZone && matchCat && matchPriceMin && matchPriceMax;
    });
  }, [data, zoneFilter, catFilter, priceMin, priceMax]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.margheritaPrice - b.margheritaPrice;
        case 'price-desc': return b.margheritaPrice - a.margheritaPrice;
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'rating-desc': return b.rating - a.rating;
        default: return 0;
      }
    });
  }, [filtered, sortBy]);

  const stats = useMemo(() => {
    const prices = sorted.map((p) => p.margheritaPrice || 0);
    const globalPrices = allData.map((p) => p.margheritaPrice || 0);
    const min = prices.length > 0 ? Math.min(...prices) : 0;
    const max = prices.length > 0 ? Math.max(...prices) : 0;
    const avg = prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const median = sortedPrices.length > 0 ? sortedPrices[Math.floor(sortedPrices.length / 2)] : 0;
    const range = max - min;
    const globalAvg = globalPrices.length > 0 ? globalPrices.reduce((s, p) => s + p, 0) / globalPrices.length : 0;
    return { min, max, avg, median, range, globalAvg };
  }, [sorted, allData]);

  const cheapest = sorted.length > 0 ? sorted.find((p) => p.margheritaPrice === stats.min) : null;
  const priciest = sorted.length > 0 ? sorted.find((p) => p.margheritaPrice === stats.max) : null;

  const showToast = useCallback((msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const exportCSV = () => {
    const header = 'Name,City,Category,Price,Rating\n';
    const csvRows = sorted.map((p) => `"${p.name}","${p.cityName}","${p.category}",${p.margheritaPrice},${p.rating}`).join('\n');
    const blob = new Blob([header + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pizza-peninsula-prices.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEdit = (row) => {
    setEditingId(row.pizzeriaId);
    setEditForm({
      margheritaPrice: row.margheritaPrice,
      currency: row.currency,
      source: row.source,
      lastUpdated: row.lastUpdated,
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async () => {
    const price = parseFloat(editForm.margheritaPrice);
    if (isNaN(price) || price < 0 || price > 100) {
      showToast(t('admin.toastInvalidPrice'), true);
      return;
    }

    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth(`${API_BASE}/api/prices/${editingId}`, {
        method: 'PUT',
        headers: { 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ ...editForm, margheritaPrice: price }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('common.saveError'));
      }

      setRows((prev) =>
        prev.map((r) =>
          r.pizzeriaId === editingId ? { ...r, ...editForm, margheritaPrice: price, lastUpdated: new Date().toISOString() } : r
        )
      );
      setEditingId(null);
      setEditForm({});
      showToast(t('admin.toastRowUpdated'));
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        navigate('/login');
        return;
      }
      showToast(err.message, true);
    }
  };

  const deletePrice = async (pizzeriaId) => {
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth(`${API_BASE}/api/prices/${pizzeriaId}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('common.error'));
      }

      setRows((prev) => prev.filter((r) => r.pizzeriaId !== pizzeriaId));
      setDeleteId(null);
      showToast(t('admin.toastRowDeleted'));
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        navigate('/login');
        return;
      }
      showToast(err.message, true);
    }
  };

  const exportJSON = () => {
    const json = rows.map((r) => ({
      id: r.priceId || `pr-new-${r.pizzeriaId}`,
      pizzeriaId: r.pizzeriaId,
      margheritaPrice: r.margheritaPrice,
      currency: r.currency,
      lastUpdated: r.lastUpdated,
      source: r.source,
    }));
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prices.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('admin.toastExported'));
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 md:p-12">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] font-headline font-bold uppercase px-6 py-3 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] ${toast.isError ? 'bg-secondary text-on-tertiary' : 'bg-primary text-on-primary'}`}>
          {toast.msg}
        </div>
      )}

      <PageHeader title={t('prices.title')} subtitle={t('prices.subtitle')}>
        <div className="flex items-center gap-3">
          {editMode && (
            <>
              <button onClick={exportJSON} className="flex items-center gap-2 bg-surface text-primary font-headline font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors text-sm">
                <span className="material-symbols-outlined text-sm">download</span>
                {t('admin.exportJSON')}
              </button>
            </>
          )}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-background text-primary font-headline font-bold uppercase py-3 px-6 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors"
          >
            <span className="material-symbols-outlined">download</span>
            {t('prices.exportCSV')}
          </button>
          {isAdmin && (
            <button
              onClick={() => setEditMode((v) => !v)}
              className={`flex items-center gap-2 font-headline font-bold uppercase py-3 px-6 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-colors ${
                editMode ? 'bg-tertiary text-on-tertiary hover:bg-primary hover:text-on-primary' : 'bg-primary text-on-primary hover:bg-secondary'
              }`}
            >
              <span className="material-symbols-outlined">{editMode ? 'visibility' : 'edit'}</span>
              {editMode ? t('common.view') : t('common.edit')}
            </button>
          )}
        </div>
      </PageHeader>

      <div className="flex items-center gap-4 mb-6">
        <span className="font-headline font-bold uppercase text-sm bg-secondary text-on-secondary px-3 py-1 border-2 border-primary">
          {allData.length} {allData.length === 1 ? t('prices.pizzeriaSingular') : t('prices.pizzeriaPlural')}
        </span>
        <span className="font-headline font-bold uppercase text-sm text-on-surface-variant">
          {cities.length - 1} {t('nav.network')}
        </span>
        <span className="font-headline font-bold uppercase text-sm bg-tertiary text-on-tertiary px-3 py-1 border-2 border-primary">
          {filtered.length} {t('common.filter').toLowerCase()}
        </span>
        {editMode && (
          <span className="font-headline font-bold uppercase text-sm bg-primary-container text-primary px-3 py-1 border-2 border-primary">
            {t('prices.editModeBadge')}
          </span>
        )}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-variant border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <label className="block text-xs font-black font-headline uppercase tracking-widest mb-2 text-primary">
            {t('prices.zoneFilter')}
          </label>
          <select
            className="w-full bg-background border-2 border-primary p-2 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer"
            value={zoneFilter}
            onChange={(e) => { setZoneFilter(e.target.value); setPage(0); }}
          >
            {cities.map((c) => (
              <option key={c} value={c}>{c === 'all' ? t('prices.allZones') : c}</option>
            ))}
          </select>
        </div>
        <div className="bg-surface-variant border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <label className="block text-xs font-black font-headline uppercase tracking-widest mb-2 text-primary">
            {t('prices.category')}
          </label>
          <select
            className="w-full bg-background border-2 border-primary p-2 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer"
            value={catFilter}
            onChange={(e) => { setCatFilter(e.target.value); setPage(0); }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? t('prices.allCategories') : t(`common.${c === 'wood-fired' ? 'woodFired' : c}`)}</option>
            ))}
          </select>
        </div>
        <div className="bg-primary-container border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex items-center justify-between">
          <div>
            <div className="text-xs font-black font-headline uppercase tracking-widest mb-1 text-primary">{t('prices.avgPrice')}</div>
            <div className="text-3xl font-black font-headline text-primary">&euro;{stats.avg.toFixed(2)}</div>
          </div>
          <span className="material-symbols-outlined text-4xl text-primary">trending_up</span>
        </div>
        <div className="bg-surface-variant border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex items-center justify-between">
          <div>
            <div className="text-xs font-black font-headline uppercase tracking-widest mb-1 text-primary">{t('prices.medianTitle')}</div>
            <div className="text-3xl font-black font-headline text-primary">&euro;{stats.median.toFixed(2)}</div>
          </div>
          <span className="material-symbols-outlined text-4xl text-primary">balance</span>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-black font-headline uppercase tracking-widest mb-1 text-primary">{t('prices.priceRange')}</label>
          <div className="flex gap-2">
            <input
              className="w-full bg-surface border-2 border-primary py-2 px-3 font-body focus:outline-none focus:border-secondary"
              placeholder={t('prices.from')}
              type="number"
              min="0"
              step="0.5"
              value={priceMin}
              onChange={(e) => { setPriceMin(e.target.value); setPage(0); }}
            />
            <input
              className="w-full bg-surface border-2 border-primary py-2 px-3 font-body focus:outline-none focus:border-secondary"
              placeholder={t('prices.to')}
              type="number"
              min="0"
              step="0.5"
              value={priceMax}
              onChange={(e) => { setPriceMax(e.target.value); setPage(0); }}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-black font-headline uppercase tracking-widest mb-1 text-primary">{t('prices.sortBy')}</label>
          <select
            className="w-full bg-background border-2 border-primary p-2 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="price-asc">{t('prices.sortPriceAsc')}</option>
            <option value="price-desc">{t('prices.sortPriceDesc')}</option>
            <option value="name-asc">{t('prices.sortNameAsc')}</option>
            <option value="rating-desc">{t('prices.sortRatingDesc')}</option>
          </select>
        </div>
      </section>

      {sorted.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {cheapest && (
            <div className="bg-tertiary-container border-4 border-tertiary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>trending_down</span>
                <span className="text-xs font-black font-headline uppercase tracking-widest text-tertiary">{t('prices.cheapestTitle')}</span>
              </div>
              <p className="font-headline font-black text-lg text-tertiary">{cheapest.name}</p>
              <p className="font-headline font-bold text-2xl text-tertiary">&euro;{cheapest.margheritaPrice?.toFixed(2)}</p>
              <p className="text-xs font-label text-tertiary/70 uppercase">{cheapest.cityName}</p>
            </div>
          )}
          <div className="bg-primary-container border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>balance</span>
              <span className="text-xs font-black font-headline uppercase tracking-widest text-primary">{t('prices.rangeTitle')}</span>
            </div>
            <p className="font-headline font-bold text-2xl text-primary">&euro;{stats.min.toFixed(2)} - &euro;{stats.max.toFixed(2)}</p>
            <p className="text-xs font-label text-primary/70 uppercase">{t('prices.minPrice')}: &euro;{stats.min.toFixed(2)} &middot; {t('prices.maxPrice')}: &euro;{stats.max.toFixed(2)}</p>
          </div>
          {priciest && (
            <div className="bg-secondary-container border-4 border-secondary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                <span className="text-xs font-black font-headline uppercase tracking-widest text-secondary">{t('prices.priciestTitle')}</span>
              </div>
              <p className="font-headline font-black text-lg text-secondary">{priciest.name}</p>
              <p className="font-headline font-bold text-2xl text-secondary">&euro;{priciest.margheritaPrice?.toFixed(2)}</p>
              <p className="text-xs font-label text-secondary/70 uppercase">{priciest.cityName}</p>
            </div>
          )}
        </section>
      )}

      <PricesTable
        sorted={sorted} stats={stats} page={page} setPage={setPage}
        editingId={editingId} editForm={editForm} setEditForm={setEditForm}
        onStartEdit={startEdit} onSaveEdit={saveEdit} onCancelEdit={cancelEdit}
        onDelete={setDeleteId}
        editMode={editMode}
        setSelected={setSelected}
        t={t}
      />

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-headline font-black uppercase text-primary mb-4">
                {t('prices.deleteConfirmPrice', { name: rows.find(r => r.pizzeriaId === deleteId)?.name })}
              </h2>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteId(null)} className="bg-surface text-primary font-headline font-bold uppercase py-3 px-6 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors text-sm">{t('admin.cancel')}</button>
                <button onClick={() => deletePrice(deleteId)} className="bg-secondary text-on-tertiary font-headline font-bold uppercase py-3 px-6 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors text-sm">{t('common.delete')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DetailModal selected={selected} setSelected={setSelected} stats={stats} t={t} lang={lang} />
    </div>
  );
}
