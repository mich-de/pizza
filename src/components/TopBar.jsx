import { useI18n } from '../i18n/I18nContext';
import { navItems } from '../config/navigation';
import { NavLink } from 'react-router-dom';
import { useStitchedData, usePendingCounts } from '../hooks/useDataFetch';
import { useState, useEffect } from 'react';
import { checkAuth } from '../services/authService';

const activeLinkClassMobile = 'text-primary bg-primary/10 rounded-sm px-4 py-3 mx-2 my-0.5 flex items-center gap-3 font-label font-medium text-sm border-l-2 border-primary';
const inactiveLinkClassMobile = 'text-on-surface-variant/70 px-4 py-3 mx-2 my-0.5 flex items-center gap-3 font-label font-medium text-sm hover:text-primary hover:bg-primary/5 transition-colors duration-200';

function LangToggle({ dense }) {
  const { lang, setLang } = useI18n();
  const toggle = () => setLang(lang === 'it' ? 'en' : 'it');

  if (dense) {
    return (
      <button
        onClick={toggle}
        className="font-label text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors"
      >
        {lang === 'it' ? 'EN' : 'IT'}
      </button>
    );
  }

  return (
    <div className="flex rounded-sm border border-outline-variant overflow-hidden">
      <button
        onClick={() => setLang('it')}
        className={`px-2.5 py-1 font-label text-[11px] font-semibold uppercase tracking-wider transition-colors ${
          lang === 'it'
            ? 'bg-primary text-on-primary'
            : 'text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-surface-variant'
        }`}
      >
        IT
      </button>
      <button
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 font-label text-[11px] font-semibold uppercase tracking-wider transition-colors ${
          lang === 'en'
            ? 'bg-primary text-on-primary'
            : 'text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-surface-variant'
        }`}
      >
        EN
      </button>
    </div>
  );
}

export default function TopBar({ onMenuToggle }) {
  const { t, lang } = useI18n();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth().then(user => setIsAdmin(user?.role === 'admin')).catch(() => {});
  }, []);

  return (
    <header className="md:hidden relative flex justify-between items-center w-full px-4 py-2.5 sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-outline-variant">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="w-9 h-9 flex items-center justify-center hover:bg-surface-variant rounded-sm transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary/15 to-primary/5 rounded-sm flex items-center justify-center overflow-hidden ring-1 ring-primary/20 flex-shrink-0">
            <img src={lang === 'it' ? '/images/logo_ita_transparent.png' : '/images/logo_eng_transparent.png'} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-base font-display font-bold text-primary tracking-tight leading-none">
              {t('app.title')}
            </h1>
            <p className="font-label text-[9px] text-on-surface-variant/50 tracking-wider mt-0.5">
              {t('app.subtitle')}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <LangToggle />
        <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-variant rounded-sm transition-colors text-on-surface-variant/40">
          <span className="material-symbols-outlined text-lg">notifications</span>
        </button>
        {isAdmin ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 border border-primary/20 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            <span className="font-label text-[9px] font-semibold uppercase tracking-wider text-primary">Admin</span>
          </div>
        ) : (
          <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-variant rounded-sm transition-colors text-on-surface-variant/40">
            <span className="material-symbols-outlined text-lg">account_circle</span>
          </button>
        )}
      </div>
    </header>
  );
}

export function MobileDrawer({ open, onClose }) {
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

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 md:hidden animate-fade-in" onClick={onClose} />
      <nav className="fixed top-0 left-0 z-50 h-full w-72 bg-surface border-r border-outline-variant md:hidden flex flex-col animate-slide-in-right">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `
              linear-gradient(45deg, rgba(200,76,9,0.03) 25%, transparent 25%),
              linear-gradient(-45deg, rgba(200,76,9,0.03) 25%, transparent 25%)
            `,
            backgroundSize: '32px 32px',
          }} />
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="relative px-5 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/15 to-primary/5 rounded-sm flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-primary/20 shadow-md">
                  <img src={lang === 'it' ? '/images/logo_ita_transparent.png' : '/images/logo_eng_transparent.png'} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg tracking-tight text-primary leading-none">
                    {t('app.title')}
                  </h2>
                  <p className="font-label text-[10px] font-medium text-on-surface-variant/60 tracking-wider mt-1.5">
                    {t('app.subtitle')}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-surface-variant rounded-sm transition-colors text-on-surface-variant/40 flex-shrink-0 -mr-1 -mt-1">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          {globalAvg !== null && (
            <div className="relative mx-4 mb-4 bg-gradient-to-br from-primary via-primary-fixed-dim to-primary rounded-sm overflow-hidden">
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.04) 12px, rgba(255,255,255,0.04) 13px)`,
              }} />
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-14 h-14 bg-black/5 rounded-full translate-y-1/3 -translate-x-1/4" />
              <div className="relative px-4 py-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse-soft flex-shrink-0" />
                  <span className="font-label text-[10px] font-semibold uppercase tracking-widest text-white/70">
                  {t('sidebar.mediaMargherita')}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-bold text-xl tracking-tight text-white">
                  €{globalAvg.toFixed(2)}
                </span>
                <span className="font-label text-[9px] text-white/50 font-medium">
                  {t('sidebar.generalAvg')}
                </span>
                </div>
                {cheapest && (
                  <div className="mt-1 pt-1 border-t border-white/10 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-white/50 text-[10px]">trending_down</span>
                    <span className="font-label text-[9px] text-white/60">{t('sidebar.fromPrice', { price: cheapest.margheritaPrice?.toFixed(2) })}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-b border-outline-variant" />
        </div>

        <div className="flex-1 py-4 overflow-y-auto px-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? activeLinkClassMobile : inactiveLinkClassMobile
              }
            >
              {({ isActive }) => (
                <>
                  <span className="material-symbols-outlined !text-lg" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                  <span className="flex-1">{t(item.labelKey)}</span>
                  {item.to === '/admin' && isAdmin && pendingTotal > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-error text-on-error text-[10px] font-bold rounded-full border border-surface shadow-sm mr-2">
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

        <div className="border-t border-outline-variant bg-surface">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-on-surface-variant/40">
                <span className="material-symbols-outlined text-[10px]">verified</span>
                <span className="font-label text-[9px] font-semibold uppercase tracking-wider">&copy; {year}</span>
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
                <span className="font-label text-[10px]">{t('sidebar.pizzeriasCount', { count: data.length })}</span>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
