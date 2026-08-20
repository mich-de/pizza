import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { checkAuth, logout } from '../services/authService';
import { adminTabs } from '../config/navigation';
import { usePendingCounts } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import Admin from '../pages/Admin';
import AdminProposals from '../pages/AdminProposals';
import AdminEvents from '../pages/AdminEvents';
import Settings from '../pages/Settings';
import { PageHeader } from '../components/ui';

export default function AdminPanel() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pizzerias');
  const [dismissed, setDismissed] = useState(false);
  const { proposals, comments, total: totalPending, refresh: refreshCounts } = usePendingCounts();

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      try {
        const u = await checkAuth();
        if (!cancelled) {
          if (u && u.role === 'admin') {
            setAuthenticated(true);
            setUser(u);
          }
        }
      } catch (e) { console.error(e); } finally {
        if (!cancelled) setChecking(false);
      }
    }
    verify();
    return () => { cancelled = true; };
  }, []);

  if (checking) return <LoadingSpinner fullScreen />;
  if (!authenticated) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container fade-in">
      {totalPending > 0 && !dismissed && (
        /* Forma «icona + testo» dell'avviso: due <span>, il flex si accende da
           solo. L'ambra qui segnala e basta, non e' un fondo esteso. */
        <div className="alert alert-warning mt-8">
          <span className="material-symbols-outlined text-base leading-none">notifications_active</span>
          <span className="flex-1">
            <strong>{t('admin.pendingActivity')}</strong>{' '}
            {proposals > 0 && (
              <>
                <span className="font-mono tabular-nums">{proposals}</span> {t('admin.pendingProposals')}{comments > 0 ? ` ${t('common.and')} ` : ''}
              </>
            )}
            {comments > 0 && (
              <>
                <span className="font-mono tabular-nums">{comments}</span> {t('admin.pendingComments')}
              </>
            )}
            {' '}{t('admin.pendingReview')}
            <span className="flex gap-2 mt-2.5 no-print">
              <button
                onClick={() => { setActiveTab('proposals'); setDismissed(true); }}
                className="btn btn-primary btn-sm"
              >
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                {t('admin.go')}
              </button>
              <button onClick={() => setDismissed(true)} className="btn btn-ghost btn-sm">
                {t('common.close')}
              </button>
            </span>
          </span>
        </div>
      )}

      <PageHeader
        eyebrow={t('common.restrictedArea')}
        title={t('admin.panelTitle')}
        subtitle={t('admin.panelSubtitle')}
      >
        {/* Chi sei sta accanto al pulsante per smettere di esserlo, non
            nell'occhiello: li' ci va la sezione, uguale su tutte le pagine
            riservate. Su carta non serve nessuno dei due. */}
        <span className="font-label text-[0.7rem] uppercase tracking-[0.08em] text-on-surface-variant hidden sm:inline">
          {t('admin.loggedInAs')} <strong className="text-on-surface">{user?.username}</strong>
        </span>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm">
          <span className="material-symbols-outlined text-sm">logout</span>
          {t('admin.logout')}
        </button>
      </PageHeader>

      {/* Stesse linguette di Esplora: filetto sotto, tratto ambra da 3px sulla
          voce attiva. Scegliere una scheda e' comporre la richiesta. */}
      {/* `overflow-x-auto`: con quattro linguette, su uno schermo da 390 la
          quarta finiva fuori dalla finestra e non c'era modo di raggiungerla.
          Scorrono, e `shrink-0` impedisce che si stringano fino a spezzare le
          parole invece di scorrere. */}
      <div className="flex mb-8 border-b border-outline-variant no-print overflow-x-auto">
        {adminTabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative shrink-0 flex items-center gap-2 px-4 py-2.5 font-display uppercase tracking-[0.06em] text-sm transition-colors ${
                isActive ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {t(tab.labelKey)}
              {tab.key === 'proposals' && totalPending > 0 && (
                <span className="badge badge-ghost font-mono tabular-nums">{totalPending}</span>
              )}
              {isActive && <span className="absolute left-0 right-0 -bottom-px h-[3px] bg-accent" />}
            </button>
          );
        })}
      </div>

      <div className="pb-12">
        {activeTab === 'pizzerias' && <Admin />}
        {activeTab === 'proposals' && <AdminProposals onDataChange={refreshCounts} />}
        {activeTab === 'events' && <AdminEvents onDataChange={refreshCounts} />}
        {activeTab === 'settings' && <Settings user={user} />}
      </div>
    </div>
  );
}
