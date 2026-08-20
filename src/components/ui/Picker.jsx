import { useState, useMemo, useId } from 'react';

/* Il selettore ricercabile di Quadro Partenze, al posto di una <select> lunga.
   Il sistema grafico lo prevede da sempre (`.picker`) ma finora non lo usava
   nessuno: qui serve per 418 fusi orari, che in una tendina non si trovano —
   non si cerca dentro una <select>, e non c'e' spazio per scriverci accanto
   che ore sono.

   Le righe sono <button type="button">: ci si arriva col tabulatore, si
   scelgono con Invio e l'anello di fuoco arriva dal foglio di stile. */

export default function Picker({
  items,            // [{ value, label, meta }]
  value,
  onChange,
  searchLabel,
  placeholder,
  emptyLabel,
  note,
  max = 60,
}) {
  const [query, setQuery] = useState('');
  const id = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      /* Senza ricerca l'elenco non si srotola tutto: si mostra la voce
         corrente in cima e un troncone, e chi cerca altro scrive. Mille righe
         disegnate per niente rallentano e non aiutano a scegliere. */
      const current = items.filter(i => i.value === value);
      const rest = items.filter(i => i.value !== value).slice(0, max);
      return { rows: [...current, ...rest], truncated: items.length - current.length - rest.length };
    }
    const hits = items.filter(i =>
      i.label.toLowerCase().includes(q) || String(i.meta || '').toLowerCase().includes(q)
    );
    return { rows: hits.slice(0, max), truncated: Math.max(0, hits.length - max) };
  }, [items, query, value, max]);

  return (
    <div className="picker">
      <label className="picker-search" htmlFor={id}>
        <span className="sr-only">{searchLabel}</span>
        <span className="material-symbols-outlined picker-icon" aria-hidden="true">search</span>
        <input
          id={id}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
      </label>

      <div className="picker-list" role="listbox" aria-label={searchLabel}>
        {filtered.rows.length === 0 && (
          <div className="picker-row picker-empty">{emptyLabel}</div>
        )}
        {filtered.rows.map(item => (
          <button
            key={item.value}
            type="button"
            role="option"
            aria-selected={item.value === value}
            onClick={() => onChange(item.value)}
            className={`picker-row${item.value === value ? ' current' : ''}`}
          >
            <span className="picker-main">{item.label}</span>
            {item.meta && <span className="picker-meta">{item.meta}</span>}
          </button>
        ))}
      </div>

      {(note || filtered.truncated > 0) && (
        <p className="picker-note">
          {filtered.truncated > 0 ? `+${filtered.truncated} — ${note || ''}` : note}
        </p>
      )}
    </div>
  );
}
