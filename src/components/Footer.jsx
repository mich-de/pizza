import { useI18n } from '../i18n/I18nContext';
import { navItems } from '../config/navigation';
import { NavLink } from 'react-router-dom';

export default function Footer() {
  const { t, lang, setLang } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-4 border-primary bg-surface mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-secondary to-primary opacity-40 blur-sm group-hover:opacity-100 transition-opacity" />
                <div className="relative w-14 h-14 bg-surface border-4 border-primary flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                  <img src={lang === 'it' ? '/images/logo_ita_transparent.png' : '/images/logo_eng_transparent.png'} alt="" className="w-10 h-10 object-contain relative z-10" />
                </div>
              </div>
              <div>
                <h3 className="font-headline font-black text-lg uppercase tracking-tight text-primary leading-tight">
                  {t('app.title')}
                </h3>
                <p className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">
                  {t('app.subtitle')}
                </p>
              </div>
            </div>
            <p className="font-body font-semibold text-sm text-on-surface-variant leading-relaxed max-w-xs">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-2 text-xs font-headline font-bold uppercase text-tertiary tracking-wider">
              <span className="w-2 h-2 bg-tertiary animate-pulse-soft" />
              {t('footer.dataFresh')}
            </div>
          </div>

          {/* Quick links column */}
          <div className="space-y-4">
            <h4 className="font-headline font-black text-xs uppercase tracking-widest text-primary border-b-2 border-primary pb-2 inline-block">
              {t('footer.quickLinks')}
            </h4>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `font-headline font-bold text-sm uppercase tracking-wider transition-colors ${
                      isActive
                        ? 'text-primary'
                        : 'text-on-surface-variant hover:text-primary hover:translate-x-1'
                    }`
                  }
                >
                  <span className="inline-block transition-transform duration-200">
                    {t(item.labelKey)}
                  </span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Language + copyright column */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-headline font-black text-xs uppercase tracking-widest text-primary border-b-2 border-primary pb-2 inline-block">
                {t('footer.language')}
              </h4>
              <div className="flex border-4 border-primary shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] w-fit">
                <button
                  onClick={() => setLang('it')}
                  className={`px-5 py-2 font-headline font-bold text-sm uppercase tracking-wider transition-colors ${
                    lang === 'it'
                      ? 'bg-primary text-on-primary'
                      : 'bg-background text-primary hover:bg-primary-container'
                  }`}
                >
                  IT
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-5 py-2 font-headline font-bold text-sm uppercase tracking-wider transition-colors ${
                    lang === 'en'
                      ? 'bg-primary text-on-primary'
                      : 'bg-background text-primary hover:bg-primary-container'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="pt-4 border-t-4 border-primary">
              <p className="font-headline font-bold text-xs uppercase text-on-surface-variant">
                &copy; {year} PizzaRadar Sorrento. {t('footer.allRights')}
              </p>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-14 pt-8 border-t-4 border-primary">
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-label font-bold text-xs uppercase tracking-[0.15em] text-on-surface-variant/50 leading-relaxed">
              {t('footer.disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
