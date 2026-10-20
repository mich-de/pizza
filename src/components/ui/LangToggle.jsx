import { useI18n } from '../../i18n/I18nContext';

/* Il commutatore di lingua, una volta sola.
   Stava scritto quattro volte — barra superiore, cassetto, barra laterale,
   pie' di pagina — con quattro imbottiture diverse e lo stesso comportamento.
   Quattro copie non sono quattro varianti: sono tre occasioni di correggerne
   una e dimenticare le altre, ed e' quello che era successo con l'area di
   tocco, alta 16px in un posto e 29 in un altro.

   Tre forme, che sono tre posti diversi, non tre gusti:
   - `pair` (predefinita) — le due lingue accanto, quella in uso in ambra.
     Dove c'e' spazio: pie' di pagina, cassetto, barra laterale.
   - `wide` — la stessa, con piu' respiro ai lati: il pie' di pagina, dove non
     e' schiacciata contro nient'altro.
   - `dense` — una lettera sola, quella verso cui si va. Nella barra
     superiore del telefono, dove ogni pixel di larghezza e' conteso.

   L'area di tocco arriva a 44px su telefono e torna compatta da tablet in su:
   col dito la densita' e' un ostacolo, col mouse e' un pregio. */

const LABEL = { it: 'Passa all’italiano', en: 'Switch to English' };

export default function LangToggle({ variant = 'pair' }) {
  const { lang, setLang } = useI18n();

  if (variant === 'dense') {
    const next = lang === 'it' ? 'en' : 'it';
    return (
      /* Due lettere sono un bersaglio da 16px: col dito non si prende, si
         tenta. Il testo resta minuscolo — «EN» in corpo grande, dentro una
         fascia alta 44px, sembrerebbe la voce principale — ma l'area attorno
         arriva alla misura del polpastrello. */
      <button
        type="button"
        onClick={() => setLang(next)}
        aria-label={LABEL[next]}
        className="w-11 h-11 md:w-auto md:h-auto flex items-center justify-center font-label text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-on-ink/60 hover:text-accent hover:bg-white/[0.08] transition-colors"
        style={{ borderRadius: '2px' }}
      >
        {next.toUpperCase()}
      </button>
    );
  }

  const pad = variant === 'wide' ? 'px-4' : 'px-3';

  return (
    <div className="flex border border-white/20 w-fit" style={{ borderRadius: '2px' }}>
      {['it', 'en'].map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          aria-label={LABEL[code]}
          className={`${pad} min-h-11 md:min-h-0 md:px-2.5 md:py-0.5 flex items-center justify-center font-label text-[0.7rem] font-semibold uppercase tracking-[0.07em] transition-colors ${
            lang === code
              ? 'bg-accent text-on-accent'
              : 'text-on-ink/55 hover:text-on-ink hover:bg-white/[0.08]'
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
