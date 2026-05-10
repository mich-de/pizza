export default function PricesFilters({ filteredCount, cities, t }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span className="font-headline font-bold uppercase text-sm bg-secondary text-on-secondary px-3 py-1 border-2 border-primary">
        {cities.length - 1} {t('nav.network')}
      </span>
      <span className="font-headline font-bold uppercase text-sm bg-tertiary text-on-tertiary px-3 py-1 border-2 border-primary">
        {filteredCount} {t('common.filter').toLowerCase()}
      </span>
    </div>
  );
}

export function PricesStats({ stats, t }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard title={t('prices.avgPrice')} value={`€${stats.avg.toFixed(2)}`} icon="trending_up" color="primary" />
      <StatCard title={t('prices.medianTitle')} value={`€${stats.median.toFixed(2)}`} icon="balance" color="primaryContainer" />
      <StatCard title={t('prices.cheapestTitle')} value={`€${stats.min.toFixed(2)}`} icon="trending_down" color="tertiary" />
      <StatCard title={t('prices.priciestTitle')} value={`€${stats.max.toFixed(2)}`} icon="trending_up" color="secondary" />
    </section>
  );
}

function StatCard({ title, value, icon, color }) {
  const bgMap = {
    primary: 'bg-primary-container border-primary text-primary',
    primaryContainer: 'bg-primary-container border-primary text-primary',
    tertiary: 'bg-tertiary-container border-tertiary text-tertiary',
    secondary: 'bg-secondary-container border-secondary text-secondary',
  };
  return (
    <div className={`border-4 p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] ${bgMap[color] || bgMap.primary}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <p className="text-xs font-black font-headline uppercase tracking-widest">{title}</p>
      </div>
      <p className="text-3xl font-black font-headline">{value}</p>
    </div>
  );
}
