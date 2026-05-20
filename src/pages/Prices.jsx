import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import { checkAuth } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import PricesTable from '../components/prices/PricesTable';
import { DetailModal } from '../components/prices/PricesDetail';
import { priceTier } from '../config/pricesConfig';

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

function PriceHeatMap({ sorted, stats }) {
  const maxBars = 120;
  const step = Math.max(1, Math.floor(sorted.length / maxBars));
  const samples = sorted.filter((_, i) => i % step === 0).slice(0, maxBars);

  return (
    <div className="flex gap-[2px] items-stretch h-10 w-full">
      {samples.length === 0 ? (
        <div className="w-full bg-surface-dim" />
      ) : (
        samples.map((p, i) => {
          const tier = priceTier(p.margheritaPrice, stats.min, stats.range);
          const color = tier === 'cheap' ? 'bg-tertiary'
            : tier === 'expensive' ? 'bg-secondary'
            : 'bg-primary-fixed-dim';
          const opacity = 0.5 + (i / samples.length) * 0.5;
          return (
            <div
              key={i}
              className={`flex-1 ${color} rounded-sm hover:scale-y-125 hover:opacity-100 transition-all cursor-crosshair origin-bottom`}
              style={{ opacity }}
              title={`${p.name}: \u20AC${p.margheritaPrice?.toFixed(2)}`}
            />
          );
        })
      )}
    </div>
  );
}

