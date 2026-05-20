import { useState, useMemo, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import { checkAuth } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader } from '../components/ui';
import VenueEditModal from '../components/explore/VenueEditModal';

const CATEGORY_COLORS = {
  traditional: { bg: '#C2410C', text: '#fff' },
  gourmet: { bg: '#A855F7', text: '#fff' },
  'wood-fired': { bg: '#991B1B', text: '#fff' },
  restaurant: { bg: '#3B82F6', text: '#fff' },
};

function PlaceholderImage({ pz }) {
  const colors = CATEGORY_COLORS[pz.category] || CATEGORY_COLORS.traditional;
  const initial = (pz.name || 'P')[0].toUpperCase();
  const shortName = pz.name?.length > 20 ? pz.name.slice(0, 18) + '…' : pz.name;
  return (
    <svg className="w-full h-full" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="200" fill={colors.bg} />
      <circle cx="200" cy="80" r="40" fill="rgba(255,255,255,0.15)" />
      <text x="200" y="95" textAnchor="middle" fontSize="36" fontWeight="bold" fill="#fff" fontFamily="sans-serif">{initial}</text>
      <text x="200" y="140" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff" fontFamily="sans-serif">{shortName}</text>
      <text x="200" y="165" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.8)" fontFamily="sans-serif">🍕 €{pz.margheritaPrice?.toFixed(2)} · ⭐ {pz.rating}</text>
    </svg>
  );
}

