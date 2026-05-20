import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { navItems } from '../config/navigation';
import { useStitchedData, usePendingCounts } from '../hooks/useDataFetch';

const activeLinkClass = 'text-primary bg-primary/10 border-r-4 border-primary px-4 py-3 my-0.5 flex items-center gap-3 font-headline font-bold text-sm tracking-wide transition-all';
const inactiveLinkClass = 'text-on-surface-variant/60 hover:text-primary hover:bg-primary/5 border-r-4 border-transparent hover:border-primary/30 px-4 py-3 my-0.5 flex items-center gap-3 font-headline font-bold text-sm tracking-wide transition-all duration-200';

export default function Sidebar() {
  const { t, lang, setLang } = useI18n();
  const { data } = useStitchedData();
  const { total: pendingTotal, isAdmin } = usePendingCounts();
  const year = new Date().getFullYear();

  const globalAvg = data.length > 0
    ? data.reduce((s, p) => s + (p.margheritaPrice || 0), 0) / data.length
    : null;

  const cheapest = data.length > 0
    ? data.reduce((min, p) => (p.margheritaPrice < min.margheritaPrice ? p : min), data[0])
    : null;

  return (
    <nav className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 bg-surface border-r-4 border-primary shadow-[4px_0_20px_rgba(0,0,0,0.06)] w-72 flex-shrink-0">
      {/* Brand zone */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#009246] via-primary to-[#CE2B37]" />

        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden ring-2 ring-primary/30 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.15)] flex-shrink-0">
              <img src={lang === 'it' ? '/images/logo_ita_transparent.png' : '/images/logo_eng_transparent.png'} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-display font-black text-xl tracking-tight text-primary leading-tight">
                {t('app.title')}
              </h2>
              <p className="font-headline font-bold text-xs text-on-surface-variant/50 tracking-wider mt-1 uppercase">
                {t('app.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Price hero */}
        {globalAvg !== null && (
          <div className="relative mx-5 mb-6 bg-gradient-to-br from-primary via-primary-fixed-dim to-primary border-2 border-primary/20 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.2)]">
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.05) 12px, rgba(255,255,255,0.05) 13px)`,
            }} />
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-black/5 rounded-full translate-y-1/3 -translate-x-1/4" />
            <div className="relative px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse-soft flex-shrink-0 shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
                <span className="font-headline font-bold text-xs uppercase tracking-widest text-white/70">
                  {t('sidebar.mediaMargherita')}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-3xl tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                  €{globalAvg.toFixed(2)}
                </span>
                <span className="font-headline font-bold text-xs text-white/50">
                  {t('sidebar.generalAvg')}
                </span>
              </div>
              {cheapest && (
                <div className="mt-2 pt-2 border-t border-white/15 flex items-center gap-2">
                  <span className="material-symbols-outlined text-white/50 text-base">trending_down</span>
                  <span className="font-headline font-bold text-xs text-white/60">{t('sidebar.fromPrice', { price: cheapest.margheritaPrice?.toFixed(2) })}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-b-4 border-primary mx-5" />
      </div>

      {/* Navigation */}
      <div className="flex-1 py-5 overflow-y-auto space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              isActive ? activeLinkClass : inactiveLinkClass
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined !text-xl transition-all duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {item.icon}
                </span>
                <span className="flex-1 text-base">{t(item.labelKey)}</span>
                {item.to === '/admin' && isAdmin && pendingTotal > 0 && (
                  <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 bg-error text-on-error text-xs font-headline font-bold rounded-sm border-2 border-surface shadow-[2px_2px_0px_0px_rgba(26,26,26,0.2)]">
                    {pendingTotal}
                  </span>
                )}
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft shadow-[0_0_6px_rgba(200,76,9,0.4)] flex-shrink-0" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t-4 border-primary bg-surface/95">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-on-surface-variant/40">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span className="font-headline font-bold text-xs uppercase tracking-wider">
                &copy; {year}
              </span>
            </div>
            <div className="flex rounded-sm border-2 border-primary overflow-hidden">
              <button
                onClick={() => setLang('it')}
                className={`px-3 py-1 font-headline font-bold text-xs uppercase tracking-wider transition-colors ${
                  lang === 'it'
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant/50 hover:text-primary hover:bg-primary/10'
                }`}
              >
                IT
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 font-headline font-bold text-xs uppercase tracking-wider transition-colors ${
                  lang === 'en'
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant/50 hover:text-primary hover:bg-primary/10'
                }`}
              >
                EN
              </button>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t-2 border-primary/10">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping flex-shrink-0 shadow-[0_0_6px_rgba(200,76,9,0.4)]" />
              <span className="font-headline font-bold text-xs uppercase tracking-wider text-primary">
                Admin
              </span>
            </div>
          )}
          {data.length > 0 && (
            <div className="flex items-center gap-2 mt-2 text-on-surface-variant/50">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse-soft" />
              <span className="font-headline font-bold text-xs">
                {t('sidebar.pizzeriasCount', { count: data.length })}
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