function IndexHero({ stats, allData, sorted, editMode, t, isAdmin, exportCSV, exportJSON, toggleEdit }) {
  return (
    <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] mb-8">
      <div className="bg-primary text-on-primary p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-headline font-black uppercase text-sm md:text-base tracking-[0.2em] text-on-primary/80">
                {t('prices.subtitle')}
              </span>
              <span className="w-8 h-[2px] bg-on-primary/40" />
              <span className="font-label font-bold uppercase text-xs tracking-wider text-on-primary/60">
                {allData.length} {t('nav.network')}
              </span>
            </div>
            <h1 className="font-headline font-black text-5xl md:text-7xl lg:text-8xl uppercase tracking-tight leading-none">
              {t('prices.title')}
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {editMode && (
              <button onClick={exportJSON} className="flex items-center gap-2 bg-on-primary/20 text-on-primary font-headline font-bold uppercase py-2 px-4 border-2 border-on-primary/40 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:bg-on-primary hover:text-primary transition-colors text-sm">
                <span className="material-symbols-outlined text-sm">download</span>
                {t('admin.exportJSON')}
              </button>
            )}
            <button onClick={exportCSV} className="flex items-center gap-2 bg-on-primary text-primary font-headline font-bold uppercase py-3 px-6 border-2 border-on-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:bg-on-primary/80 transition-colors">
              <span className="material-symbols-outlined">download</span>
              {t('prices.exportCSV')}
            </button>
            {isAdmin && (
              <button onClick={toggleEdit} className={`flex items-center gap-2 font-headline font-bold uppercase py-3 px-6 border-2 border-on-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] transition-colors ${editMode ? 'bg-tertiary text-on-tertiary hover:bg-tertiary/80' : 'bg-on-primary/20 text-on-primary hover:bg-on-primary hover:text-primary'}`}>
                <span className="material-symbols-outlined">{editMode ? 'visibility' : 'edit'}</span>
                {editMode ? t('common.view') : t('common.edit')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 mb-6">
          <div>
            <div className="text-sm font-headline font-black uppercase tracking-widest text-on-surface-variant mb-1">
              {t('prices.avgPrice')}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-headline font-black text-6xl md:text-7xl lg:text-8xl text-primary leading-none tracking-tight">
                &euro;{stats.avg.toFixed(2)}
              </span>
              <span className="bg-primary-container text-primary font-headline font-bold text-sm uppercase px-3 py-1 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                {t('prices.medianTitle')} &euro;{stats.median.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-surface-variant border-2 border-primary px-4 py-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <span className="font-label font-bold text-xs uppercase text-on-surface-variant">{t('prices.minPrice')}</span>
              <span className="font-headline font-black text-xl md:text-2xl text-tertiary ml-2">&euro;{stats.min.toFixed(2)}</span>
            </div>
            <div className="bg-surface-variant border-2 border-primary px-4 py-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <span className="font-label font-bold text-xs uppercase text-on-surface-variant">{t('prices.maxPrice')}</span>
              <span className="font-headline font-black text-xl md:text-2xl text-secondary ml-2">&euro;{stats.max.toFixed(2)}</span>
            </div>
            <div className="bg-primary-container border-2 border-primary px-4 py-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <span className="font-label font-bold text-xs uppercase text-primary">{t('prices.rangeTitle')}</span>
              <span className="font-headline font-black text-xl md:text-2xl text-primary ml-2">&euro;{stats.range.toFixed(2)}</span>
            </div>
            <div className="bg-surface-variant border-2 border-primary px-4 py-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <span className="font-label font-bold text-xs uppercase text-on-surface-variant">{t('nav.network')}</span>
              <span className="font-headline font-black text-xl md:text-2xl text-primary ml-2">{allData.length}</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-label font-bold uppercase tracking-wider">
            <span className="text-tertiary">{t('prices.cheapestTitle')} &euro;{stats.min.toFixed(2)}</span>
            <span className="text-primary">{t('prices.medianTitle')} &euro;{stats.median.toFixed(2)}</span>
            <span className="text-secondary">{t('prices.priciestTitle')} &euro;{stats.max.toFixed(2)}</span>
          </div>
          <PriceHeatMap sorted={sorted} stats={stats} />
        </div>
      </div>
    </div>
  );
}

function FilterBar({ zoneFilter, setZoneFilter, frazioneFilter, setFrazioneFilter, availableFrazioni, catFilter, setCatFilter, searchQuery, setSearchQuery, priceMin, setPriceMin, priceMax, setPriceMax, sortBy, setSortBy, cities, categories, t, setPage, allData, filtered, editMode }) {
  return (
    <div className="bg-surface border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] p-4 md:p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-1">
          <label className="block text-xs font-black font-headline uppercase tracking-widest mb-1.5 text-primary">
            <span className="material-symbols-outlined text-sm align-text-bottom mr-1">search</span>
            {t('prices.searchPlaceholder')}
          </label>
          <input
            className="w-full bg-background border-2 border-primary p-2.5 font-body font-bold text-primary focus:outline-none focus:border-secondary"
            placeholder={t('prices.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          />
        </div>
        <div>
          <label className="block text-xs font-black font-headline uppercase tracking-widest mb-1.5 text-primary">{t('prices.zoneFilter')}</label>
          <select
            className="w-full bg-background border-2 border-primary p-2.5 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer"
            value={zoneFilter}
            onChange={(e) => { setZoneFilter(e.target.value); setPage(0); }}
          >
            {cities.map((c) => (
              <option key={c} value={c}>{c === 'all' ? t('prices.allZones') : c}</option>
            ))}
          </select>
        </div>
        {zoneFilter !== 'all' && availableFrazioni.length > 1 && (
          <div>
            <label className="block text-xs font-black font-headline uppercase tracking-widest mb-1.5 text-primary">{t('prices.frazione')}</label>
            <select
              className="w-full bg-background border-2 border-primary p-2.5 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer"
              value={frazioneFilter}
              onChange={(e) => { setFrazioneFilter(e.target.value); setPage(0); }}
            >
              {availableFrazioni.map((f) => (
                <option key={f} value={f}>{f === 'all' ? t('prices.allFrazioni') : f}</option>
              ))}
            </select>
          </div>
        )}
        {zoneFilter === 'all' && <div />}
        <div>
          <label className="block text-xs font-black font-headline uppercase tracking-widest mb-1.5 text-primary">{t('prices.category')}</label>
          <select
            className="w-full bg-background border-2 border-primary p-2.5 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer"
            value={catFilter}
            onChange={(e) => { setCatFilter(e.target.value); setPage(0); }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? t('prices.allCategories') : t(`common.${c === 'wood-fired' ? 'woodFired' : c}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-black font-headline uppercase tracking-widest mb-1.5 text-primary">{t('prices.priceRange')}</label>
          <div className="flex gap-1.5 items-center">
            <input
              className="w-full bg-background border-2 border-primary p-2.5 font-body font-bold text-primary focus:outline-none focus:border-secondary"
              placeholder={t('prices.from')}
              type="number"
              min="0"
              step="0.5"
              value={priceMin}
              onChange={(e) => { setPriceMin(e.target.value); setPage(0); }}
            />
            <span className="font-headline font-black text-primary">—</span>
            <input
              className="w-full bg-background border-2 border-primary p-2.5 font-body font-bold text-primary focus:outline-none focus:border-secondary"
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
          <label className="block text-xs font-black font-headline uppercase tracking-widest mb-1.5 text-primary">{t('prices.sortBy')}</label>
          <select
            className="w-full bg-background border-2 border-primary p-2.5 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="price-asc">{t('prices.sortPriceAsc')}</option>
            <option value="price-desc">{t('prices.sortPriceDesc')}</option>
            <option value="name-asc">{t('prices.sortNameAsc')}</option>
            <option value="rating-desc">{t('prices.sortRatingDesc')}</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t-2 border-outline-variant">
        <span className="font-headline font-black uppercase text-xs tracking-wider text-on-surface-variant">
          {allData.length} {t('prices.pizzeriaPlural')}
        </span>
        <span className="w-[2px] h-4 bg-outline-variant" />
        <span className="font-headline font-bold uppercase text-xs text-on-surface-variant">
          {[...new Set(allData.map(d => d.cityName))].length} {t('nav.network')}
        </span>
        <span className="w-[2px] h-4 bg-outline-variant" />
        <span className="font-headline font-bold uppercase text-xs bg-tertiary-container text-tertiary px-2 py-0.5">
          {t('common.filter').toLowerCase()}: {filtered.length}
        </span>
        {editMode && (
          <>
            <span className="w-[2px] h-4 bg-outline-variant" />
            <span className="font-headline font-bold uppercase text-xs bg-primary-container text-primary px-2 py-0.5 border border-primary">
              {t('prices.editModeBadge')}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function MarketMovers({ cheapest, priciest, stats, t }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {cheapest && (
        <div className="bg-tertiary-container border-4 border-tertiary p-5 md:p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary/10 rounded-bl-full" />
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-tertiary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_down</span>
            <span className="text-sm font-black font-headline uppercase tracking-widest text-tertiary">{t('prices.cheapestTitle')}</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-headline font-black text-xl md:text-2xl text-tertiary">{cheapest.name}</p>
              <p className="font-label font-bold text-sm text-tertiary/70 uppercase mt-1">{cheapest.cityName}</p>
            </div>
            <div className="text-right">
              <p className="font-headline font-black text-3xl md:text-4xl text-tertiary leading-none">&euro;{cheapest.margheritaPrice?.toFixed(2)}</p>
              <p className="text-xs font-label font-bold text-tertiary/60 mt-1">{((cheapest.margheritaPrice / stats.avg - 1) * 100).toFixed(1)}% vs media</p>
            </div>
          </div>
        </div>
      )}
      {priciest && (
        <div className="bg-secondary-container border-4 border-secondary p-5 md:p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-bl-full" />
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            <span className="text-sm font-black font-headline uppercase tracking-widest text-secondary">{t('prices.priciestTitle')}</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-headline font-black text-xl md:text-2xl text-secondary">{priciest.name}</p>
              <p className="font-label font-bold text-sm text-secondary/70 uppercase mt-1">{priciest.cityName}</p>
            </div>
            <div className="text-right">
              <p className="font-headline font-black text-3xl md:text-4xl text-secondary leading-none">&euro;{priciest.margheritaPrice?.toFixed(2)}</p>
              <p className="text-xs font-label font-bold text-secondary/60 mt-1">+{((priciest.margheritaPrice / stats.avg - 1) * 100).toFixed(1)}% vs media</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Prices() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { data: allData, loading } = useStitchedData();

  const [zoneFilter, setZoneFilter] = useState('all');
  const [frazioneFilter, setFrazioneFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const [prevZone, setPrevZone] = useState('all');
  if (zoneFilter !== prevZone) {
    setPrevZone(zoneFilter);
    setFrazioneFilter('all');
  }

  const data = editMode && initialized ? rows : allData;

  const cities = useMemo(() => ['all', ...new Set(data.map((d) => d.cityName))], [data]);
  const categories = useMemo(() => ['all', ...new Set(data.map((d) => d.category))], [data]);
  const availableFrazioni = useMemo(() => {
    if (zoneFilter === 'all') return [];
    return ['all', ...new Set(data.filter(d => d.cityName === zoneFilter).map(d => d.frazione).filter(Boolean))];
  }, [data, zoneFilter]);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      const matchZone = zoneFilter === 'all' || p.cityName === zoneFilter;
      const matchFrazione = frazioneFilter === 'all' || p.frazione === frazioneFilter;
      const matchCat = catFilter === 'all' || p.category === catFilter;
      const matchPriceMin = priceMin === '' || p.margheritaPrice >= parseFloat(priceMin);
      const matchPriceMax = priceMax === '' || p.margheritaPrice <= parseFloat(priceMax);
      const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.cityName.toLowerCase().includes(searchQuery.toLowerCase()) || (p.frazione && p.frazione.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchZone && matchFrazione && matchCat && matchPriceMin && matchPriceMax && matchSearch;
    });
  }, [data, zoneFilter, frazioneFilter, catFilter, priceMin, priceMax, searchQuery]);

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

  const toggleEdit = () => setEditMode((v) => !v);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 md:p-12">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] font-headline font-bold uppercase px-6 py-3 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] ${toast.isError ? 'bg-secondary text-on-tertiary' : 'bg-primary text-on-primary'}`}>
          {toast.msg}
        </div>
      )}

      <IndexHero
        stats={stats}
        allData={allData}
        sorted={sorted}
        editMode={editMode}
        t={t}
        isAdmin={isAdmin}
        exportCSV={exportCSV}
        exportJSON={exportJSON}
        toggleEdit={toggleEdit}
      />

      <FilterBar
        zoneFilter={zoneFilter} setZoneFilter={setZoneFilter}
        frazioneFilter={frazioneFilter} setFrazioneFilter={setFrazioneFilter}
        availableFrazioni={availableFrazioni}
        catFilter={catFilter} setCatFilter={setCatFilter}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        priceMin={priceMin} setPriceMin={setPriceMin}
        priceMax={priceMax} setPriceMax={setPriceMax}
        sortBy={sortBy} setSortBy={setSortBy}
        cities={cities} categories={categories}
        t={t} setPage={setPage}
        allData={allData} filtered={filtered} editMode={editMode}
      />

      {sorted.length > 0 && (
        <MarketMovers cheapest={cheapest} priciest={priciest} stats={stats} t={t} />
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
