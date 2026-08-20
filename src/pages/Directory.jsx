import { useState, useMemo, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import { checkAuth } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import VenueEditModal from '../components/explore/VenueEditModal';
import { CHIP_ACTIVE } from '../config/uiTokens';
import { PageHeader } from '../components/ui';
import { formatAmount } from '../utils/formatAmount';

/* Il segnaposto non e' piu' un rettangolo colorato per categoria (quattro tinte
   piene erano il linguaggio di prima): e' una targa di tabellone — inchiostro,
   filetto ambra, iniziale in monospaziato. Cosi' anche l'assenza di foto resta
   dentro al sistema invece di bucarlo. */
function PlaceholderImage({ pz }) {
  const initial = (pz.name || 'P')[0].toUpperCase();
  const shortName = pz.name?.length > 22 ? pz.name.slice(0, 20) + '…' : pz.name;
  return (
    <svg className="w-full h-full" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" role="presentation">
      <rect width="400" height="200" fill="#111318" />
      <rect y="98" width="400" height="1" fill="rgba(255,255,255,0.07)" />
      <text x="200" y="80" textAnchor="middle" fontSize="52" fontWeight="600" fill="#e0a72b" fontFamily="Cascadia Mono, Consolas, monospace">{initial}</text>
      <text x="200" y="132" textAnchor="middle" fontSize="13" letterSpacing="2" fill="rgba(233,232,228,0.9)" fontFamily="Bahnschrift, DIN Alternate, sans-serif">{shortName?.toUpperCase()}</text>
      <text x="200" y="158" textAnchor="middle" fontSize="11" letterSpacing="1" fill="rgba(233,232,228,0.5)" fontFamily="Cascadia Mono, Consolas, monospace">€{pz.margheritaPrice?.toFixed(2)} · ★ {pz.rating}</text>
      <rect x="150" y="172" width="100" height="3" fill="#e0a72b" />
    </svg>
  );
}

export default function Directory() {
  const { data, loading } = useStitchedData();
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [frazioneFilter, setFrazioneFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [admin, setAdmin] = useState(null);
  const [editVenue, setEditVenue] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [towns, setTowns] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    checkAuth().then(user => {
      if (user?.role === 'admin') setAdmin(user);
    });
    fetch('/data/towns.json').then(r => r.json()).then(setTowns).catch(() => {});
  }, []);

  const CATEGORIES = useMemo(() => [
    { key: 'all', label: t('directory.all') },
    { key: 'traditional', label: t('directory.traditional') },
    { key: 'gourmet', label: t('directory.gourmet') },
    { key: 'wood-fired', label: t('directory.woodFired') },
  ], [t]);

  const cities = useMemo(() => ['all', ...new Set(data.map(d => d.cityName))].sort(), [data]);
  const availableFrazioni = useMemo(() => {
    if (cityFilter === 'all') return [];
    return ['all', ...new Set(data.filter(d => d.cityName === cityFilter).map(d => d.frazione).filter(Boolean))];
  }, [data, cityFilter]);

  const [prevCityFilter, setPrevCityFilter] = useState('all');
  if (cityFilter !== prevCityFilter) {
    setPrevCityFilter(cityFilter);
    setFrazioneFilter('all');
  }

  const allCountsByCity = useMemo(() => {
    return data.reduce((acc, p) => {
      acc[p.cityName] = (acc[p.cityName] || 0) + 1;
      return acc;
    }, {});
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      const matchCat = filter === 'all' || p.category === filter;
      const matchCity = cityFilter === 'all' || p.cityName === cityFilter;
      const matchFrazione = frazioneFilter === 'all' || p.frazione === frazioneFilter;
      const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.cityName.toLowerCase().includes(search.toLowerCase()) || (p.frazione && p.frazione.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchCity && matchFrazione && matchSearch;
    });
  }, [data, filter, cityFilter, frazioneFilter, search]);

  const activeFiltersCount = [filter !== 'all', cityFilter !== 'all', search !== ''].filter(Boolean).length;

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="container">
      <PageHeader
        eyebrow={t('common.peninsula')}
        title={t('directory.title')}
        subtitle={t('directory.subtitle')}
      >
        {admin && (
          <button onClick={() => setShowAdd(true)} className="btn btn-primary btn-sm">
            <span className="material-symbols-outlined text-sm">add</span>
            {t('admin.addNew')}
          </button>
        )}
      </PageHeader>

      {/* Un flap solo: il totale delle insegne. Il resto e' cornice di ricerca,
          e la ricerca su carta non serve — via con `.no-print`. */}
      <div className="panel mb-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-9">
          <div className="shrink-0">
            <span className="block font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mb-1.5">
              {t('directory.total')}
            </span>
            <span className="flap flap-lg">{data.length}</span>
            {activeFiltersCount > 0 && (
              <p className="font-label text-[0.7rem] uppercase tracking-[0.08em] text-on-surface-variant mt-2 mb-0">
                {filtered.length} {t('directory.withFilters')}
              </p>
            )}
          </div>

          <label className="field flex-1 min-w-0 mt-0 mb-0 no-print">
            <span>{t('directory.search')}</span>
            <input
              className="w-full"
              placeholder={t('directory.search')}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 pt-4 border-t border-outline-variant no-print">
          <span className="block font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mb-2">
            {t('directory.byTown')}
          </span>
          <div className="chips">
            {cities.map((city) => {
              if (city === 'all') {
                const isActive = cityFilter === 'all';
                return (
                  <button
                    key="all"
                    onClick={() => setCityFilter('all')}
                    className={`chip font-display uppercase tracking-[0.06em] px-3 py-1.5 ${isActive ? CHIP_ACTIVE : ''}`}
                  >
                    {t('directory.all')} <span className="font-mono tabular-nums ml-1">{data.length}</span>
                  </button>
                );
              }
              const count = allCountsByCity[city] || 0;
              const filteredCount = filtered.filter(p => p.cityName === city).length;
              const isActive = cityFilter === city;
              return (
                <button
                  key={city}
                  onClick={() => setCityFilter(isActive ? 'all' : city)}
                  className={`chip font-display uppercase tracking-[0.06em] px-3 py-1.5 ${isActive ? CHIP_ACTIVE : ''}`}
                >
                  {city} <span className="font-mono tabular-nums ml-1">{count}</span>
                  {(cityFilter !== 'all' || search !== '') && filteredCount !== count && (
                    <span className="font-mono tabular-nums opacity-50 ml-0.5">/{filteredCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="chips mb-5 no-print">
        {CATEGORIES.map((cat) => {
          const isActive = filter === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`chip font-display uppercase tracking-[0.06em] px-3 py-1.5 ${isActive ? CHIP_ACTIVE : ''}`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {cityFilter !== 'all' && availableFrazioni.length > 1 && (
        <div className="chips mb-5 no-print">
          <span className="font-label text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mr-1">
            {t('prices.frazione')}
          </span>
          {availableFrazioni.map((f) => {
            const isActive = frazioneFilter === f;
            return (
              <button
                key={f}
                onClick={() => setFrazioneFilter(isActive ? 'all' : f)}
                className={`chip font-display uppercase tracking-[0.06em] px-2.5 py-1 text-[0.78rem] ${isActive ? CHIP_ACTIVE : ''}`}
              >
                {f === 'all' ? t('prices.allFrazioni') : f}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 fade-in">
        {filtered.map((pz) => (
          <article
            key={pz.id}
            className={`tile flex flex-col group overflow-hidden ${pz.status === 'closed' ? 'opacity-70' : ''}`}
          >
            {/* Bordo a bordo con la tessera: i margini negativi ricalcano
                esattamente il padding di `.tile` (1rem 1.1rem). */}
            <div className="h-40 -mx-[1.1rem] -mt-[1rem] mb-4 border-b border-outline-variant relative overflow-hidden bg-surface-dim">
              {pz.imageUrl ? (
                <img
                  alt={pz.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src={pz.imageUrl}
                  loading="lazy"
                />
              ) : (
                <PlaceholderImage pz={pz} />
              )}
              <span className="badge badge-ghost absolute top-2.5 right-2.5 bg-surface">
                {pz.category === 'traditional' ? t('common.traditional') : pz.category === 'gourmet' ? t('common.gourmet') : pz.category === 'wood-fired' ? t('common.woodFired') : t('common.restaurant')}
              </span>
              {pz.status === 'closed' && (
                <span className="badge badge-error absolute top-2.5 left-2.5 bg-surface">
                  {t('explore.closedPermanently')}
                </span>
              )}
              {pz.isNew && pz.status !== 'closed' && (
                <span className="badge badge-success absolute top-2.5 left-2.5 bg-surface">
                  {t('common.new')}
                </span>
              )}
            </div>

            {/* Un flap per scheda: il prezzo. La stella resta neutra. */}
            <div className="tile-head">
              <div className="min-w-0">
                <h3 className="tile-title truncate">{pz.name}</h3>
                <p className="eyebrow mt-1.5">{pz.cityName}</p>
              </div>
              <div className="price shrink-0">
                <span className="flap">{formatAmount(pz.margheritaPrice, lang)}</span><span className="unit">EUR</span>
                <span className="flex items-center justify-end gap-1 mt-1.5 font-mono text-xs tabular-nums text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  {pz.rating}
                </span>
              </div>
            </div>

            <p className="font-body text-xs text-on-surface-variant mt-2.5 mb-0 flex items-start gap-1">
              <span className="material-symbols-outlined text-sm shrink-0">location_on</span>
              <span className="min-w-0">{pz.frazione ? `${pz.frazione}, ${pz.address}` : pz.address}</span>
            </p>

            <p className="tile-desc flex-1 line-clamp-2">
              {lang === 'it' ? (pz.descriptionIt || pz.description) : pz.description}
            </p>

            <div className="flex items-center gap-2 border-t border-outline-variant pt-3 mt-auto no-print">
              {admin && (
                <>
                  <button onClick={() => setEditVenue(pz)} className="btn btn-ghost btn-sm">
                    <span className="material-symbols-outlined text-sm">edit</span>
                    {t('admin.edit')}
                  </button>
                  {/* Il rosso solo dove si agisce in modo irreversibile. */}
                  <button onClick={() => setEditVenue(pz)} className="btn btn-secondary btn-sm">
                    <span className="material-symbols-outlined text-sm">delete</span>
                    {t('common.delete')}
                  </button>
                </>
              )}
              <a
                href={pz.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pz.name + ' ' + pz.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm ml-auto"
              >
                {t('directory.maps')}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="panel text-center py-12">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3 block">search_off</span>
          <p className="font-display uppercase tracking-[0.06em] text-xl mb-1">{t('directory.noResults')}</p>
          <p className="font-body text-sm text-on-surface-variant mb-0">{t('directory.noResultsDesc')}</p>
        </div>
      )}

      {toast && (
        /* Fondo opaco sotto l'avviso: sopra al contenuto della pagina deve
           restare leggibile, e `.alert` ha un fondo diluito. */
        <div className="fixed top-4 right-4 z-[100] max-w-sm bg-surface shadow-lg no-print">
          <div className={`alert ${toast.isError ? 'alert-error' : 'alert-success'}`}>
            <span className="material-symbols-outlined text-base leading-none">
              {toast.isError ? 'error' : 'task_alt'}
            </span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {(editVenue || showAdd) && (
        <VenueEditModal
          venue={editVenue}
          towns={towns}
          onClose={() => { setEditVenue(null); setShowAdd(false); }}
          onSaved={() => {
            setEditVenue(null);
            setShowAdd(false);
            showToast(t('admin.toastPizzeriaUpdated'));
            setTimeout(() => window.location.reload(), 800);
          }}
          onDeleted={() => {
            setEditVenue(null);
            showToast(t('admin.toastPizzeriaDeleted'));
            setTimeout(() => window.location.reload(), 800);
          }}
        />
      )}
    </div>
  );
}
