import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import { groupByCity } from '../utils/groupByCity';
import PriceProposalForm from '../components/explore/PriceProposalForm';
import ExploreCards from '../components/explore/ExploreCards';
import ExploreTable from '../components/explore/ExploreTable';
import ExploreNetwork from '../components/explore/ExploreNetwork';

function ExploreHero({ t, search, setSearch, exportCSV, networkStats, data, setPage }) {
  return (
    <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] mb-8">
      <div className="bg-primary text-on-primary p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-headline font-black uppercase text-sm md:text-base tracking-[0.2em] text-on-primary/80">
                {t('explore.subtitle')}
              </span>
              <span className="w-8 h-[2px] bg-on-primary/40" />
              <span className="font-label font-bold uppercase text-xs tracking-wider text-on-primary/60">
                {data.length} {t('nav.network')}
              </span>
            </div>
            <h1 className="font-headline font-black text-5xl md:text-7xl lg:text-8xl uppercase tracking-tight leading-none">
              {t('explore.title')}
            </h1>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 bg-on-primary text-primary font-headline font-bold uppercase py-3 px-6 border-2 border-on-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:bg-on-primary/80 transition-colors">
            <span className="material-symbols-outlined">download</span>
            {t('prices.exportCSV')}
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-primary-container border-2 border-primary px-4 py-3 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
            <span className="font-label font-bold text-xs uppercase text-primary/70 block">{t('explore.total')}</span>
            <span className="font-headline font-black text-3xl md:text-4xl text-primary">{networkStats.totalPizzerias}</span>
          </div>
          <div className="bg-surface-variant border-2 border-primary px-4 py-3 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
            <span className="font-label font-bold text-xs uppercase text-on-surface-variant block">{t('network.clusters')}</span>
            <span className="font-headline font-black text-3xl md:text-4xl text-primary">{networkStats.clusters}</span>
          </div>
          <div className="bg-tertiary-container border-2 border-tertiary px-4 py-3 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
            <span className="font-label font-bold text-xs uppercase text-tertiary/70 block">{t('network.avgPrice')}</span>
            <span className="font-headline font-black text-3xl md:text-4xl text-tertiary">&euro;{networkStats.avgPrice.toFixed(2)}</span>
          </div>
          <div className="bg-surface-variant border-2 border-primary px-4 py-3 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
            <span className="font-label font-bold text-xs uppercase text-on-surface-variant block">{t('network.avgRating')}</span>
            <span className="font-headline font-black text-3xl md:text-4xl text-primary">{networkStats.avgRating.toFixed(1)}</span>
          </div>
        </div>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-xl">search</span>
          <input
            className="w-full bg-background border-2 border-primary py-3.5 pl-12 pr-4 font-body font-bold text-primary focus:outline-none focus:border-secondary shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
            placeholder={t('explore.search')}
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      </div>
    </div>
  );
}

function CityPills({ cities, data, cityFilter, setCityFilter, activeFiltersCount, resetFilters, t, setPage }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {cities.map((city) => {
        const isActive = cityFilter === city;
        const count = city === 'all' ? data.length : data.filter(p => p.cityName === city).length;
        return (
          <button
            key={city}
            onClick={() => { setCityFilter(isActive ? 'all' : city); setPage(0); }}
            className={`font-headline font-bold uppercase text-xs tracking-wider px-4 py-2 border-2 transition-all ${
              isActive
                ? 'bg-primary text-on-primary border-primary shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]'
                : 'bg-surface text-primary border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-container hover:-translate-y-0.5'
            }`}
          >
            {city === 'all' ? t('explore.all') : city}
            <span className={`ml-1.5 font-headline font-black text-sm ${isActive ? 'text-on-primary' : 'text-primary/60'}`}>
              {count}
            </span>
          </button>
        );
      })}
      {activeFiltersCount > 0 && (
        <button
          onClick={resetFilters}
          className="font-headline font-bold uppercase text-xs tracking-wider px-4 py-2 border-2 border-secondary bg-secondary text-on-secondary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary-container hover:text-secondary transition-colors"
        >
          {t('explore.reset')} ({activeFiltersCount})
        </button>
      )}
    </div>
  );
}

