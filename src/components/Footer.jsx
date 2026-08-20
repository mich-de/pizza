import { useI18n } from '../i18n/I18nContext';
import { navItems } from '../config/navigation';
import { NavLink } from 'react-router-dom';
import BrandPlate from './BrandPlate';

export default function Footer() {
  const { t, lang, setLang } = useI18n();
  const year = new Date().getFullYear();

  return (
    /* L'altra sponda della cornice: stessa fascia d'inchiostro della testata,
       chiusa in alto dal filetto ambra. Resta scura in entrambi i temi. */
    <footer className="mt-auto bg-ink text-on-ink/70 border-t-[3px] border-accent/55 no-print">
      <div className="max-w-6xl mx-auto px-6 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
          <div className="space-y-4">
            {/* Quarta copia dello stesso blocco marchio, con la piastrella
                ambra che le altre tre avevano gia' perso. Ora usa `BrandPlate`
                come colonna, barra alta e cassetto. */}
            <BrandPlate />
            <p className="font-body text-sm text-on-ink/60 leading-relaxed max-w-xs">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-2 font-label text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-on-ink/50">
              <span className="w-1.5 h-1.5 bg-accent flex-shrink-0" />
              {t('footer.dataFresh')}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-label text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-on-ink/45 pb-2 border-b border-white/10">
              {t('footer.quickLinks')}
            </h4>
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `font-label text-[0.78rem] font-medium uppercase tracking-[0.075em] transition-colors ${
                      isActive ? 'text-accent' : 'text-on-ink/60 hover:text-on-ink'
                    }`
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-label text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-on-ink/45 pb-2 border-b border-white/10">
                {t('footer.language')}
              </h4>
              <div className="flex border border-white/20 w-fit" style={{ borderRadius: '2px' }}>
                <button
                  onClick={() => setLang('it')}
                  className={`px-4 py-1.5 font-label text-[0.72rem] font-semibold uppercase tracking-[0.07em] transition-colors ${
                    lang === 'it' ? 'bg-accent text-on-accent' : 'text-on-ink/55 hover:text-on-ink hover:bg-white/[0.08]'
                  }`}
                >
                  IT
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-4 py-1.5 font-label text-[0.72rem] font-semibold uppercase tracking-[0.07em] transition-colors ${
                    lang === 'en' ? 'bg-accent text-on-accent' : 'text-on-ink/55 hover:text-on-ink hover:bg-white/[0.08]'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="font-label text-[0.7rem] uppercase tracking-[0.075em] text-on-ink/45">
                &copy; {year} PizzaRadar Sorrento. {t('footer.allRights')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="max-w-4xl mx-auto text-center font-label text-[0.66rem] uppercase tracking-[0.1em] text-on-ink/35 leading-relaxed">
            {t('footer.disclaimer')}
          </p>
        </div>
      </div>
    </footer>
  );
}
