import { useI18n } from '../i18n/I18nContext';

/* Il marchio ritagliato, in un posto solo.
   Prima la scelta del file stava dentro `BrandPlate`, e chiunque altro volesse
   il marchio doveva riscrivere la stessa riga con lo stesso ternario sulla
   lingua. Ora la sa questo componente e basta.

   Gli originali sono due PNG da 2048 quadri e quasi 4 MB l'uno: il ritaglio
   era gia' fatto bene — fondo davvero trasparente, bordo sfumato su 14 quadri,
   nessun alone — ma il corpo del segno stava a opacita' 254 invece di 255 e
   attorno restava un pulviscolo a opacita' 1-3. Qui si servono le copie
   ripulite, riquadrate sul contenuto e ridotte: 11 kB a 128 quadri, 87 kB a
   512. Gli originali restano al loro posto come sorgente. */
const FILES = {
  128: { it: '/images/logo_ita-128.webp', en: '/images/logo_eng-128.webp' },
  512: { it: '/images/logo_ita-512.webp', en: '/images/logo_eng-512.webp' },
};

export default function BrandMark({ size = 128, className = '', alt = '' }) {
  const { lang } = useI18n();
  const set = FILES[size] || FILES[128];

  return (
    <img
      src={lang === 'it' ? set.it : set.en}
      alt={alt}
      /* Niente `rounded-full`: il segno e' gia' della sua forma, e la scritta
         in arco e lo spicchio sporgono oltre il tondo — ritagliarli a cerchio
         li tagliava via. `object-contain` perche' il riquadro e' quadrato e il
         disegno anche, ma chi lo usa puo' dargli misure sue. */
      className={`shrink-0 object-contain ${className}`}
      loading="lazy"
      decoding="async"
      width={size}
      height={size}
    />
  );
}
