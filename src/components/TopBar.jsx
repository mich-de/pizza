import { useI18n } from '../i18n/I18nContext';
import { navItems } from '../config/navigation';
import { NavLink } from 'react-router-dom';
import { useStitchedData, usePendingCounts } from '../hooks/useDataFetch';
import { useState, useEffect } from 'react';
import { checkAuth } from '../services/authService';
import BrandPlate from './BrandPlate';
import LangToggle from './ui/LangToggle';
import { formatAmount } from '../utils/formatAmount';

const drawerLinkBase = 'flex items-center gap-3 px-5 py-2.5 font-label text-[0.82rem] font-medium uppercase tracking-[0.075em] transition-colors duration-150 border-l-2';
const activeLinkClassMobile = `${drawerLinkBase} text-accent border-accent bg-white/[0.05]`;
const inactiveLinkClassMobile = `${drawerLinkBase} text-on-ink/60 border-transparent hover:text-on-ink hover:bg-white/[0.05]`;

export default function TopBar({ onMenuToggle }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth().then(user => setIsAdmin(user?.role === 'admin')).catch(() => {});
  }, []);

  return (
    /* La fascia d'inchiostro resta scura in ENTRAMBI i temi: e' la cornice del
       tabellone, e una cornice che cambia colore col tema non inquadra piu'
       niente. Il filetto ambra in basso dice dove finisce. */
    <header className="md:hidden relative flex justify-between items-center w-full px-4 py-2 sticky top-0 z-50 bg-ink text-on-ink border-b border-white/10">
      <div className="absolute left-0 right-0 -bottom-px h-px bg-gradient-to-r from-accent to-transparent opacity-55" />
      <div className="flex items-center gap-2.5">
        <button
          onClick={onMenuToggle}
          aria-label="Menu"
          className="w-11 h-11 flex items-center justify-center text-on-ink/70 hover:text-on-ink hover:bg-white/[0.08] transition-colors"
          style={{ borderRadius: '2px' }}
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <BrandPlate size="sm" />
      </div>
      <div className="flex items-center gap-2">
        <LangToggle variant="dense" />
        {isAdmin && (
          <span className="font-label text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-accent border border-accent/40 px-1.5 py-0.5" style={{ borderRadius: '2px' }}>
            Admin
          </span>
        )}
      </div>
    </header>
  );
}

export function MobileDrawer({ open, onClose }) {
  const { t, lang } = useI18n();
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
    /* z-60, non z-50, e non e' un dettaglio: il cassetto e la barra alta
       stavano sullo stesso piano, e in `Layout` il cassetto e' scritto per
       primo — a parita' di z-index vince l'ultimo, quindi la barra copriva i
       primi 61px del cassetto. Sotto ci finivano il marchio e la crocetta di
       chiusura: invisibili, e il tocco sulla crocetta arrivava alla barra, non
       al pulsante. Si chiudeva solo toccando fuori, che pero' e' una cosa che
       bisogna sapere. */
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 md:hidden animate-fade-in" onClick={onClose} />
      <nav className="fixed top-0 left-0 z-[60] h-full w-72 bg-ink text-on-ink border-r border-white/10 md:hidden flex flex-col animate-slide-in-right">
        <div className="px-5 pt-5 pb-4 relative">
          <div className="flex items-start justify-between gap-3">
            <BrandPlate />
            {/* Il cassetto esiste solo sul telefono, quindi questo pulsante si
                tocca sempre col dito: 32px erano un bersaglio da mancare, e
                mancarlo qui vuol dire toccare il marchio o un collegamento
                dietro. Il margine negativo cresce con lui perche' la crocetta
                resti allineata al bordo del pannello. */}
            <button
              onClick={onClose}
              aria-label={t('common.close')}
              className="w-11 h-11 flex items-center justify-center text-on-ink/50 hover:text-on-ink hover:bg-white/[0.08] transition-colors flex-shrink-0 -mr-2.5 -mt-1.5"
              style={{ borderRadius: '2px' }}
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-accent to-transparent opacity-55" />
        </div>

        {globalAvg !== null && (
          <div className="px-5 py-4 border-b border-white/10">
            <span className="block font-label text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-on-ink/45 mb-2">
              {t('sidebar.mediaMargherita')}
            </span>
            <div className="flex items-baseline">
              <span className="flap flap-lg">{formatAmount(globalAvg, lang)}</span>
              <span className="unit">EUR</span>
            </div>
            {cheapest && (
              <div className="flex items-center gap-1.5 mt-2.5 text-on-ink/55">
                <span className="material-symbols-outlined text-sm">trending_down</span>
                <span className="font-label text-[0.7rem] tracking-wide">
                  {t('sidebar.fromPrice', { price: cheapest.margheritaPrice?.toFixed(2) })}
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
              onClick={onClose}
              className={({ isActive }) => (isActive ? activeLinkClassMobile : inactiveLinkClassMobile)}
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
    </>
  );
}
