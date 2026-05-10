import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader } from '../components/ui';
import { groupByCity } from '../utils/groupByCity';
import PriceProposalForm from '../components/explore/PriceProposalForm';
import ExploreCards from '../components/explore/ExploreCards';
import ExploreTable from '../components/explore/ExploreTable';
import ExploreNetwork from '../components/explore/ExploreNetwork';
import { PAGE_SIZE } from '../config/exploreConfig';

function ExplorePriceReport({ selected, t }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t-4 border-primary pt-4 px-6 pb-2">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-surface-variant text-primary font-headline font-bold uppercase py-3 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:text-on-secondary hover:border-secondary transition-colors"
        >
          <span className="material-symbols-outlined">edit_note</span>
          Segnala prezzo errato
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-headline font-black uppercase text-base text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">edit_note</span>
              Segnala prezzo errato
            </h4>
            <button
              onClick={() => setOpen(false)}
              className="font-label text-xs font-bold uppercase text-on-surface-variant hover:text-primary transition-colors"
            >
              Annulla
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
  const [catFilter, setCatFilter] = useState('all');
  const [selectedCity, setSelectedCity] = useState(null);
  const [sortBy, setSortBy] = useState('price-asc');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [page, setPage] = useState(0);
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
  const categories = useMemo(() => ['all', ...new Set(data.map((d) => d.category))], [data]);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      const matchCity = cityFilter === 'all' || p.cityName === cityFilter;
      const matchCat = catFilter === 'all' || p.category === catFilter;
      const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.cityName.toLowerCase().includes(search.toLowerCase());
      const matchPriceMin = priceMin === '' || p.margheritaPrice >= parseFloat(priceMin);
      const matchPriceMax = priceMax === '' || p.margheritaPrice <= parseFloat(priceMax);
      return matchCity && matchCat && matchSearch && matchPriceMin && matchPriceMax;
    });
  }, [data, cityFilter, catFilter, search, priceMin, priceMax]);

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

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const grouped = useMemo(() => groupByCity(data), [data]);
  const cityNames = useMemo(() => Object.keys(grouped), [grouped]);
  const networkStats = useMemo(() => ({
    totalPizzerias: data.length,
    avgRating: data.length > 0 ? data.reduce((s, p) => s + p.rating, 0) / data.length : 0,
    avgPrice: data.length > 0 ? data.reduce((s, p) => s + (p.margheritaPrice || 0), 0) / data.length : 0,
    clusters: cityNames.length,
  }), [data, cityNames]);

  const selectedData = selectedCity ? grouped[selectedCity] || [] : [];

  const delta = (pz) => pz.margheritaPrice - stats.avg;

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

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 md:p-12">
      <PageHeader title={t('explore.title')} subtitle={t('explore.subtitle')}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary">search</span>
            <input
              className="bg-surface border-2 border-primary py-2 pl-10 pr-4 font-label uppercase focus:outline-none focus:border-secondary w-56"
              placeholder={t('explore.search')}
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-background text-primary font-label font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            {t('prices.exportCSV')}
          </button>
        </div>
      </PageHeader>

      <div className="flex flex-wrap gap-2 mb-6">
        {cities.map((city) => {
          const isActive = cityFilter === city;
          const count = city === 'all' ? data.length : data.filter(p => p.cityName === city).length;
          return (
            <button
              key={city}
              onClick={() => { setCityFilter(isActive ? 'all' : city); setPage(0); }}
              className={`px-3 py-1 border-2 border-primary font-label font-bold uppercase text-sm cursor-pointer transition-colors ${
                isActive
                  ? 'bg-primary text-on-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]'
                  : 'bg-surface text-on-surface-variant hover:bg-secondary-container'
              }`}
            >
              {city === 'all' ? t('explore.all') : city} <span className="font-headline font-black">{count}</span>
            </button>
          );
        })}
        {activeFiltersCount > 0 && (
          <button onClick={resetFilters} className="px-3 py-1 border-2 border-error text-error font-label font-bold uppercase text-sm hover:bg-error hover:text-on-error transition-colors">
            Reset ({activeFiltersCount})
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-8 border-b-4 border-primary pb-0">
        {[
          { key: 'cards', icon: 'grid_view', label: t('explore.tabCards') },
          { key: 'table', icon: 'table_chart', label: t('explore.tabTable') },
          { key: 'network', icon: 'hub', label: t('explore.tabNetwork') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`flex items-center gap-2 px-6 py-3 font-headline font-bold uppercase transition-all border-2 border-primary ${
              view === tab.key
                ? 'bg-primary text-on-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] -mb-[4px]'
                : 'bg-surface text-on-surface-variant hover:bg-secondary-container -mb-[4px]'
            }`}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'cards' && (
        <div>
          <div className="mb-8 bg-primary text-on-primary p-6 border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-4xl text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
                <div>
                  <p className="font-label text-xs uppercase tracking-widest mb-2 text-primary-container">{t('explore.total')}</p>
                  <p className="font-headline text-4xl font-black">{data.length}</p>
                  {activeFiltersCount > 0 && (
                    <p className="font-label text-xs uppercase text-primary-container/70">
                      {filtered.length} {filtered.length === 1 ? 'pizzeria' : 'pizzerie'} con filtri attivi
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <ExploreCards filtered={filtered} stats={stats} t={t} lang={lang}
            onSelect={(pz) => setSelected(pz)}
            onReportPrice={(pz) => setReportPz(pz)}
          />
        </div>
      )}

      {view === 'table' && (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <span className="font-headline font-bold uppercase text-sm bg-secondary text-on-secondary px-3 py-1 border-2 border-primary">
              {data.length} {data.length === 1 ? 'pizzeria' : 'pizzerie'}
            </span>
            <span className="font-headline font-bold uppercase text-sm bg-tertiary text-on-tertiary px-3 py-1 border-2 border-primary">
              {filtered.length} {t('common.filter').toLowerCase()}
            </span>
          </div>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface-variant border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <label className="block text-xs font-black font-headline uppercase tracking-widest mb-2 text-primary">
                {t('prices.zoneFilter')}
              </label>
              <select
                className="w-full bg-background border-2 border-primary p-2 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer"
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setPage(0); }}
              >
                {cities.map((c) => (
                  <option key={c} value={c}>{c === 'all' ? t('prices.allZones') : c}</option>
                ))}
              </select>
            </div>
            <div className="bg-primary-container border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex items-center justify-between">
              <div>
                <div className="text-xs font-black font-headline uppercase tracking-widest mb-1 text-primary">{t('prices.avgPrice')}</div>
                <div className="text-3xl font-black font-headline text-primary">€{stats.avg.toFixed(2)}</div>
              </div>
              <span className="material-symbols-outlined text-4xl text-primary">trending_up</span>
            </div>
            <div className="bg-surface-variant border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex items-center justify-between">
              <div>
                <div className="text-xs font-black font-headline uppercase tracking-widest mb-1 text-primary">{t('prices.medianTitle')}</div>
                <div className="text-3xl font-black font-headline text-primary">€{stats.median.toFixed(2)}</div>
              </div>
              <span className="material-symbols-outlined text-4xl text-primary">balance</span>
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
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {cheapest && (
              <div className="bg-tertiary-container border-4 border-tertiary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>trending_down</span>
                  <span className="text-xs font-black font-headline uppercase tracking-widest text-tertiary">{t('prices.cheapestTitle')}</span>
                </div>
                <p className="font-headline font-black text-lg text-tertiary">{cheapest.name}</p>
                <p className="font-headline font-bold text-2xl text-tertiary">€{cheapest.margheritaPrice?.toFixed(2)}</p>
                <p className="text-xs font-label text-tertiary/70 uppercase">{cheapest.cityName}</p>
              </div>
            )}
            <div className="bg-primary-container border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>balance</span>
                <span className="text-xs font-black font-headline uppercase tracking-widest text-primary">{t('prices.rangeTitle')}</span>
              </div>
              <p className="font-headline font-bold text-2xl text-primary">€{stats.min.toFixed(2)} - €{stats.max.toFixed(2)}</p>
              <p className="text-xs font-label text-primary/70 uppercase">{t('prices.minPrice')}: €{stats.min.toFixed(2)} · {t('prices.maxPrice')}: €{stats.max.toFixed(2)}</p>
            </div>
            {priciest && (
              <div className="bg-secondary-container border-4 border-secondary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                  <span className="text-xs font-black font-headline uppercase tracking-widest text-secondary">{t('prices.priciestTitle')}</span>
                </div>
                <p className="font-headline font-black text-lg text-secondary">{priciest.name}</p>
                <p className="font-headline font-bold text-2xl text-secondary">€{priciest.margheritaPrice?.toFixed(2)}</p>
                <p className="text-xs font-label text-secondary/70 uppercase">{priciest.cityName}</p>
              </div>
            )}
          </section>
          <ExploreTable sorted={sorted} stats={stats} page={page} setPage={setPage} t={t} />
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
        />
      )}

      {/* Modale Dettagli */}
      {selected && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="bg-background border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="bg-primary text-on-primary p-4 flex items-center justify-between">
              <h2 className="font-headline font-black text-xl uppercase">{t('prices.detailTitle')}</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center border-2 border-on-primary hover:bg-secondary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="border-b-2 border-primary pb-3">
                <h3 className="text-2xl font-headline font-black text-primary">{selected.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-primary text-on-primary font-label font-bold uppercase text-xs py-1 px-2">
                    {t(`common.${selected.category === 'wood-fired' ? 'woodFired' : selected.category}`)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-bold">{selected.rating}</span>
                  </span>
                </div>
              </div>
              {selected.description && (
                <div>
                  <div className="text-xs font-black font-headline uppercase text-on-surface-variant mb-1">{t('prices.description')}</div>
                  <p className="font-body text-sm text-primary">{lang === 'it' ? (selected.descriptionIt || selected.description) : selected.description}</p>
                </div>
              )}
              <div className="bg-surface-variant border-2 border-primary p-3">
                <div className="text-xs font-black font-headline uppercase text-on-surface-variant mb-1">{t('prices.address')}</div>
                <div className="font-body font-bold text-primary">{selected.address || '—'}</div>
              </div>
              <div className="bg-primary-container border-4 border-primary p-4">
                <div className="text-xs font-black font-headline uppercase text-primary mb-1">🍕 {t('prices.margherita')}</div>
                <div className="text-3xl font-black font-headline text-primary">€{selected.margheritaPrice?.toFixed(2)}</div>
              </div>

              <ExplorePriceReport selected={selected} t={t} />

              <div className="flex gap-3">
                {selected.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.name + ' ' + selected.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-primary text-on-primary font-label font-bold uppercase text-sm py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary transition-colors"
                  >
                    <span className="material-symbols-outlined">map</span>
                    Maps
                  </a>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="flex items-center gap-2 bg-background text-primary font-label font-bold uppercase text-sm py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modale Segnala Prezzo */}
      {reportPz && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999 }}
          onClick={(e) => { if (e.target === e.currentTarget) setReportPz(null); }}
        >
          <div className="bg-background border-4 border-secondary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-secondary text-on-secondary p-3 flex items-center justify-between">
              <h2 className="font-headline font-black text-base uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">edit_note</span>
                Segnala Prezzo
              </h2>
              <button onClick={() => setReportPz(null)} className="w-7 h-7 flex items-center justify-center border-2 border-on-secondary hover:bg-secondary-container transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="p-4">
              <div className="mb-3 bg-surface-variant border-2 border-primary p-3">
                <h3 className="font-headline font-bold text-lg text-primary">{reportPz.name}</h3>
                <p className="font-body text-xs text-on-surface-variant">{reportPz.address}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-label font-bold text-lg text-primary">€{reportPz.margheritaPrice?.toFixed(2)}</span>
                  <span className="text-xs text-on-surface-variant">(attuale)</span>
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
