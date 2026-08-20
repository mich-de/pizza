import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import { groupByCity } from '../utils/groupByCity';
import ContributeBox from '../components/ContributeBox';
/* La finestra di segnalazione si apre gia' scelta: chi ci arriva ha premuto
   «segnala prezzo», quindi il modulo e' quello, senza un bivio di mezzo. */
import PriceProposalForm from '../components/explore/PriceProposalForm';
import ExploreCards from '../components/explore/ExploreCards';
import ExploreTable from '../components/explore/ExploreTable';
import ExploreNetwork from '../components/explore/ExploreNetwork';
import MarketMovers from '../components/ui/MarketMovers';
import { CHIP_ACTIVE } from '../config/uiTokens';
import { PageHeader } from '../components/ui';

function ExploreHero({ t, search, setSearch, exportCSV, networkStats, setPage }) {
  const { money } = useI18n();
  return (
    <>
      {/* La testatina e' identica a quella di Prezzi: occhiello, titolo in
          condensato, filetto col tratto ambra. E' quello che fa riconoscere le
          due pagine come lo stesso strumento. */}
      <PageHeader
        eyebrow={t('common.peninsula')}
        title={t('explore.title')}
        subtitle={t('explore.subtitle')}
      >
        <button onClick={exportCSV} className="btn btn-primary btn-sm">
          <span className="material-symbols-outlined text-sm">download</span>
          {t('prices.exportCSV')}
        </button>
      </PageHeader>

      <div className="panel mb-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-9">
          {/* Un flap solo per schermata: il prezzo medio della rete. */}
          <div className="shrink-0">
            <span className="block font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mb-1.5">
              {t('network.avgPrice')}
            </span>
            <span className="flap flap-lg">{money(networkStats.avgPrice)}</span><span className="unit">EUR</span>
          </div>

          <ul className="kv flex-1 min-w-0 md:grid-cols-3">
            <li><span className="k">{t('explore.total')}</span><span className="v">{networkStats.totalPizzerias}</span></li>
            <li><span className="k">{t('network.clusters')}</span><span className="v">{networkStats.clusters}</span></li>
            <li><span className="k">{t('network.avgRating')}</span><span className="v">{networkStats.avgRating.toFixed(1)}</span></li>
          </ul>
        </div>

        {/* La ricerca compone la richiesta: su carta sparisce. */}
        <label className="field mt-5 mb-0 no-print">
          <span>{t('explore.search')}</span>
          <input
            className="w-full"
            placeholder={t('explore.search')}
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </label>
      </div>
    </>
  );
}

function CityPills({ cities, data, cityFilter, setCityFilter, activeFiltersCount, resetFilters, t, setPage }) {
  return (
    /* Scegliere la citta' compone la richiesta: su carta sparisce. */
    <div className="chips mb-5 no-print">
      {cities.map((city) => {
        const isActive = cityFilter === city;
        const count = city === 'all' ? data.length : data.filter(p => p.cityName === city).length;
        return (
          <button
            key={city}
            onClick={() => { setCityFilter(isActive ? 'all' : city); setPage(0); }}
            className={`chip font-display uppercase tracking-[0.06em] px-3 py-1.5 transition-colors ${isActive ? CHIP_ACTIVE : 'hover:border-outline'}`}
          >
            {city === 'all' ? t('explore.all') : city}
            <span className={`font-mono text-xs tabular-nums ${isActive ? 'opacity-70' : 'text-on-surface-variant'}`}>
              {count}
            </span>
          </button>
        );
      })}
      {/* L'unico rosso della fascia: azzerare i filtri e' l'azione. */}
      {activeFiltersCount > 0 && (
        <button onClick={resetFilters} className="btn btn-secondary btn-sm">
          <span className="material-symbols-outlined text-sm">restart_alt</span>
          {t('explore.reset')} ({activeFiltersCount})
        </button>
      )}
    </div>
  );
}

