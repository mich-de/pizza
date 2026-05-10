import { useI18n } from '../i18n/I18nContext';
import { navItems } from '../config/navigation';
import { NavLink } from 'react-router-dom';

export default function Footer() {
  const { t, lang, setLang } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-outline-variant bg-surface/80 mt-auto animate-slide-up">
      {/* Decorative terracotta accent bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand column */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center overflow-hidden ring-1 ring-primary/20 flex-shrink-0">
                <img src="/images/logo.png" alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm tracking-tight text-primary leading-tight">
                  {t('app.title')}
                </h3>
                <p className="font-label text-[10px] font-medium text-on-surface-variant/60 tracking-wider">
                  {t('app.subtitle')}
                </p>
              </div>
            </div>
            <p className="font-body text-xs text-on-surface-variant/70 leading-relaxed max-w-xs">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] font-label font-semibold text-tertiary/80 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse-soft" />
              {t('footer.dataFresh')}
            </div>
          </div>

          {/* Quick links column */}
          <div className="space-y-3">
            <h4 className="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/50">
              {t('footer.quickLinks')}
            </h4>
            <nav className="flex flex-wrap gap-x-4 gap-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `font-label text-xs font-medium transition-colors ${
                      isActive
                        ? 'text-primary'
                        : 'text-on-surface-variant/70 hover:text-primary'
                    }`
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Language + copyright column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/50">
                {t('footer.language')}
              </h4>
              <div className="flex rounded-sm border border-outline-variant overflow-hidden w-fit">
                <button
                  onClick={() => setLang('it')}
                  className={`px-3 py-1.5 font-label text-xs font-semibold uppercase tracking-wider transition-colors ${
                    lang === 'it'
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  IT
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-3 py-1.5 font-label text-xs font-semibold uppercase tracking-wider transition-colors ${
                    lang === 'en'
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/50">
              <p className="font-label text-[11px] text-on-surface-variant/50">
                &copy; {year} PizzaRadar Sorrentum. {t('footer.allRights')}
              </p>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-12 pt-8 border-t border-outline-variant/30 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="font-body text-[10px] uppercase tracking-[0.1em] text-on-surface-variant/40 leading-relaxed">
              {t('footer.disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
