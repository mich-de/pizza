import { useI18n } from '../i18n/I18nContext';
import BrandMark from './BrandMark';

/* La targa del marchio, una sola per tutte e tre le fasce d'inchiostro:
   colonna laterale, barra alta, cassetto. Compariva identica tre volte.

   Il marchio sta sul fondo senza riquadro dietro. Il riquadro era ambra piena,
   e l'ambra segnala — non fa da fondo esteso (regola 2): un quadrato ambra
   fisso in testa alla colonna spegne il filetto ambra sotto la targa, che e'
   il segnale vero. Il marchio e' per giunta un tondo, e un tondo dentro un
   rettangolo a spigoli si vede solo come rettangolo. */
const SIZES = {
  sm: { mark: 'w-8 h-8', title: 'text-[0.95rem]', sub: 'text-[0.55rem] tracking-[0.2em]' },
  md: { mark: 'w-10 h-10', title: 'text-base', sub: 'text-[0.58rem] tracking-[0.22em]' },
};

export default function BrandPlate({ size = 'md' }) {
  const { t } = useI18n();
  const s = SIZES[size] || SIZES.md;

  return (
    <div className="flex items-center gap-3 min-w-0">
      {/* Il segno sta nudo sul fondo: il ritaglio e' pulito, quindi non serve
          ne' riquadro ne' maschera tonda attorno. */}
      <BrandMark size={128} className={s.mark} />
      <div className="min-w-0">
        <strong className={`block font-display ${s.title} font-semibold uppercase tracking-[0.01em] leading-none text-on-ink truncate`}>
          {t('app.title')}
        </strong>
        <span className={`block font-label ${s.sub} uppercase text-accent/85 mt-1 truncate`}>
          {t('app.subtitle')}
        </span>
      </div>
    </div>
  );
}
