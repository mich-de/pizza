import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';

export default function LegalBanner() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('pizza-legal-accepted');
    if (!accepted) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('pizza-legal-accepted', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 md:p-8 pointer-events-none">
      <div className="w-full max-w-4xl bg-surface border-4 border-primary shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] p-6 md:p-8 animate-slide-up pointer-events-auto">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 text-secondary">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
              <h2 className="font-headline font-black text-xl uppercase tracking-tight">{t('app.title')} — Legal Notice</h2>
            </div>
            <p className="font-body text-sm text-primary leading-relaxed">
              {t('footer.disclaimer')}
            </p>
          </div>
          <div className="flex-shrink-0 w-full md:w-auto">
            <button
              onClick={handleAccept}
              className="w-full bg-primary text-on-primary font-headline font-black uppercase py-4 px-8 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary hover:text-on-secondary transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              {t('common.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
