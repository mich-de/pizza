import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { navItems, activeLinkClass, inactiveLinkClass } from '../config/navigation';
import { useStitchedData } from '../hooks/useDataFetch';

export default function Sidebar() {
  const { t } = useI18n();
  const { data } = useStitchedData();

  const globalAvg = data.length > 0
    ? data.reduce((s, p) => s + (p.margheritaPrice || 0), 0) / data.length
    : null;

  return (
    <nav className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 bg-surface w-64 border-r-4 border-primary flex-shrink-0">
      <div className="p-6 border-b-4 border-primary bg-primary-container">
        <div className="w-16 h-16 bg-primary mb-4 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-3xl">local_pizza</span>
        </div>
        <h2 className="font-headline font-black uppercase text-xl tracking-tight text-on-primary-container">
          {t('app.title')}
        </h2>
        <p className="font-label font-bold text-sm tracking-widest text-on-primary-container/80 mt-1">
          {t('app.subtitle')}
        </p>

        {globalAvg !== null && (
          <div className="mt-4 bg-secondary text-on-secondary border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] px-3 py-2">
            <div className="text-[10px] font-headline font-black uppercase tracking-widest opacity-80">
              🍕 Media Margherita
            </div>
            <div className="text-xl font-headline font-black tracking-tighter">
              €{globalAvg.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              isActive ? activeLinkClass : inactiveLinkClass
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
          <span className="font-label text-xs font-bold uppercase tracking-widest">
            Penisola Sorrentina 2026
          </span>
        </div>
        {data.length > 0 && (
          <div className="mt-1 font-label text-xs text-on-surface-variant">
            {data.length} pizzerie monitorate
          </div>
        )}
      </div>
    </nav>
  );
}
