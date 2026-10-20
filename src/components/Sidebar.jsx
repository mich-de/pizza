import { NavLink } from 'react-router-dom';
import LangToggle from './ui/LangToggle';
import { useI18n } from '../i18n/I18nContext';
import { navItems } from '../config/navigation';
import { useStitchedData, usePendingCounts } from '../hooks/useDataFetch';
import BrandPlate from './BrandPlate';

/* Le voci sono righe di tabellone: maiuscoletto spaziato, nessuna pastiglia.
   L'attiva si accende in ambra col quadratino, come la riga in partenza. */
const linkBase = 'group flex items-center gap-3 px-5 py-2.5 font-label text-[0.82rem] font-medium uppercase tracking-[0.075em] transition-colors duration-150 border-l-2';
const activeLinkClass = `${linkBase} text-accent border-accent bg-white/[0.05]`;
const inactiveLinkClass = `${linkBase} text-on-ink/60 border-transparent hover:text-on-ink hover:bg-white/[0.05]`;

export default function Sidebar() {
  const { t, money } = useI18n();
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
    <nav className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 w-72 flex-shrink-0 bg-ink text-on-ink border-r border-white/10">
      {/* Il marchio e' una targa, non un bottone: lettere condensate e spaziate,
          come su un cartello di scalo. Il segno ambra della fascia e' il filetto
          qui sotto, e resta l'unico. */}
      <div className="px-5 pt-5 pb-4 relative">
        <BrandPlate />
        {/* Filetto ambra: unico segno di colore della fascia, dice dove finisce
            la targa e comincia il tabellone. */}
        <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-accent to-transparent opacity-55" />
      </div>

      {/* IL FLAP. Il prezzo medio composto come una paletta girata: e' il dato
          che si cerca aprendo l'app, e l'unico flap della schermata. Due flap
          accanto competono e non si legge piu' nessuno dei due. */}
      {globalAvg !== null && (
        <div className="px-5 py-4 border-b border-white/10">
          <span className="block font-label text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-on-ink/45 mb-2">
            {t('sidebar.mediaMargherita')}
          </span>
          {/* Cifre nella paletta, valuta accanto in `.unit`: e' la forma del
              riferimento. L'etichetta sopra dice gia' che media e'. */}
          <div className="flex items-baseline">
            <span className="flap flap-lg">{money(globalAvg)}</span>
            <span className="unit">EUR</span>
          </div>
          {cheapest && (
            <div className="flex items-center gap-1.5 mt-2.5 text-on-ink/55">
              <span className="material-symbols-outlined text-sm">trending_down</span>
              <span className="font-label text-[0.7rem] tracking-wide">
                {t('sidebar.fromPrice', { price: money(cheapest.margheritaPrice) })}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined !text-lg flex-shrink-0"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="flex-1">{t(item.labelKey)}</span>
                {item.to === '/admin' && isAdmin && pendingTotal > 0 && (
                  <span className="badge badge-secondary">{pendingTotal}</span>
                )}
                {/* Il quadratino della riga in partenza. */}
                {isActive && <span className="w-1.5 h-1.5 bg-accent flex-shrink-0" />}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="border-t border-white/10 px-5 py-3.5">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="font-label text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-on-ink/45">
            &copy; {year}
          </span>
          <LangToggle />
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 bg-accent flex-shrink-0" />
            <span className="font-label text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-accent">
              Admin
            </span>
          </div>
        )}
        {data.length > 0 && (
          <div className="flex items-center gap-2 text-on-ink/45">
            <span className="w-1 h-1 rounded-full bg-on-ink/40 flex-shrink-0" />
            <span className="font-label text-[0.68rem] tracking-wide">
              {t('sidebar.pizzeriasCount', { count: data.length })}
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}
