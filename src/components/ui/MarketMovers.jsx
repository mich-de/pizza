/* I due estremi del filtro corrente come tessere: era lo stesso blocco su
   Prezzi e su Esplora, e tenerne due copie significava avere due posti dove
   sbagliare la regola del flap.

   Niente flap qui: il flap della pagina e' gia' la media, e tre palette sulla
   stessa schermata non si leggono piu'. Il numero e' grande e in monospaziato,
   quanto basta a leggerlo per primo dopo la media. */
export default function MarketMovers({ cheapest, priciest, stats, t, className = 'grid cols-2 mb-8' }) {
  if (!cheapest && !priciest) return null;

  return (
    <section className={className}>
      {cheapest && (
        <Mover
          pz={cheapest}
          icon="trending_down"
          label={t('prices.cheapestTitle')}
          tone="text-tertiary"
          stats={stats}
          t={t}
        />
      )}
      {priciest && (
        <Mover
          pz={priciest}
          icon="trending_up"
          label={t('prices.priciestTitle')}
          tone="text-secondary"
          stats={stats}
          t={t}
        />
      )}
    </section>
  );
}

function Mover({ pz, icon, label, tone, stats, t }) {
  const delta = stats.avg > 0 ? (pz.margheritaPrice / stats.avg - 1) * 100 : 0;
  return (
    <div className="tile">
      <div className={`flex items-center gap-2 mb-2.5 ${tone}`}>
        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <span className="font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em]">{label}</span>
      </div>
      <div className="tile-head">
        <div className="min-w-0">
          <p className="tile-title truncate">{pz.name}</p>
          <p className="font-label text-[0.72rem] uppercase tracking-[0.09em] text-on-surface-variant mt-1">{pz.cityName}</p>
        </div>
        <div className="price">
          <p className={`font-mono text-3xl font-semibold leading-none tracking-tight ${tone}`}>&euro;{pz.margheritaPrice?.toFixed(2)}</p>
          <p className="font-label text-[0.7rem] uppercase tracking-[0.08em] text-on-surface-variant mt-1.5">
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs {t('prices.avgPrice')}
          </p>
        </div>
      </div>
    </div>
  );
}
