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
    /* Avviso di servizio, non contenuto: su carta non ci va. */
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 md:p-8 pointer-events-none no-print">
      <div className="card card-accent w-full max-w-4xl animate-slide-up pointer-events-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="material-symbols-outlined text-xl text-on-surface-variant">gavel</span>
              <span className="eyebrow">{t('app.title')} &mdash; Legal Notice</span>
            </div>
            <p className="font-body text-sm leading-relaxed mb-0">
              {t('footer.disclaimer')}
            </p>
          </div>
          <div className="shrink-0 w-full md:w-auto">
            <button onClick={handleAccept} className="btn btn-primary btn-block">
              <span className="material-symbols-outlined text-base">check</span>
              {t('common.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
