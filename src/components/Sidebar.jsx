import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { navItems } from '../config/navigation';
import { useStitchedData, usePendingCounts } from '../hooks/useDataFetch';

const activeLinkClass = 'text-primary bg-primary/8 rounded-sm px-3 py-2.5 my-0.5 flex items-center gap-3 font-label font-medium text-sm transition-all relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-primary before:rounded-full';
const inactiveLinkClass = 'text-on-surface-variant/70 hover:text-primary hover:bg-primary/5 rounded-sm px-3 py-2.5 my-0.5 flex items-center gap-3 font-label font-medium text-sm transition-all duration-200';

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
    <nav className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 bg-surface w-64 border-r border-outline-variant flex-shrink-0">
      {/* Brand zone */}
      <div className="relative overflow-hidden">
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(45deg, rgba(200,76,9,0.03) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(200,76,9,0.03) 25%, transparent 25%)
          `,
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="relative px-6 pt-8 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary/15 to-primary/5 rounded-sm flex items-center justify-center overflow-hidden ring-2 ring-primary/20 shadow-md flex-shrink-0">
              <img src={lang === 'it' ? '/images/logo_ita_transparent.png' : '/images/logo_eng_transparent.png'} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl tracking-tight text-primary leading-none">
                {t('app.title')}
              </h2>
              <p className="font-label text-[10px] font-medium text-on-surface-variant/60 tracking-wider mt-1.5">
                {t('app.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Price hero */}
        {globalAvg !== null && (
          <div className="relative mx-5 mb-5 bg-gradient-to-br from-primary via-primary-fixed-dim to-primary rounded-sm overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.04) 12px, rgba(255,255,255,0.04) 13px)`,
            }} />
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/5 rounded-full translate-y-1/3 -translate-x-1/4" />
            <div className="relative px-4 py-3.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse-soft flex-shrink-0" />
                <span className="font-label text-[10px] font-semibold uppercase tracking-widest text-white/70">
                  {t('sidebar.mediaMargherita')}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-bold text-2xl tracking-tight text-white">
                  €{globalAvg.toFixed(2)}
                </span>
                <span className="font-label text-[10px] text-white/50 font-medium">
                  {t('sidebar.generalAvg')}
                </span>
              </div>
              {cheapest && (
                <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-white/50 text-xs">trending_down</span>
                  <span className="font-label text-[10px] text-white/60">{t('sidebar.fromPrice', { price: cheapest.margheritaPrice?.toFixed(2) })}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-b border-outline-variant" />
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 overflow-y-auto px-3 space-y-0.5">
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
                <span className={`material-symbols-outlined !text-lg transition-all duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {item.icon}
                </span>
                <span className="flex-1">{t(item.labelKey)}</span>
                {item.to === '/admin' && isAdmin && pendingTotal > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-error text-on-error text-[10px] font-bold rounded-full border border-surface shadow-sm">
                    {pendingTotal}
                  </span>
                )}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-outline-variant bg-surface">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-on-surface-variant/40">
              <span className="material-symbols-outlined text-[10px]">verified</span>
              <span className="font-label text-[9px] font-semibold uppercase tracking-wider">
                &copy; {year}
              </span>
            </div>
            <div className="flex rounded-sm border border-outline-variant overflow-hidden">
              <button
                onClick={() => setLang('it')}
                className={`px-2 py-0.5 font-label text-[9px] font-semibold uppercase tracking-wider transition-colors ${
                  lang === 'it'
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant/50 hover:text-on-surface-variant hover:bg-surface-variant'
                }`}
              >
                IT
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 font-label text-[9px] font-semibold uppercase tracking-wider transition-colors ${
                  lang === 'en'
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant/50 hover:text-on-surface-variant hover:bg-surface-variant'
                }`}
              >
                EN
              </button>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-primary/10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping flex-shrink-0" />
              <span className="font-label text-[10px] font-semibold uppercase tracking-wider text-primary">
                Admin
              </span>
            </div>
          )}
          {data.length > 0 && (
            <div className="flex items-center gap-2 text-on-surface-variant/40">
              <span className="w-1 h-1 rounded-full bg-tertiary animate-pulse-soft" />
              <span className="font-label text-[10px]">
                {t('sidebar.pizzeriasCount', { count: data.length })}
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
