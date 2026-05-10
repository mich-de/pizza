import { useI18n } from '../i18n/I18nContext';
import { navItems, activeLinkClassMobile, inactiveLinkClassMobile } from '../config/navigation';
import { NavLink } from 'react-router-dom';
import { useStitchedData } from '../hooks/useDataFetch';

export default function TopBar({ onMenuToggle }) {
  const { t } = useI18n();

  return (
    <header className="md:hidden flex justify-between items-center w-full px-6 py-4 sticky top-0 z-50 bg-surface border-b-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
      <div className="flex items-center gap-4">
        <button onClick={onMenuToggle} className="w-10 h-10 border-2 border-primary flex items-center justify-center hover:bg-primary-container transition-colors shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] bg-surface">
          <span className="material-symbols-outlined text-3xl">menu</span>
        </button>
        <h1 className="text-2xl font-black text-primary tracking-tighter uppercase font-headline">
          {t('app.title')}
        </h1>
      </div>
      <div className="flex gap-4">
        <button className="w-10 h-10 border-2 border-primary flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-colors duration-75 active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] bg-surface">
          <span className="material-symbols-outlined">search</span>
        </button>
        <button className="w-10 h-10 border-2 border-primary flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-colors duration-75 active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] bg-surface">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="w-10 h-10 border-2 border-primary flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-colors duration-75 active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] bg-surface">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
}

export function MobileDrawer({ open, onClose }) {
  const { t } = useI18n();
  const { data } = useStitchedData();
  const globalAvg = data.length > 0
    ? data.reduce((s, p) => s + (p.margheritaPrice || 0), 0) / data.length
    : null;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-primary/60 md:hidden" onClick={onClose} />
      <nav className="fixed top-0 left-0 z-50 h-full w-72 bg-surface border-r-4 border-primary shadow-[8px_0px_0px_0px_rgba(26,26,26,1)] md:hidden flex flex-col">
        <div className="p-6 border-b-4 border-primary bg-primary-container flex items-start justify-between">
          <div>
            <div className="w-14 h-14 bg-primary mb-3 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-2xl">local_pizza</span>
            </div>
            <h2 className="font-headline font-black uppercase text-lg tracking-tight text-on-primary-container">
              {t('app.title')}
            </h2>
            <p className="font-label font-bold text-xs tracking-widest text-on-primary-container/80 mt-1">
              {t('app.subtitle')}
            </p>
            {globalAvg !== null && (
              <div className="mt-3 bg-secondary text-on-secondary border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] px-3 py-2 inline-block">
                <div className="text-[10px] font-headline font-black uppercase tracking-widest opacity-80">🍕 Media Margherita</div>
                <div className="text-lg font-headline font-black">€{globalAvg.toFixed(2)}</div>
              </div>
            )}
          </div>
          <button onClick={onClose} className="w-10 h-10 border-2 border-primary flex items-center justify-center hover:bg-secondary transition-colors shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] bg-surface flex-shrink-0 ml-4">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 py-4 overflow-y-auto">
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
              <span className="material-symbols-outlined">{item.icon}</span>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t-4 border-primary bg-surface mt-auto">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span className="font-label text-xs font-bold uppercase tracking-widest">Penisola Sorrentina 2026</span>
          </div>
        </div>
      </nav>
    </>
  );
}
