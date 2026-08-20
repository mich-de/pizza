import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import { checkAuth } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import PricesTable from '../components/prices/PricesTable';
import MarketMovers from '../components/ui/MarketMovers';
import { DetailModal } from '../components/prices/PricesDetail';
import { priceTier } from '../config/pricesConfig';
import { PageHeader } from '../components/ui';
import { formatAmount } from '../utils/formatAmount';
import { fetchWithAuth, fetchCSRF } from '../services/adminApi';

function PriceHeatMap({ sorted, stats }) {
  const maxBars = 120;
  const step = Math.max(1, Math.floor(sorted.length / maxBars));
  const samples = sorted.filter((_, i) => i % step === 0).slice(0, maxBars);

  return (
    /* Il pettine dei prezzi: barre a spigolo vivo, senza raggio. Su una barra
       larga due pixel un raggio di tre la trasforma in un puntino. */
    <div className="flex gap-px items-stretch h-9 w-full">
      {samples.length === 0 ? (
        <div className="w-full bg-surface-dim" />
      ) : (
        samples.map((p, i) => {
          const tier = priceTier(p.margheritaPrice, stats.min, stats.range);
          const color = tier === 'cheap' ? 'bg-tertiary'
            : tier === 'expensive' ? 'bg-secondary'
            : 'bg-primary-fixed-dim';
          const opacity = 0.45 + (i / samples.length) * 0.5;
          return (
            <div
              key={i}
              className={`flex-1 ${color} hover:scale-y-125 hover:opacity-100 transition-all cursor-crosshair origin-bottom`}
              style={{ opacity, borderRadius: 0 }}
              title={`${p.name}: \u20AC${p.margheritaPrice?.toFixed(2)}`}
            />
          );
        })
      )}
    </div>
  );
}

function IndexHero({ stats, allData, sorted, editMode, t, lang, isAdmin, exportCSV, exportJSON, toggleEdit }) {
  return (
    <>
      {/* La testatina e' la stessa componente su ogni pagina: occhiello,
          titolo in condensato, filetto a tutta larghezza col tratto ambra.
          I comandi stanno a destra ed escono di stampa da soli, perche'
          compongono la richiesta e non leggono il risultato. */}
      <PageHeader
        eyebrow={t('common.peninsula')}
        title={t('prices.title')}
        subtitle={t('prices.subtitle')}
      >
        {editMode && (
          <button onClick={exportJSON} className="btn btn-ghost btn-sm">
            <span className="material-symbols-outlined text-sm">download</span>
            {t('admin.exportJSON')}
          </button>
        )}
        <button onClick={exportCSV} className="btn btn-primary btn-sm">
          <span className="material-symbols-outlined text-sm">download</span>
          {t('prices.exportCSV')}
        </button>
        {isAdmin && (
          <button onClick={toggleEdit} className={`btn btn-sm ${editMode ? 'btn-primary' : 'btn-ghost'}`}>
            <span className="material-symbols-outlined text-sm">{editMode ? 'visibility' : 'edit'}</span>
            {editMode ? t('common.view') : t('common.edit')}
          </button>
        )}
      </PageHeader>

      <div className="panel mb-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-9">
          {/* IL FLAP della pagina: la media del filtro corrente e' la risposta
              che si viene a cercare qui. Gli altri numeri stanno in colonna
              accanto, in chiaro: due flap affiancati non si leggono piu'. */}
          <div className="shrink-0">
            <span className="block font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mb-1.5">
              {t('prices.avgPrice')}
            </span>
            <div className="flex items-baseline">
              <span className="flap flap-lg">{formatAmount(stats.avg, lang)}</span>
              <span className="unit">EUR</span>
            </div>
            {/* La mediana e' un dato derivato, non l'unita' di misura della
                media: sta sotto, dove il sistema mette i derivati. */}
            <span className="estimate">
              {t('prices.medianTitle')} <strong>&euro;{formatAmount(stats.median, lang)}</strong>
            </span>
          </div>

          <ul className="kv flex-1 min-w-0 md:grid-cols-2">
            <li><span className="k">{t('prices.minPrice')}</span><span className="v text-tertiary">&euro;{stats.min.toFixed(2)}</span></li>
            <li><span className="k">{t('prices.maxPrice')}</span><span className="v text-secondary">&euro;{stats.max.toFixed(2)}</span></li>
            <li><span className="k">{t('prices.rangeTitle')}</span><span className="v">&euro;{stats.range.toFixed(2)}</span></li>
            <li><span className="k">{t('nav.network')}</span><span className="v">{allData.length}</span></li>
          </ul>
        </div>

        <div className="mt-6 space-y-1.5">
          <div className="flex items-center justify-between font-label text-[0.68rem] font-semibold uppercase tracking-[0.1em]">
            <span className="text-tertiary">{t('prices.cheapestTitle')} &euro;{stats.min.toFixed(2)}</span>
            <span className="text-on-surface-variant">{t('prices.medianTitle')} &euro;{stats.median.toFixed(2)}</span>
            <span className="text-secondary">{t('prices.priciestTitle')} &euro;{stats.max.toFixed(2)}</span>
          </div>
          <PriceHeatMap sorted={sorted} stats={stats} />
        </div>
      </div>
    </>
  );
}