function FrazioneFilter({ cityFilter, frazioneFilter, setFrazioneFilter, availableFrazioni, t, setPage }) {
  if (cityFilter === 'all' || availableFrazioni.length <= 1) return null;
  return (
    <div className="mb-6 -mt-3">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="font-headline font-black uppercase text-xs tracking-wider text-on-surface-variant/60 mr-1">{t('prices.frazione')}:</span>
        {availableFrazioni.map((f) => {
          const isActive = frazioneFilter === f;
          return (
            <button
              key={f}
              onClick={() => { setFrazioneFilter(isActive ? 'all' : f); setPage(0); }}
              className={`font-headline font-bold uppercase text-xs tracking-wider px-3 py-1.5 border-2 transition-all ${
                isActive
                  ? 'bg-primary text-on-primary border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]'
                  : 'bg-surface text-primary border-primary shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-container'
              }`}
            >
              {f === 'all' ? t('prices.allFrazioni') : f}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ViewTabs({ view, setView, tabs }) {
  return (
    <div className="flex mb-8 border-b-4 border-primary">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setView(tab.key)}
          className={`flex items-center gap-2 px-6 py-3.5 font-headline font-bold uppercase text-sm tracking-wider transition-all relative ${
            view === tab.key
              ? 'text-primary bg-primary-container'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-lg">{tab.icon}</span>
          {tab.label}
          {view === tab.key && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}

function ExplorePriceReport({ selected, t }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t-4 border-primary pt-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-surface-variant text-primary font-headline font-bold uppercase py-3 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors text-sm"
        >
          <span className="material-symbols-outlined">edit_note</span>
          {t('explore.reportPrice')}
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-headline font-black uppercase text-base text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">edit_note</span>
              {t('explore.reportPrice')}
            </h4>
            <button onClick={() => setOpen(false)} className="font-label text-xs font-bold uppercase text-on-surface-variant hover:text-primary transition-colors">
              {t('common.cancel')}
            </button>
          </div>
          <PriceProposalForm
            pizzeriaId={selected.id}
            pizzeriaName={selected.name}
            currentPrice={selected.margheritaPrice}
            onSubmitted={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

export default function Explore() {
  const { data, loading } = useStitchedData();
  const { t, lang } = useI18n();

  const [view, setView] = useState('cards');
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [frazioneFilter, setFrazioneFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [selectedCity, setSelectedCity] = useState(null);
  const [sortBy, setSortBy] = useState('price-asc');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState(null);
  const [reportPz, setReportPz] = useState(null);

  useEffect(() => {
    if (reportPz || selected) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [reportPz, selected]);

  const cities = useMemo(() => ['all', ...new Set(data.map((d) => d.cityName))].sort(), [data]);
  const availableFrazioni = useMemo(() => {
    if (cityFilter === 'all') return [];
    return ['all', ...new Set(data.filter(d => d.cityName === cityFilter).map(d => d.frazione).filter(Boolean))];
  }, [data, cityFilter]);

  const [prevCityFilter, setPrevCityFilter] = useState('all');
  if (cityFilter !== prevCityFilter) {
    setPrevCityFilter(cityFilter);
    setFrazioneFilter('all');
  }

  const filtered = useMemo(() => {
    return data.filter((p) => {
      const matchCity = cityFilter === 'all' || p.cityName === cityFilter;
      const matchFrazione = frazioneFilter === 'all' || p.frazione === frazioneFilter;
      const matchCat = catFilter === 'all' || p.category === catFilter;
      const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.cityName.toLowerCase().includes(search.toLowerCase()) || (p.frazione && p.frazione.toLowerCase().includes(search.toLowerCase()));
      const matchPriceMin = priceMin === '' || p.margheritaPrice >= parseFloat(priceMin);
      const matchPriceMax = priceMax === '' || p.margheritaPrice <= parseFloat(priceMax);
      return matchCity && matchFrazione && matchCat && matchSearch && matchPriceMin && matchPriceMax;
    });
  }, [data, cityFilter, frazioneFilter, catFilter, search, priceMin, priceMax]);

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

  const totalPages = pageSize === Infinity ? 1 : Math.ceil(sorted.length / pageSize);
  const paginated = useMemo(() => {
    if (pageSize === Infinity) return sorted;
    return sorted.slice(page * pageSize, (page + 1) * pageSize);
  }, [sorted, page, pageSize]);

  const stats = useMemo(() => {
    const prices = sorted.map((p) => p.margheritaPrice || 0);
    const min = prices.length > 0 ? Math.min(...prices) : 0;
    const max = prices.length > 0 ? Math.max(...prices) : 0;
    const avg = prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const median = sortedPrices.length > 0 ? sortedPrices[Math.floor(sortedPrices.length / 2)] : 0;
    const range = max - min;
    return { min, max, avg, median, range };
  }, [sorted]);

  const cheapest = sorted.length > 0 ? sorted.find((p) => p.margheritaPrice === stats.min) : null;
  const priciest = sorted.length > 0 ? sorted.find((p) => p.margheritaPrice === stats.max) : null;

  const grouped = useMemo(() => groupByCity(data), [data]);
  const cityNames = useMemo(() => Object.keys(grouped), [grouped]);
  const networkStats = useMemo(() => ({
    totalPizzerias: data.length,
    avgRating: data.length > 0 ? data.reduce((s, p) => s + p.rating, 0) / data.length : 0,
    avgPrice: data.length > 0 ? data.reduce((s, p) => s + (p.margheritaPrice || 0), 0) / data.length : 0,
    clusters: cityNames.length,
  }), [data, cityNames]);

  const exportCSV = () => {
    const header = 'Name,City,Category,Price,Rating\n';
    const rows = sorted.map((p) => `"${p.name}","${p.cityName}","${p.category}",${p.margheritaPrice},${p.rating}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pizza-peninsula-prices.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFiltersCount = [cityFilter !== 'all', catFilter !== 'all', search !== '', priceMin !== '', priceMax !== ''].filter(Boolean).length;
  const resetFilters = () => {
    setSearch('');
    setCityFilter('all');
    setCatFilter('all');
    setPriceMin('');
    setPriceMax('');
    setPage(0);
    setSortBy('price-asc');
  };

  const tabs = [
    { key: 'cards', icon: 'grid_view', label: t('explore.tabCards') },
    { key: 'table', icon: 'table_chart', label: t('explore.tabTable') },
    { key: 'network', icon: 'hub', label: t('explore.tabNetwork') },
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto w-full">
      <ExploreHero
        t={t}
        search={search}
        setSearch={setSearch}
        exportCSV={exportCSV}
        networkStats={networkStats}
        data={data}
        activeFiltersCount={activeFiltersCount}
        resetFilters={resetFilters}
        setPage={setPage}
      />

      <CityPills
        cities={cities}
        data={data}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        activeFiltersCount={activeFiltersCount}
        resetFilters={resetFilters}
        t={t}
        setPage={setPage}
      />

      <FrazioneFilter
        cityFilter={cityFilter}
        frazioneFilter={frazioneFilter}
        setFrazioneFilter={setFrazioneFilter}
        availableFrazioni={availableFrazioni}
        t={t}
        setPage={setPage}
      />

      <ViewTabs view={view} setView={setView} tabs={tabs} />

      {view === 'cards' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="group bg-surface border-4 border-primary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] card-glow">
              <div className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-1">{t('explore.total')}</div>
              <div className="font-headline font-black text-4xl text-primary stat-hover">{data.length}</div>
              {activeFiltersCount > 0 && (
                <div className="font-label text-xs text-on-surface-variant/60 mt-1">{t('explore.withFilters', { count: filtered.length })}</div>
              )}
            </div>
            <div className="group bg-primary-container border-4 border-primary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] card-glow">
              <div className="font-label font-bold text-xs uppercase tracking-widest text-primary/70 mb-1">{t('prices.avgPrice')}</div>
              <div className="font-headline font-black text-4xl text-primary stat-hover">&euro;{stats.avg.toFixed(2)}</div>
            </div>
            <div className="group bg-surface-variant border-4 border-primary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] card-glow">
              <div className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-1">{t('prices.medianTitle')}</div>
              <div className="font-headline font-black text-4xl text-primary stat-hover">&euro;{stats.median.toFixed(2)}</div>
            </div>
            <div className="group bg-surface border-4 border-primary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] card-glow">
              <div className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-1">{t('prices.sortBy')}</div>
              <select
                className="w-full bg-background border-2 border-primary p-2 font-body font-bold text-primary focus:outline-none focus:border-secondary cursor-pointer"
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

          {/* Pagination controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">{t('explore.perPage')}</span>
              <select value={pageSize === Infinity ? 'all' : pageSize}
                onChange={(e) => { setPageSize(e.target.value === 'all' ? Infinity : Number(e.target.value)); setPage(0); }}
                className="bg-surface border-2 border-primary py-2 px-3 font-body font-bold text-sm text-primary focus:outline-none focus:border-secondary cursor-pointer shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="all">{t('explore.all')}</option>
              </select>
              <span className="font-headline font-bold text-xs uppercase text-on-surface-variant bg-surface-variant border border-primary px-2.5 py-1.5 shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]">
                {pageSize === Infinity ? sorted.length : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, sorted.length)}`} / {sorted.length}
              </span>
            </div>
            {totalPages > 1 && (
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-4 py-2 border-2 border-primary font-headline font-bold uppercase text-xs disabled:opacity-30 hover:bg-primary hover:text-on-primary transition-all shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                  {t('admin.previous')}
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="px-4 py-2 border-2 border-primary font-headline font-bold uppercase text-xs disabled:opacity-30 hover:bg-primary hover:text-on-primary transition-all shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                  {t('admin.next')}
                </button>
              </div>
            )}
          </div>

          <ExploreCards filtered={paginated} stats={stats} t={t} lang={lang}
            onSelect={(pz) => setSelected(pz)}
            onReportPrice={(pz) => setReportPz(pz)}
          />
        </div>
      )}

      {view === 'table' && (
        <div>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="group bg-surface border-4 border-primary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] card-glow">
              <label className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-2 block">{t('prices.zoneFilter')}</label>
              <select
                className="w-full bg-background border-2 border-primary p-2 font-body font-bold text-primary focus:outline-none focus:border-secondary cursor-pointer"
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setPage(0); }}
              >
                {cities.map((c) => (
                  <option key={c} value={c}>{c === 'all' ? t('prices.allZones') : c}</option>
                ))}
              </select>
            </div>
            <div className="group bg-primary-container border-4 border-primary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] card-glow">
              <div className="font-label font-bold text-xs uppercase tracking-widest text-primary/70 mb-1">{t('prices.avgPrice')}</div>
              <div className="font-headline font-black text-3xl md:text-4xl text-primary stat-hover">&euro;{stats.avg.toFixed(2)}</div>
            </div>
            <div className="group bg-surface-variant border-4 border-primary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] card-glow">
              <div className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-1">{t('prices.medianTitle')}</div>
              <div className="font-headline font-black text-3xl md:text-4xl text-primary stat-hover">&euro;{stats.median.toFixed(2)}</div>
            </div>
            <div className="group bg-surface border-4 border-primary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] card-glow">
              <label className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-2 block">{t('prices.sortBy')}</label>
              <select
                className="w-full bg-background border-2 border-primary p-2 font-body font-bold text-primary focus:outline-none focus:border-secondary cursor-pointer"
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

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {cheapest && (
              <div className="group bg-tertiary-container border-4 border-tertiary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] card-glow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>trending_down</span>
                  <span className="text-xs font-black font-headline uppercase tracking-widest text-tertiary">{t('prices.cheapestTitle')}</span>
                </div>
                <p className="font-headline font-black text-lg md:text-xl text-tertiary">{cheapest.name}</p>
                <p className="font-headline font-bold text-2xl md:text-3xl text-tertiary mt-1 stat-hover">&euro;{cheapest.margheritaPrice?.toFixed(2)}</p>
                <p className="font-label text-xs text-tertiary/70 uppercase mt-0.5">{cheapest.cityName}</p>
              </div>
            )}
            <div className="group bg-primary-container border-4 border-primary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] card-glow">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>balance</span>
                <span className="text-xs font-black font-headline uppercase tracking-widest text-primary">{t('prices.rangeTitle')}</span>
              </div>
              <p className="font-headline font-bold text-2xl md:text-3xl text-primary stat-hover">&euro;{stats.min.toFixed(2)} &ndash; &euro;{stats.max.toFixed(2)}</p>
              <p className="font-label text-xs text-primary/70 mt-0.5">{t('prices.minPrice')}: &euro;{stats.min.toFixed(2)} &middot; {t('prices.maxPrice')}: &euro;{stats.max.toFixed(2)}</p>
            </div>
            {priciest && (
              <div className="group bg-secondary-container border-4 border-secondary p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] card-glow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                  <span className="text-xs font-black font-headline uppercase tracking-widest text-secondary">{t('prices.priciestTitle')}</span>
                </div>
                <p className="font-headline font-black text-lg md:text-xl text-secondary">{priciest.name}</p>
                <p className="font-headline font-bold text-2xl md:text-3xl text-secondary mt-1 stat-hover">&euro;{priciest.margheritaPrice?.toFixed(2)}</p>
                <p className="font-label text-xs text-secondary/70 uppercase mt-0.5">{priciest.cityName}</p>
              </div>
            )}
          </section>
          <ExploreTable sorted={sorted} stats={stats} page={page} setPage={setPage} t={t} onSelect={(pz) => setSelected(pz)} />
        </div>
      )}

      {view === 'network' && (
        <ExploreNetwork
          data={data}
          networkStats={networkStats}
          grouped={grouped}
          cityNames={cityNames}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          t={t}
          onSelect={(pz) => setSelected(pz)}
        />
      )}

      {selected && createPortal(
        <div
          className="fixed inset-0 flex items-start justify-center p-4 z-[9999] pt-[10vh]"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="bg-background border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-lg max-h-[80vh] overflow-y-auto animate-scale-in">
            <div className="bg-primary text-on-primary p-5 flex items-center justify-between">
              <h2 className="font-headline font-black text-xl uppercase tracking-tight">{t('prices.detailTitle')}</h2>
              <button onClick={() => setSelected(null)} className="w-9 h-9 flex items-center justify-center border-2 border-on-primary hover:bg-secondary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="border-b-4 border-primary pb-4">
                <h3 className="text-2xl md:text-3xl font-headline font-black text-primary uppercase tracking-tight">{selected.name}</h3>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="bg-primary text-on-primary font-headline font-bold uppercase text-xs py-1 px-3">
                    {t(`common.${selected.category === 'wood-fired' ? 'woodFired' : selected.category}`)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-headline font-bold text-primary">{selected.rating}</span>
                  </span>
                </div>
              </div>
              {selected.description && (
                <div>
                  <div className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-1">{t('prices.description')}</div>
                  <p className="font-body font-semibold text-primary leading-relaxed">{lang === 'it' ? (selected.descriptionIt || selected.description) : selected.description}</p>
                </div>
              )}
              <div className="bg-surface-variant border-2 border-primary p-4">
                <div className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-1">{t('prices.address')}</div>
                <div className="font-body font-bold text-primary">{selected.address}</div>
              </div>
              <div className="bg-primary-container border-4 border-primary p-5 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
                <div className="font-label font-bold text-xs uppercase tracking-widest text-primary/70 mb-1">{t('prices.margherita')}</div>
                <div className="text-3xl md:text-4xl font-headline font-black text-primary">&euro;{selected.margheritaPrice?.toFixed(2)}</div>
              </div>

              <ExplorePriceReport selected={selected} t={t} />

              <div className="flex gap-3 pt-2">
                {selected.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.name + ' ' + selected.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-primary text-on-primary font-headline font-bold uppercase text-sm py-3 px-6 border-2 border-primary shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-colors"
                  >
                    <span className="material-symbols-outlined">map</span>
                    {t('explore.maps')}
                  </a>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="flex items-center gap-2 bg-background text-primary font-headline font-bold uppercase text-sm py-3 px-6 border-2 border-primary shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {reportPz && createPortal(
        <div
          className="fixed inset-0 flex items-start justify-center p-4 z-[9999] pt-[15vh]"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setReportPz(null); }}
        >
          <div className="bg-background border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="bg-primary text-on-primary p-5 flex items-center justify-between">
              <h2 className="font-headline font-black text-lg uppercase flex items-center gap-2">
                <span className="material-symbols-outlined">edit_note</span>
                {t('explore.reportPrice')}
              </h2>
              <button onClick={() => setReportPz(null)} className="w-9 h-9 flex items-center justify-center border-2 border-on-primary hover:bg-secondary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 bg-surface-variant border-2 border-primary p-4">
                <h3 className="font-headline font-black text-lg text-primary">{reportPz.name}</h3>
                <p className="font-body text-sm text-on-surface-variant mt-0.5">{reportPz.address}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-headline font-black text-xl text-primary">&euro;{reportPz.margheritaPrice?.toFixed(2)}</span>
                  <span className="font-label text-xs text-on-surface-variant">{t('explore.currentLabel')}</span>
                </div>
              </div>
              <PriceProposalForm
                pizzeriaId={reportPz.id}
                pizzeriaName={reportPz.name}
                currentPrice={reportPz.margheritaPrice}
                onSubmitted={() => setReportPz(null)}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