const CATEGORY_BADGE_COLORS = {
  traditional: 'bg-primary text-on-primary',
  gourmet: 'bg-tertiary text-on-tertiary',
  'wood-fired': 'bg-error text-on-error',
  restaurant: 'bg-surface-variant text-primary',
};

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
    <div className="p-6 md:p-12">
      <PageHeader
        title={t('directory.title')}
        subtitle={t('directory.subtitle')}
      >
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">search</span>
          <input
            className="bg-surface border border-outline-variant rounded-sm py-2 pl-10 pr-4 font-label text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-64 placeholder:text-on-surface-variant/40"
            placeholder={t('directory.search')}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {admin && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary text-on-primary font-headline font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-container hover:text-on-primary-container transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {t('admin.addNew')}
          </button>
        )}
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={`px-4 py-1.5 font-label font-medium text-sm tracking-wider rounded-sm transition-colors ${
              filter === cat.key
                ? 'bg-primary text-on-primary'
                : 'bg-surface text-on-surface-variant border border-outline-variant hover:bg-surface-variant'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="mb-8 bg-primary text-on-primary border border-primary/30 rounded-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-3xl text-on-primary/60" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            <div>
              <p className="font-label text-xs tracking-wider text-on-primary/60">{t('directory.total')}</p>
              <p className="font-display text-3xl font-bold">{data.length}</p>
              {activeFiltersCount > 0 && (
                <p className="font-label text-xs text-on-primary/50">
                  {filtered.length} {filtered.length === 1 ? t('directory.pizzeriaSingular') : t('directory.pizzeriaPlural')} {t('directory.withFilters')}
                </p>
              )}
            </div>
          </div>
          <div className="border-t md:border-t-0 md:border-l border-on-primary/20 pt-4 md:pt-0 md:pl-5">
            <p className="font-label text-xs tracking-wider text-on-primary/60 mb-2">{t('directory.byTown')}</p>
            <div className="flex flex-wrap gap-1.5">
              {cities.map((city) => {
                if (city === 'all') {
                  const isActive = cityFilter === 'all';
                  return (
                    <button
                      key="all"
                      onClick={() => setCityFilter('all')}
                      className={`px-2.5 py-1 font-label font-medium text-xs tracking-wider rounded-sm transition-colors ${
                        isActive
                          ? 'bg-on-primary/15 text-on-primary'
                          : 'text-on-primary/50 hover:text-on-primary hover:bg-on-primary/10'
                      }`}
                    >
                      {t('directory.all')} ({data.length})
                    </button>
                  );
                }
                const count = allCountsByCity[city] || 0;
                const filteredCount = filtered.filter(p => p.cityName === city).length;
                const isActive = cityFilter === city;
                return (
                  <button
                    key={city}
                    onClick={() => setCityFilter(cityFilter === city ? 'all' : city)}
                    className={`px-2.5 py-1 font-label font-medium text-xs tracking-wider rounded-sm transition-colors ${
                      isActive
                        ? 'bg-on-primary/15 text-on-primary'
                        : 'text-on-primary/50 hover:text-on-primary hover:bg-on-primary/10'
                    }`}
                  >
                    {city} <span className="font-semibold">{count}</span>
                    {(cityFilter !== 'all' || search !== '') && filteredCount !== count && (
                      <span className="text-on-primary/40">/{filteredCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {cityFilter !== 'all' && availableFrazioni.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2 items-center">
          <span className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant/60 mr-1">{t('prices.frazione')}:</span>
          {availableFrazioni.map((f) => {
            const isActive = frazioneFilter === f;
            return (
              <button
                key={f}
                onClick={() => setFrazioneFilter(isActive ? 'all' : f)}
                className={`px-3 py-1 font-label font-bold text-xs uppercase tracking-wider border-2 transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]'
                    : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-variant hover:border-primary shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]'
                }`}
              >
                {f === 'all' ? t('prices.allFrazioni') : f}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((pz) => (
          <article
            key={pz.id}
            className={`bg-surface border border-outline-variant rounded-sm flex flex-col group relative overflow-hidden hover-lift ${pz.status === 'closed' ? 'opacity-70' : ''}`}
          >
            <div className="h-44 border-b border-outline-variant relative overflow-hidden bg-surface-variant">
              {pz.imageUrl ? (
                <img
                  alt={pz.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  src={pz.imageUrl}
                  loading="lazy"
                />
              ) : (
                <PlaceholderImage pz={pz} />
              )}
              <div className={`absolute top-3 right-3 px-2.5 py-1 font-label font-medium text-[11px] tracking-wider rounded-sm ${CATEGORY_BADGE_COLORS[pz.category] || 'bg-primary/90 text-on-primary'}`}>
                {pz.category === 'traditional' ? t('common.traditional') : pz.category === 'gourmet' ? t('common.gourmet') : pz.category === 'wood-fired' ? t('common.woodFired') : t('common.restaurant')}
              </div>
              {pz.status === 'closed' && (
                <div className="absolute top-3 left-3 bg-error/90 text-on-error px-2.5 py-1 font-label font-bold text-[11px] tracking-widest rounded-sm flex items-center gap-1 uppercase">
                  <span className="material-symbols-outlined text-sm">block</span>
                  {t('explore.closedPermanently')}
                </div>
              )}
              {pz.isNew && (
                <div className="absolute top-3 left-3 bg-tertiary/90 text-on-tertiary px-2 py-1 font-label font-medium text-[11px] tracking-wider rounded-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">fiber_new</span>
                  {t('common.new')}
                </div>
              )}
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-2xl font-display font-bold mb-1.5 group-hover:text-primary transition-colors leading-tight">{pz.name}</h3>
              <p className="font-body text-sm text-on-surface-variant mb-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-on-surface-variant/60">location_on</span>
                {pz.frazione ? `${pz.frazione}, ${pz.address}` : pz.address}
              </p>
              <p className="font-body text-xs text-on-surface-variant/70 mb-3">{pz.cityName}</p>
              <p className="font-body text-sm text-on-surface-variant mb-5 flex-1 leading-relaxed">{lang === 'it' ? (pz.descriptionIt || pz.description) : pz.description}</p>
              <div className="flex items-center justify-between border-t border-outline-variant pt-4 mt-auto">
                <div className="flex items-center gap-1.5 text-primary/70">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-label font-semibold text-sm">{pz.rating}</span>
                </div>
                <div className="text-right">
                  <div className="font-label text-[10px] font-medium tracking-wider text-on-surface-variant/60">{t('common.margherita')}</div>
                  <div className="font-display font-bold text-lg text-primary">
                    {t('common.euro')}{pz.margheritaPrice?.toFixed(2)}
                  </div>
                </div>
              </div>
              {admin && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setEditVenue(pz)}
                    className="flex-1 flex items-center justify-center gap-1 bg-surface text-primary font-headline font-bold uppercase text-xs py-2 border-2 border-primary hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    {t('admin.edit')}
                  </button>
                  <button
                    onClick={() => { setEditVenue(pz); }}
                    className="flex-1 flex items-center justify-center gap-1 bg-secondary text-on-tertiary font-headline font-bold uppercase text-xs py-2 border-2 border-primary hover:bg-error-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    {t('common.delete')}
                  </button>
                </div>
              )}
              <a
                href={pz.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pz.name + ' ' + pz.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 bg-primary text-on-primary font-label font-medium text-sm py-2 rounded-sm hover:opacity-90 transition-opacity"
              >
                {t('directory.maps')}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-surface border border-outline-variant rounded-sm p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4 block">search_off</span>
          <p className="font-display font-bold text-2xl text-on-surface-variant">{t('directory.noResults')}</p>
          <p className="font-body text-sm text-on-surface-variant/60 mt-2">{t('directory.noResultsDesc')}</p>
        </div>
      )}

      {toast && (
        <div className={`fixed top-4 right-4 z-[100] font-headline font-bold uppercase px-6 py-3 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] ${toast.isError ? 'bg-secondary text-on-tertiary' : 'bg-primary text-on-primary'}`}>
          {toast.msg}
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