function FilterBar({ zoneFilter, setZoneFilter, frazioneFilter, setFrazioneFilter, availableFrazioni, catFilter, setCatFilter, searchQuery, setSearchQuery, priceMin, setPriceMin, priceMax, setPriceMax, sortBy, setSortBy, cities, categories, t, setPage, allData, filtered, editMode }) {
  return (
    /* I filtri servono a comporre la richiesta, non a leggere il risultato:
       `no-print` li toglie dalla carta, dove un campo vuoto e' solo rumore. */
    <div className="panel mb-8 no-print">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-x-4 gap-y-1">
        <label className="field">
          <span>{t('prices.searchPlaceholder')}</span>
          <input
            type="search"
            className="w-full"
            placeholder={t('prices.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          />
        </label>
        <label className="field">
          <span>{t('prices.zoneFilter')}</span>
          <select
            className="w-full"
            value={zoneFilter}
            onChange={(e) => { setZoneFilter(e.target.value); setPage(0); }}
          >
            {cities.map((c) => (
              <option key={c} value={c}>{c === 'all' ? t('prices.allZones') : c}</option>
            ))}
          </select>
        </label>
        {zoneFilter !== 'all' && availableFrazioni.length > 1 && (
          <label className="field">
            <span>{t('prices.frazione')}</span>
            <select
              className="w-full"
              value={frazioneFilter}
              onChange={(e) => { setFrazioneFilter(e.target.value); setPage(0); }}
            >
              {availableFrazioni.map((f) => (
                <option key={f} value={f}>{f === 'all' ? t('prices.allFrazioni') : f}</option>
              ))}
            </select>
          </label>
        )}
        {zoneFilter === 'all' && <div />}
        <label className="field">
          <span>{t('prices.category')}</span>
          <select
            className="w-full"
            value={catFilter}
            onChange={(e) => { setCatFilter(e.target.value); setPage(0); }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? t('prices.allCategories') : t(`common.${c === 'wood-fired' ? 'woodFired' : c}`)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('prices.priceRange')}</span>
          <div className="flex gap-1.5 items-center">
            <input
              className="w-full"
              placeholder={t('prices.from')}
              type="number"
              min="0"
              step="0.5"
              value={priceMin}
              onChange={(e) => { setPriceMin(e.target.value); setPage(0); }}
            />
            <span className="font-display text-on-surface-variant">&ndash;</span>
            <input
              className="w-full"
              placeholder={t('prices.to')}
              type="number"
              min="0"
              step="0.5"
              value={priceMax}
              onChange={(e) => { setPriceMax(e.target.value); setPage(0); }}
            />
          </div>
        </label>
        <label className="field">
          <span>{t('prices.sortBy')}</span>
          <select
            className="w-full"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="price-asc">{t('prices.sortPriceAsc')}</option>
            <option value="price-desc">{t('prices.sortPriceDesc')}</option>
            <option value="name-asc">{t('prices.sortNameAsc')}</option>
            <option value="rating-desc">{t('prices.sortRatingDesc')}</option>
          </select>
        </label>
      </div>

      <div className="flex items-center flex-wrap gap-2 mt-2 pt-3 border-t border-outline-variant">
        <span className="badge badge-ghost">{allData.length} {t('prices.pizzeriaPlural')}</span>
        <span className="badge badge-ghost">
          {[...new Set(allData.map(d => d.cityName))].length} {t('nav.network')}
        </span>
        <span className="badge badge-primary">
          {t('common.filter')}: {filtered.length}
        </span>
        {/* La modalita' modifica cambia quello che i tasti fanno: e' un avviso,
            e l'avviso e' ambra. */}
        {editMode && <span className="badge badge-warning">{t('prices.editModeBadge')}</span>}
      </div>
    </div>
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
      const res = await fetchWithAuth(`/api/prices/${editingId}`, {
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
      const res = await fetchWithAuth(`/api/prices/${pizzeriaId}`, {
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
    /* `.container` come tutte le altre: 1240px al massimo, margine automatico,
       niente padding proprio. Con `p-6 md:p-12` questa pagina era larga 896px
       invece di 992 e partiva 48px piu' in basso — la colonna si spostava
       cambiando pagina. */
    <div className="container fade-in">
      {toast && (
        /* L'avviso e' un `.alert` con la sua barra piena a sinistra. Il fondo
           dell'alert e' una velatura, quindi sopra al contenuto serve una
           superficie opaca sotto: senza, il testo si legge attraverso. */
        <div className="fixed top-4 right-4 z-[100] no-print bg-surface border border-outline-variant max-w-sm">
          <div className={`alert ${toast.isError ? 'alert-error' : 'alert-success'}`}>
            <span className="material-symbols-outlined text-base leading-none">
              {toast.isError ? 'error' : 'check_circle'}
            </span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      <IndexHero
        stats={stats}
        allData={allData}
        sorted={sorted}
        editMode={editMode}
        t={t}
        lang={lang}
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
        <div className="fixed inset-0 bg-black/55 z-[200] flex items-center justify-center p-4 no-print">
          {/* Qui si agisce davvero, e l'azione e' irreversibile: e' l'unico
              posto della pagina dove compare il rosso (regola 1). */}
          <div className="card card-accent w-full max-w-md">
            <span className="eyebrow">{t('common.delete')}</span>
            <h2 className="mt-1 mb-5">
              {t('prices.deleteConfirmPrice', { name: rows.find(r => r.pizzeriaId === deleteId)?.name })}
            </h2>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn btn-ghost">{t('admin.cancel')}</button>
              <button onClick={() => deletePrice(deleteId)} className="btn btn-secondary">{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      <DetailModal selected={selected} setSelected={setSelected} stats={stats} t={t} lang={lang} />
    </div>
  );
}
