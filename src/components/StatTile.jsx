/* Il conteggio in cima alla pagina: numero in monospaziato, non flap. Quattro
   flap in fila smetterebbero di essere «l'unica cosa nera della pagina».
   Condiviso fra Cruscotto e Amministrazione: la stessa lettura in due posti. */
export default function StatTile({ icon, label, value, sub }) {
  return (
    <div className="tile">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-base">{icon}</span>
        <span className="font-label text-[0.68rem] font-semibold uppercase tracking-[0.13em]">{label}</span>
      </div>
      <p className="font-mono text-2xl md:text-3xl font-semibold tabular-nums tracking-tight mt-1.5 mb-0">{value}</p>
      {sub && <p className="font-body text-xs text-on-surface-variant truncate mt-1 mb-0">{sub}</p>}
    </div>
  );
}