function FrazioneFilter({ cityFilter, frazioneFilter, setFrazioneFilter, availableFrazioni, t, setPage }) {
  if (cityFilter === 'all' || availableFrazioni.length <= 1) return null;
  return (
    <div className="chips mb-5 -mt-2 no-print">
      <span className="font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mr-1">
        {t('prices.frazione')}
      </span>
      {availableFrazioni.map((f) => {
        const isActive = frazioneFilter === f;
        return (
          <button
            key={f}
            onClick={() => { setFrazioneFilter(isActive ? 'all' : f); setPage(0); }}
            className={`chip font-display uppercase tracking-[0.06em] px-2.5 py-1 text-[0.78rem] transition-colors ${isActive ? CHIP_ACTIVE : 'hover:border-outline'}`}
          >
            {f === 'all' ? t('prices.allFrazioni') : f}
          </button>
        );
      })}
    </div>
  );
}

function ViewTabs({ view, setView, tabs }) {
  return (
    /* Le tre viste come righe di tabellone: filetto sotto a tutta larghezza,
       e il tratto ambra sotto quella aperta. L'ambra segnala dove si e', non
       colora un fondo (regola 2). */
    <div className="flex mb-7 border-b border-outline-variant no-print">
      {tabs.map((tab) => {
        const isActive = view === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`relative flex items-center gap-2 px-4 md:px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.08em] transition-colors ${
              isActive ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
            {isActive && <span className="absolute left-0 right-0 -bottom-px h-[3px] bg-accent" />}
          </button>
        );
      })}
    </div>
  );
}

function ExplorePriceReport({ selected, t }) {
  return (
    <ContributeBox
      pizzeriaId={selected.id}
      pizzeriaName={selected.name}
      currentPrice={selected.margheritaPrice}
      priceLabel={t('explore.reportPrice')}
      className="border-t border-outline-variant pt-4"
    />
  );
}

export default function Explore() {
  const { data, loading } = useStitchedData();
  const { t, lang, money } = useI18n();

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
    /* Vedi Prices: `.container` governa la colonna, non un max-w locale. */
    <div className="container fade-in">
      <ExploreHero
        t={t}
        search={search}
        setSearch={setSearch}
        exportCSV={exportCSV}
        networkStats={networkStats}
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
          {/* Ordinamento, ampiezza pagina e sfogliata stanno insieme: sono tutti
              gesti di composizione della richiesta, e insieme escono di stampa. */}
          <div className="panel mb-6 no-print">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <label className="field mb-0 flex-1 min-w-0">
                <span>{t('prices.sortBy')}</span>
                <select className="w-full" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="price-asc">{t('prices.sortPriceAsc')}</option>
                  <option value="price-desc">{t('prices.sortPriceDesc')}</option>
                  <option value="name-asc">{t('prices.sortNameAsc')}</option>
                  <option value="rating-desc">{t('prices.sortRatingDesc')}</option>
                </select>
              </label>
              <label className="field mb-0 w-full lg:w-40">
                <span>{t('explore.perPage')}</span>
                <select
                  className="w-full"
                  value={pageSize === Infinity ? 'all' : pageSize}
                  onChange={(e) => { setPageSize(e.target.value === 'all' ? Infinity : Number(e.target.value)); setPage(0); }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="all">{t('explore.all')}</option>
                </select>
              </label>
              {totalPages > 1 && (
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn btn-ghost btn-sm">
                    &larr; {t('admin.previous')}
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="btn btn-ghost btn-sm">
                    {t('admin.next')} &rarr;
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-2 mt-3 pt-3 border-t border-outline-variant">
              <span className="badge badge-ghost">{data.length} {t('nav.network')}</span>
              <span className="badge badge-primary">
                {pageSize === Infinity ? sorted.length : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, sorted.length)}`} / {sorted.length}
              </span>
              {activeFiltersCount > 0 && (
                <span className="badge badge-ghost">{t('explore.withFilters', { count: filtered.length })}</span>
              )}
            </div>
          </div>

          <ExploreCards filtered={paginated} stats={stats} t={t} lang={lang}
            onSelect={(pz) => setSelected(pz)}
            onReportPrice={(pz) => setReportPz(pz)}
          />
        </div>
      )}

      {view === 'table' && (
        <div>
          <div className="panel mb-6 no-print">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
              <label className="field mb-0">
                <span>{t('prices.zoneFilter')}</span>
                <select
                  className="w-full"
                  value={cityFilter}
                  onChange={(e) => { setCityFilter(e.target.value); setPage(0); }}
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>{c === 'all' ? t('prices.allZones') : c}</option>
                  ))}
                </select>
              </label>
              <label className="field mb-0">
                <span>{t('prices.sortBy')}</span>
                <select className="w-full" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="price-asc">{t('prices.sortPriceAsc')}</option>
                  <option value="price-desc">{t('prices.sortPriceDesc')}</option>
                  <option value="name-asc">{t('prices.sortNameAsc')}</option>
                  <option value="rating-desc">{t('prices.sortRatingDesc')}</option>
                </select>
              </label>
            </div>

            <div className="flex items-center flex-wrap gap-2 mt-3 pt-3 border-t border-outline-variant">
              <span className="badge badge-ghost">{t('prices.avgPrice')} &euro;{money(stats.avg)}</span>
              <span className="badge badge-ghost">{t('prices.medianTitle')} &euro;{money(stats.median)}</span>
              <span className="badge badge-primary">{t('common.filter')}: {sorted.length}</span>
            </div>
          </div>

          {/* Gli estremi del filtro corrente: stesso blocco di Prezzi, stesso
              componente — non due copie da tenere allineate a mano. */}
          <MarketMovers cheapest={cheapest} priciest={priciest} stats={stats} t={t} />

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
          className="fixed inset-0 bg-black/55 flex items-start justify-center p-4 z-[9999] pt-[10vh] no-print"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          {/* La scheda di dettaglio e' l'unica superficie a schermo: la barra
              ambra in testa e' una sola (regola 2). */}
          <div className="card card-accent w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <span className="eyebrow">{t('prices.detailTitle')}</span>
                <h2 className="mt-1 mb-2">{selected.name}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge badge-ghost">
                    {t(`common.${selected.category === 'wood-fired' ? 'woodFired' : selected.category}`)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-sm tabular-nums text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {selected.rating}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="btn btn-ghost btn-icon shrink-0">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Il flap della scheda: il prezzo e' il dato che si viene a
                cercare, ed e' l'unico numero composto come una paletta. */}
            <div className="panel flex items-baseline justify-between gap-4">
              <span className="font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant">
                {t('prices.margherita')}
              </span>
              <span className="flap flap-lg">{money(selected.margheritaPrice)}</span><span className="unit">EUR</span>
            </div>

            <ul className="kv mt-4">
              <li><span className="k">{t('prices.address')}</span><span className="v">{selected.address}</span></li>
              <li><span className="k">{t('prices.city')}</span><span className="v">{selected.cityName}</span></li>
            </ul>

            {selected.description && (
              <div className="mt-4">
                <span className="eyebrow">{t('prices.description')}</span>
                <p className="font-body text-on-surface leading-relaxed mt-1">
                  {lang === 'it' ? (selected.descriptionIt || selected.description) : selected.description}
                </p>
              </div>
            )}

            <div className="mt-5">
              <ExplorePriceReport selected={selected} t={t} />
            </div>

            <div className="flex gap-2 mt-5 pt-4 border-t border-outline-variant no-print">
              {selected.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.name + ' ' + selected.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <span className="material-symbols-outlined text-base">map</span>
                  {t('explore.maps')}
                </a>
              )}
              <button onClick={() => setSelected(null)} className="btn btn-ghost ml-auto">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {reportPz && createPortal(
        <div
          className="fixed inset-0 bg-black/55 flex items-start justify-center p-4 z-[9999] pt-[15vh] no-print"
          onClick={(e) => { if (e.target === e.currentTarget) setReportPz(null); }}
        >
          <div className="card card-accent w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="eyebrow">{t('explore.reportPrice')}</span>
                <h2 className="mt-1 mb-0">{reportPz.name}</h2>
                <p className="font-body text-sm text-on-surface-variant mt-1">{reportPz.address}</p>
              </div>
              <button onClick={() => setReportPz(null)} className="btn btn-ghost btn-icon shrink-0">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="panel flex items-baseline justify-between gap-4 mb-4">
              <span className="font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant">
                {t('explore.currentLabel')}
              </span>
              <span className="flap">{money(reportPz.margheritaPrice)}</span><span className="unit">EUR</span>
            </div>

            <PriceProposalForm
              pizzeriaId={reportPz.id}
              pizzeriaName={reportPz.name}
              currentPrice={reportPz.margheritaPrice}
              onSubmitted={() => setReportPz(null)}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
