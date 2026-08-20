/* Primitivi condivisi, riscritti sul vocabolario Quadro Partenze.
   Le firme (nome componente, prop `variant`/`color`) restano identiche, cosi'
   ogni pagina che li usa cambia pelle senza toccare una riga. */

export function Card({ children, className = '', variant = 'default' }) {
  const variants = {
    default: 'bg-surface border border-outline-variant',
    /* La scheda in evidenza porta la barra ambra in testa, non un fondo pieno:
       una sola per schermata, o non significa piu' niente (regola 2). */
    primary: 'bg-surface border border-outline-variant border-t-[3px] border-t-accent',
    container: 'bg-surface-variant border border-outline-variant',
    secondary: 'bg-secondary text-on-secondary border border-secondary',
    tertiary: 'bg-surface border border-tertiary/40',
    surface: 'bg-surface border border-outline-variant',
  };

  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, color = 'primary' }) {
  /* Etichette da cartello: rettangolari, maiuscoletto spaziato. Il badge
     qualifica, quindi resta fuori dal colore d'azione. */
  const colors = {
    primary: 'badge-primary',
    secondary: 'badge-ghost',
    tertiary: 'badge-success',
    error: 'badge-error',
  };

  return <span className={`badge ${colors[color] || colors.primary}`}>{children}</span>;
}

export function BrutalistButton({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) {
  /* `action` e' l'unica variante rossa, e sta solo dove si preme davvero.
     `primary` e' la struttura: e' il pulsante di uso corrente. */
  const variants = {
    primary: 'btn-primary',
    action: 'btn-secondary',
    secondary: 'btn-ghost',
    surface: 'btn-ghost',
    error: 'btn-secondary',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variants[variant] || variants.primary} ${className}`}
    >
      {children}
    </button>
  );
}

/* La marina sta nella testatina di ogni pagina, quindi sta qui e non nelle
   pagine: se ognuna se la passa da sola, prima o poi una se la dimentica o ne
   mette un'altra, e la testatina smette di essere la stessa. Chi non la vuole
   passa `image={null}` — al momento nessuno. */
const HERO_IMAGE = '/images/marina-bg.webp';

export function PageHeader({ eyebrow, title, subtitle, children, compact = false, image = HERO_IMAGE, mark = null }) {
  /* La testatina di pagina, identica su tutte: occhiello col pallino ambra,
     titolo in condensato, sommario, e a destra i comandi. Il filetto a tutta
     larghezza e il tratto ambra in basso a sinistra li mette `.hero`, ed e' il
     segno che fa riconoscere ogni schermata come parte dello stesso strumento.

     I comandi stanno SEMPRE a destra, mai sciolti sotto il sommario: se ogni
     pagina li mette dove capita, la testatina smette di essere il punto fisso
     a cui l'occhio torna. Escono di stampa, perche' compongono la richiesta e
     non leggono il risultato.

     `compact` e' solo per le schermate d'ingresso, dove la testatina sta dentro
     una colonna stretta e il titolo a piena misura andrebbe a capo tre volte.

     `image` accende `.hero-media`. E' decorazione, quindi `alt` non serve e il
     file non passa mai da un `<img>`: se non carica, la pagina e' identica
     meno lo sfondo.

     `mark` e' il marchio ritagliato, e sta a sinistra del titolo — pieno, non
     in filigrana. Un marchio sbiadito steso sopra la foto non si vedeva ne'
     lui ne' la foto; a coprenza piena e con un margine suo si legge, e il
     colore ci sta perche' e' il marchio, non un'informazione da qualificare. */
  return (
    <header
      className={image ? 'hero hero-media' : 'hero'}
      style={image ? { '--hero-image': `url('${image}')` } : undefined}
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div className="flex items-center gap-4 md:gap-6 min-w-0">
          {mark}
          <div className="min-w-0">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1 className={compact ? 'text-2xl md:text-3xl' : undefined}>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        {children && <div className="flex gap-3 items-center flex-shrink-0 no-print">{children}</div>}
      </div>
    </header>
  );
}
