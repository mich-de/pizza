import { useI18n } from '../i18n/I18nContext';

function PizzaSpinner() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      style={{ animation: 'pizza-spin 1.2s linear infinite', display: 'block' }}
    >
      {/* Crust / outer ring */}
      <circle cx="32" cy="32" r="30" fill="#C2410C" />
      {/* Sauce */}
      <circle cx="32" cy="32" r="24" fill="#EA580C" />
      {/* Cheese */}
      <circle cx="32" cy="32" r="18" fill="#FCD34D" />
      {/* Slice dividers */}
      <line x1="32" y1="2" x2="32" y2="62" stroke="#C2410C" strokeWidth="2" />
      <line x1="2" y1="32" x2="62" y2="32" stroke="#C2410C" strokeWidth="2" />
      <line x1="9" y1="9" x2="55" y2="55" stroke="#C2410C" strokeWidth="2" />
      <line x1="55" y1="9" x2="9" y2="55" stroke="#C2410C" strokeWidth="2" />
      {/* Toppings — small circles */}
      <circle cx="32" cy="20" r="3" fill="#991B1B" />
      <circle cx="20" cy="38" r="2.5" fill="#991B1B" />
      <circle cx="44" cy="38" r="2.5" fill="#991B1B" />
      <circle cx="32" cy="44" r="2" fill="#16A34A" />
      <circle cx="24" cy="26" r="2" fill="#16A34A" />
    </svg>
  );
}

export default function LoadingSpinner({ fullScreen = false }) {
  const { t } = useI18n();

  const inner = (
    <div className="bg-primary-container border-4 border-primary p-8 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col items-center">
      <style>{`
        @keyframes pizza-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <PizzaSpinner />
      <p className="font-headline font-black uppercase mt-4 text-xl tracking-tight">
        {t('common.loading')}
      </p>
      <p className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-1">
        🍕 Caricamento Margherita...
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-[60vh]">
        {inner}
      </div>
    );
  }

  return inner;
}
