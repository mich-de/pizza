import { useState, useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useStitchedData } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader } from '../components/ui';

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
  const [search, setSearch] = useState('');

  const CATEGORIES = useMemo(() => [
    { key: 'all', label: t('directory.all') },
    { key: 'traditional', label: t('directory.traditional') },
    { key: 'gourmet', label: t('directory.gourmet') },
    { key: 'wood-fired', label: t('directory.woodFired') },
  ], [t]);

  const cities = useMemo(() => ['all', ...new Set(data.map(d => d.cityName))].sort(), [data]);

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
      const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.cityName.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchCity && matchSearch;
    });
  }, [data, filter, cityFilter, search]);

  const activeFiltersCount = [filter !== 'all', cityFilter !== 'all', search !== ''].filter(Boolean).length;

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 md:p-12">
      <PageHeader
        title={t('directory.title')}
        subtitle={t('directory.subtitle')}
      >
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary">search</span>
          <input
            className="bg-surface-bright border-2 border-primary py-2 pl-10 pr-4 font-label uppercase focus:outline-none focus:border-secondary w-64"
            placeholder={t('directory.search')}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </PageHeader>

      <div className="mb-8 flex flex-wrap gap-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={`border-2 border-primary px-6 py-2 font-label font-bold uppercase transition-colors ${
              filter === cat.key
                ? 'bg-primary-container text-on-primary-container shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]'
                : 'bg-surface text-primary hover:bg-secondary-container'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="mb-8 bg-primary text-on-primary p-6 border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-4xl text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            <div>
              <p className="font-label text-xs uppercase tracking-widest text-primary-container">{t('directory.total')}</p>
              <p className="font-headline text-4xl font-black">{data.length}</p>
              {activeFiltersCount > 0 && (
                <p className="font-label text-xs uppercase text-primary-container/70">
                  {filtered.length} {filtered.length === 1 ? 'pizzeria' : 'pizzerie'} con filtri attivi
                </p>
              )}
            </div>
          </div>
          <div className="border-t-2 md:border-t-0 md:border-l-2 border-primary-container pt-4 md:pt-0 md:pl-6">
            <p className="font-label text-xs uppercase tracking-widest text-primary-container mb-3">{t('directory.byTown')}</p>
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => {
                if (city === 'all') {
                  const isActive = cityFilter === 'all';
                  return (
                    <button
                      key="all"
                      onClick={() => setCityFilter('all')}
                      className={`px-3 py-1 border-2 font-label font-bold uppercase text-sm cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-primary-container text-primary border-primary-container'
                          : 'border-primary-container/50 text-primary-container/50 hover:text-primary-container hover:border-primary-container/70'
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
                    className={`px-3 py-1 border-2 font-label font-bold uppercase text-sm cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-primary-container text-primary border-primary-container'
                        : 'border-primary-container/50 text-primary-container/50 hover:text-primary-container hover:border-primary-container/70'
                    }`}
                  >
                    {city} <span className="font-headline font-black">{count}</span>
                    {(cityFilter !== 'all' || search !== '') && filteredCount !== count && (
                      <span className="text-primary-container/60">/{filteredCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {filtered.map((pz) => (
          <article
            key={pz.id}
            className="bg-surface-bright border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex flex-col group relative overflow-hidden hover:-translate-y-1 transition-transform"
          >
            <div className="h-48 border-b-4 border-primary relative overflow-hidden">
              {pz.imageUrl ? (
                <img
                  alt={pz.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                  src={pz.imageUrl}
                  loading="lazy"
                />
              ) : (
                <PlaceholderImage pz={pz} />
              )}
              <div className={`absolute top-4 right-4 px-3 py-1 font-label font-bold uppercase border-2 border-primary text-sm transform rotate-1 ${CATEGORY_BADGE_COLORS[pz.category] || 'bg-primary text-on-primary'}`}>
                {pz.category === 'traditional' ? t('common.traditional') : pz.category === 'gourmet' ? t('common.gourmet') : pz.category === 'wood-fired' ? t('common.woodFired') : t('common.restaurant')}
              </div>
              {pz.isNew && (
                <div className="absolute top-4 left-4 bg-tertiary text-on-tertiary px-2 py-1 font-label font-bold uppercase text-xs border-2 border-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">fiber_new</span>
                  Nuovo
                </div>
              )}
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-3xl font-headline font-black uppercase mb-2 group-hover:text-tertiary transition-colors">{pz.name}</h3>
              <p className="font-body text-on-surface-variant mb-1 text-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {pz.frazione ? `${pz.frazione}, ${pz.address}` : pz.address}
              </p>
              <p className="font-body text-on-surface-variant text-xs mb-4">{pz.cityName}</p>
              <p className="font-body text-on-surface-variant mb-6 flex-1 text-sm">{lang === 'it' ? (pz.descriptionIt || pz.description) : pz.description}</p>
              <div className="flex items-center justify-between border-t-2 border-primary pt-4 mt-auto">
                <div className="flex items-center gap-2 font-label font-bold">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  {pz.rating}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">🍕 Margherita</div>
                  <div className="font-headline font-black text-xl text-primary">
                    {t('common.euro')}{pz.margheritaPrice?.toFixed(2)}
                  </div>
                </div>
              </div>
              <a
                href={pz.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pz.name + ' ' + pz.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 bg-primary text-on-primary font-label font-bold uppercase text-sm py-2 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-colors"
              >
                {t('directory.maps')}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-surface-bright border-4 border-primary p-12 text-center shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <span className="material-symbols-outlined text-5xl text-primary mb-4 block">search_off</span>
          <p className="font-headline font-black text-2xl uppercase">{t('directory.noResults')}</p>
          <p className="font-body text-on-surface-variant mt-2">{t('directory.noResultsDesc')}</p>
        </div>
      )}
    </div>
  );
}
