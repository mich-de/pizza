import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { checkAuth, logout } from '../services/authService';
import { adminTabs } from '../config/navigation';
import { usePendingCounts } from '../hooks/useDataFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import Admin from '../pages/Admin';
import AdminProposals from '../pages/AdminProposals';
import Settings from '../pages/Settings';

const API_BASE = globalThis.process?.env?.VITE_API_BASE || '';

export default function AdminPanel() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pizzerias');
  const [dismissed, setDismissed] = useState(false);
  const { proposals, comments, total: totalPending } = usePendingCounts();

  const [localAuth, setLocalAuth] = useState(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [knownAdmins, setKnownAdmins] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/admins`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setKnownAdmins(data))
      .catch(() => {});
  }, []);

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

  const refreshCounts = useCallback(async () => {
    // Counts will refresh automatically via the hook if we implement a way to trigger it,
    // but for now the hook runs on mount. 
    // Actually AdminProposals calls onDataChange, so we might want the hook to have a refresh function.
  }, []);

  if (checking) return <LoadingSpinner fullScreen />;
  if (!authenticated && !localAuth) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-sm p-8">
          <h1 className="font-headline font-black text-3xl uppercase text-primary mb-6">Admin Login</h1>
          <form onSubmit={async (e) => { e.preventDefault(); try { const r = await fetch(`${API_BASE}/api/admin/verify-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ username: loginUser, password: loginPass }) }); const d = await r.json(); if (d.ok) setLocalAuth(true); else alert(d.error || 'Credenziali errate'); } catch (_) { alert('Errore di connessione'); } }} className="space-y-4">
            <input value={loginUser} onChange={(e) => setLoginUser(e.target.value)} list="admin-users" placeholder="User" className="w-full bg-surface border-4 border-primary py-3 px-4 font-body font-bold uppercase focus:outline-none focus:border-secondary" />
            <datalist id="admin-users">{knownAdmins.map(a => <option key={a.id} value={a.username} />)}</datalist>
            <input value={loginPass} onChange={(e) => setLoginPass(e.target.value)} type="password" placeholder="Password" className="w-full bg-surface border-4 border-primary py-3 px-4 font-body font-bold uppercase focus:outline-none focus:border-secondary" />
            <button type="submit" className="w-full bg-primary text-on-primary font-headline font-bold uppercase py-4 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-all">Entra</button>
          </form>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div>
      {totalPending > 0 && !dismissed && (
        <div className="mx-6 md:mx-12 mt-6 bg-secondary border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] relative">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-primary">close</span>
          </button>
          <div className="p-4 md:p-6 flex items-start gap-4">
            <span className="material-symbols-outlined text-3xl text-primary mt-1">notifications_active</span>
            <div className="flex-1">
              <h3 className="font-headline font-bold uppercase text-primary text-lg">
                {t('admin.pendingActivity')}
              </h3>
              <p className="font-body text-on-surface-variant mt-1">
                {proposals > 0 && (
                  <>
                    <span className="font-bold text-primary">{proposals}</span> {t('admin.pendingProposals')}{comments > 0 ? ` ${t('common.and')} ` : ''}
                  </>
                )}
                {comments > 0 && (
                  <>
                    <span className="font-bold text-primary">{comments}</span> {t('admin.pendingComments')}
                  </>
                )}
                {' '}{t('admin.pendingReview')}
              </p>
            </div>
            <button
              onClick={() => { setActiveTab('proposals'); setDismissed(true); }}
              className="flex items-center gap-2 bg-primary text-on-primary font-label font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-container transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined">arrow_forward</span> {t('admin.go')}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-6 md:p-12 pb-0">
        <div>
          <h1 className="font-headline font-black text-3xl uppercase text-primary flex items-center gap-3">
            <span className="material-symbols-outlined">admin_panel_settings</span>
            {t('admin.panelTitle')}
          </h1>
          <p className="font-body text-on-surface-variant mt-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">person</span>
            {t('admin.loggedInAs')} <span className="font-bold text-primary">{user?.username}</span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-surface text-primary font-label font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error hover:text-on-error hover:border-error transition-colors"
        >
          <span className="material-symbols-outlined">logout</span> {t('admin.logout')}
        </button>
      </div>

      <div className="flex gap-2 mb-8 border-b-4 border-primary px-6 md:px-12">
        {adminTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-6 py-3 font-headline font-bold uppercase transition-all border-2 border-primary ${
              activeTab === tab.key
                ? 'bg-primary text-on-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] -mb-[4px]'
                : 'bg-surface text-on-surface-variant hover:bg-secondary-container -mb-[4px]'
            }`}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            {t(tab.labelKey)}
            {tab.key === 'proposals' && totalPending > 0 && (
              <span className="ml-1 w-6 h-6 rounded-full bg-secondary text-primary text-xs font-bold flex items-center justify-center border-2 border-primary">
                {totalPending}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="px-6 md:px-12 pb-12">
        {activeTab === 'pizzerias' && <Admin />}
        {activeTab === 'proposals' && <AdminProposals onDataChange={refreshCounts} />}
        {activeTab === 'settings' && <Settings user={user} />}
      </div>
    </div>
  );
}
