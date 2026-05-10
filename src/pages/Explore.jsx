import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader, StatCard } from '../components/ui';
import { groupByCity } from '../utils/groupByCity';
import PriceProposalForm from '../components/explore/PriceProposalForm';
import ExploreCards from '../components/explore/ExploreCards';
import ExploreTable from '../components/explore/ExploreTable';
import ExploreNetwork from '../components/explore/ExploreNetwork';
import { PAGE_SIZE } from '../config/exploreConfig';

function ExplorePriceReport({ selected, t }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-outline-variant pt-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-primary/5 text-primary font-label font-medium text-sm py-2.5 px-4 border border-primary/20 rounded-sm hover:bg-primary hover:text-on-primary transition-colors"
        >
          <span className="material-symbols-outlined text-lg">edit_note</span>
          {t('explore.reportPrice')}
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display font-bold text-base text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary/60">edit_note</span>
              {t('explore.reportPrice')}
            </h4>
            <button
              onClick={() => setOpen(false)}
              className="font-label text-xs font-medium uppercase text-on-surface-variant/60 hover:text-primary transition-colors"
            >
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

function FilterPill({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-label text-xs font-medium tracking-wider transition-colors ${
        active
          ? 'bg-primary/10 text-primary border border-primary/30'
          : 'bg-surface text-on-surface-variant/70 border border-outline-variant hover:bg-surface-variant hover:text-on-surface'
      }`}
    >
      {label}
      <span className={`font-display text-sm font-bold ${active ? 'text-primary' : 'text-on-surface-variant/50'}`}>
        {count}
      </span>
    </button>
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

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 md:p-12">
      <PageHeader title={t('explore.title')} subtitle={t('explore.subtitle')}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-lg">search</span>
            <input
              className="bg-surface border border-outline-variant rounded-sm py-2 pl-10 pr-4 font-body text-sm focus:outline-none focus:border-primary w-56"
              placeholder={t('explore.search')}
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-surface text-on-surface-variant/70 font-label font-medium text-sm py-2 px-4 border border-outline-variant rounded-sm hover:bg-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            {t('prices.exportCSV')}
          </button>
        </div>
      </PageHeader>

      {/* City filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {cities.map((city) => {
          const isActive = cityFilter === city;
          const count = city === 'all' ? data.length : data.filter(p => p.cityName === city).length;
          return (
            <FilterPill
              key={city}
              label={city === 'all' ? t('explore.all') : city}
              count={count}
              active={isActive}
              onClick={() => { setCityFilter(isActive ? 'all' : city); setPage(0); }}
            />
          );
        })}
        {activeFiltersCount > 0 && (
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 rounded-sm font-label text-xs font-medium tracking-wider border border-error/30 text-error/70 hover:bg-error/10 hover:text-error transition-colors"
          >
            {t('explore.reset')} ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* View tabs */}
      <div className="flex gap-1 mb-8 border-b border-outline-variant">
        {[
          { key: 'cards', icon: 'grid_view', label: t('explore.tabCards') },
          { key: 'table', icon: 'table_chart', label: t('explore.tabTable') },
          { key: 'network', icon: 'hub', label: t('explore.tabNetwork') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 font-label text-xs font-semibold uppercase tracking-wider transition-all relative ${
              view === tab.key
                ? 'text-primary'
                : 'text-on-surface-variant/60 hover:text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
            {view === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {view === 'cards' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title={t('explore.total')}
              value={data.length}
              icon="storefront"
              subtitle={activeFiltersCount > 0 ? t('explore.withFilters', { count: filtered.length }) : undefined}
            />
            <StatCard
              title={t('prices.avgPrice')}
              value={`€${stats.avg.toFixed(2)}`}
              icon="trending_up"
              color="primaryContainer"
            />
            <StatCard
              title={t('prices.medianTitle')}
              value={`€${stats.median.toFixed(2)}`}
              icon="balance"
              color="secondary"
            />
            <div className="bg-surface border border-outline-variant rounded-sm">
              <div className="p-5">
                <div className="font-label text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70 mb-1">
                  {t('prices.sortBy')}
                </div>
                <select
                  className="w-full bg-surface text-on-surface font-body font-medium text-sm border border-outline-variant rounded-sm px-3 py-2 focus:outline-none focus:border-primary cursor-pointer"
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
          </div>
          <ExploreCards filtered={sorted} stats={stats} t={t} lang={lang}
            onSelect={(pz) => setSelected(pz)}
            onReportPrice={(pz) => setReportPz(pz)}
          />
        </div>
      )}

      {view === 'table' && (
        <div>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface border border-outline-variant rounded-sm">
              <div className="p-5">
                <label className="font-label text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70 mb-2 block">
                  {t('prices.zoneFilter')}
                </label>
                <select
                  className="w-full bg-surface text-on-surface font-body font-medium text-sm border border-outline-variant rounded-sm px-3 py-2 focus:outline-none focus:border-primary cursor-pointer"
                  value={cityFilter}
                  onChange={(e) => { setCityFilter(e.target.value); setPage(0); }}
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>{c === 'all' ? t('prices.allZones') : c}</option>
                  ))}
                </select>
              </div>
            </div>
            <StatCard title={t('prices.avgPrice')} value={`€${stats.avg.toFixed(2)}`} icon="trending_up" color="primaryContainer" />
            <StatCard title={t('prices.medianTitle')} value={`€${stats.median.toFixed(2)}`} icon="balance" color="secondary" />
            <div className="bg-surface border border-outline-variant rounded-sm">
              <div className="p-5">
                <label className="font-label text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70 mb-2 block">
                  {t('prices.sortBy')}
                </label>
                <select
                  className="w-full bg-surface text-on-surface font-body font-medium text-sm border border-outline-variant rounded-sm px-3 py-2 focus:outline-none focus:border-primary cursor-pointer"
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
          </section>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {cheapest && (
              <div className="bg-tertiary/5 border border-tertiary/30 rounded-sm">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-tertiary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>trending_down</span>
                    <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-tertiary">{t('prices.cheapestTitle')}</span>
                  </div>
                  <p className="font-display font-bold text-lg text-tertiary">{cheapest.name}</p>
                  <p className="font-display font-bold text-2xl text-tertiary mt-1">€{cheapest.margheritaPrice?.toFixed(2)}</p>
                  <p className="font-label text-xs text-tertiary/60 mt-0.5">{cheapest.cityName}</p>
                </div>
              </div>
            )}
            <div className="bg-primary/5 border border-primary/30 rounded-sm">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>balance</span>
                  <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-primary">{t('prices.rangeTitle')}</span>
                </div>
                <p className="font-display font-bold text-2xl text-primary">€{stats.min.toFixed(2)} – €{stats.max.toFixed(2)}</p>
                <p className="font-label text-xs text-primary/60 mt-0.5">{t('prices.minPrice')}: €{stats.min.toFixed(2)} · {t('prices.maxPrice')}: €{stats.max.toFixed(2)}</p>
              </div>
            </div>
            {priciest && (
              <div className="bg-secondary/5 border border-secondary/30 rounded-sm">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                    <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-secondary">{t('prices.priciestTitle')}</span>
                  </div>
                  <p className="font-display font-bold text-lg text-secondary">{priciest.name}</p>
                  <p className="font-display font-bold text-2xl text-secondary mt-1">€{priciest.margheritaPrice?.toFixed(2)}</p>
                  <p className="font-label text-xs text-secondary/60 mt-0.5">{priciest.cityName}</p>
                </div>
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
          className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="bg-surface border border-outline-variant rounded-sm w-full max-w-lg max-h-[80vh] overflow-y-auto animate-scale-in shadow-xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant">
              <h2 className="text-xl font-display font-bold text-primary">{t('prices.detailTitle')}</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-surface-variant transition-colors text-on-surface-variant/60">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="border-b border-outline-variant pb-4">
                <h3 className="text-2xl font-display font-bold text-primary">{selected.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="bg-primary/10 text-primary font-label font-semibold text-xs px-2.5 py-1 rounded-sm">
                    {t(`common.${selected.category === 'wood-fired' ? 'woodFired' : selected.category}`)}
                  </span>
                  <span className="flex items-center gap-1 text-sm">
                    <span className="material-symbols-outlined text-secondary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-semibold text-on-surface">{selected.rating}</span>
                  </span>
                </div>
              </div>
              {selected.description && (
                <div>
                  <div className="font-label text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-1">{t('prices.description')}</div>
                  <p className="font-body text-sm text-on-surface leading-relaxed">{lang === 'it' ? (selected.descriptionIt || selected.description) : selected.description}</p>
                </div>
              )}
              <div className="bg-surface-variant/50 border border-outline-variant rounded-sm p-4">
                <div className="font-label text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-1">{t('prices.address')}</div>
                <div className="font-body font-medium text-on-surface">{selected.address || '—'}</div>
              </div>
              <div className="bg-primary/5 border border-primary/30 rounded-sm p-5">
                <div className="font-label text-[11px] font-semibold uppercase tracking-wider text-primary/70 mb-1">{t('prices.margherita')}</div>
                <div className="text-3xl font-display font-bold text-primary">€{selected.margheritaPrice?.toFixed(2)}</div>
              </div>

              <ExplorePriceReport selected={selected} t={t} />

              <div className="flex gap-3 pt-2">
                {selected.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.name + ' ' + selected.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-primary text-on-primary font-label font-medium text-sm py-2.5 px-5 rounded-sm hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-lg">map</span>
                    {t('explore.maps')}
                  </a>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="flex items-center gap-2 bg-surface text-on-surface-variant/70 font-label font-medium text-sm py-2.5 px-5 border border-outline-variant rounded-sm hover:bg-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
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
          className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setReportPz(null); }}
        >
          <div className="bg-surface border border-outline-variant rounded-sm w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in shadow-xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant">
              <h2 className="text-lg font-display font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary/60">edit_note</span>
                {t('explore.reportPrice')}
              </h2>
              <button onClick={() => setReportPz(null)} className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-surface-variant transition-colors text-on-surface-variant/60">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 bg-surface-variant/50 border border-outline-variant rounded-sm p-4">
                <h3 className="font-display font-bold text-lg text-primary">{reportPz.name}</h3>
                <p className="font-body text-xs text-on-surface-variant/70 mt-0.5">{reportPz.address}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-display font-bold text-xl text-primary">€{reportPz.margheritaPrice?.toFixed(2)}</span>
                  <span className="font-label text-xs text-on-surface-variant/50">{t('explore.currentLabel')}</span>
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
