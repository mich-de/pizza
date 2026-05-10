import { useI18n } from '../i18n/I18nContext';

export default function LoadingSpinner({ fullScreen = false }) {
  const { t } = useI18n();
  const container = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-background'
    : 'flex items-center justify-center py-12';

  return (
    <div className={container}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-16 h-16">
          <svg className="animate-pizza-spin w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="#C84C09" stroke="#C84C09" strokeWidth="2" />
            <circle cx="50" cy="50" r="35" fill="#DC2626" stroke="#C84C09" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="30" fill="#FBBF24" stroke="#C84C09" strokeWidth="1.5" />
            <line x1="50" y1="20" x2="50" y2="80" stroke="#C84C09" strokeWidth="1.5" />
            <line x1="20" y1="50" x2="80" y2="50" stroke="#C84C09" strokeWidth="1.5" />
            <line x1="28.8" y1="28.8" x2="71.2" y2="71.2" stroke="#C84C09" strokeWidth="1.5" />
            <line x1="71.2" y1="28.8" x2="28.8" y2="71.2" stroke="#C84C09" strokeWidth="1.5" />
            <circle cx="40" cy="40" r="5" fill="#A03030" stroke="#C84C09" strokeWidth="1" />
            <circle cx="60" cy="40" r="5" fill="#A03030" stroke="#C84C09" strokeWidth="1" />
            <circle cx="50" cy="60" r="5" fill="#A03030" stroke="#C84C09" strokeWidth="1" />
            <circle cx="35" cy="55" r="4" fill="#5C7A3E" stroke="#C84C09" strokeWidth="1" />
            <circle cx="65" cy="55" r="4" fill="#5C7A3E" stroke="#C84C09" strokeWidth="1" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-label font-medium text-sm text-primary/60 animate-pulse-soft">
            {t('loading.margherita')}
          </p>
        </div>
      </div>
    </div>
  );
}
