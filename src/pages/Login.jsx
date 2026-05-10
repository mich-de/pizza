import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';

const API_BASE = globalThis.process?.env?.VITE_API_BASE || '';

export default function Login() {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [tempToken, setTempToken] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const csrfRes = await fetch(`${API_BASE}/api/csrf-token`, { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('login.loginFailed'));
        return;
      }

      if (data.requires2FA) {
        setTempToken(data.tempToken);
        return;
      }

      navigate('/admin');
      window.location.reload();
    } catch {
      setError(t('login.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const csrfRes = await fetch(`${API_BASE}/api/csrf-token`, { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch(`${API_BASE}/api/auth/2fa/verify-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ tempToken, code: twoFACode }),
      });

      const data = await res.json();
      if (!res.ok) {
        const serverErrors = {
          'Codice non valido': t('login.invalidCode'),
          'Sessione scaduta': t('login.sessionExpired'),
          '2FA non configurata': t('login.invalidCode'),
        };
        setError(serverErrors[data.error] || data.error || t('login.invalidCode'));
        return;
      }

      navigate('/admin');
      window.location.reload();
    } catch {
      setError(t('login.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  if (tempToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="bg-surface border border-outline-variant rounded-sm w-full max-w-md animate-scale-in">
          <div className="p-6 border-b border-outline-variant">
            <div className="w-12 h-12 bg-primary rounded-sm flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-on-primary text-2xl">shield</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-primary">{t('login.verify2FA')}</h1>
            <p className="text-sm font-body text-on-surface-variant mt-1">{t('login.verify2FADesc')}</p>
          </div>

          <form onSubmit={handle2FASubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-error/5 border border-error/30 rounded-sm p-3 font-label text-sm text-error font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-label font-semibold tracking-wider mb-2 text-on-surface-variant">
                {t('login.codeLabel')}
              </label>
              <input
                className="w-full bg-background border border-outline-variant rounded-sm p-3 font-body font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-center text-2xl tracking-[0.3em]"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                autoComplete="one-time-code"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || twoFACode.length !== 6}
              className="w-full bg-primary text-on-primary font-label font-semibold tracking-wider py-3 rounded-sm hover:bg-primary-fixed-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? t('login.verifying') : t('login.verify')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 animate-slide-down">
          <div className="w-14 h-14 bg-primary/10 rounded-sm flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-lg">
            <img src="/images/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-display font-bold text-primary tracking-tight">{t('login.pizzaRadar')}</h1>
          <p className="text-sm font-body text-on-surface-variant mt-1">{t('login.penisola')}</p>
        </div>

        <div className="bg-surface border border-outline-variant rounded-sm animate-scale-in">
          <div className="p-5 border-b border-outline-variant">
            <h2 className="font-label font-semibold text-sm tracking-wider text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
              {t('login.areaRiservata')}
            </h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
            {error && (
              <div className="bg-error/5 border border-error/30 rounded-sm p-3 font-label text-sm text-error font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-label font-semibold tracking-wider mb-1.5 text-on-surface-variant">
                {t('login.username')}
              </label>
              <input
                className="w-full bg-background border border-outline-variant rounded-sm p-2.5 font-body text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-on-surface-variant/40"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder={t('login.usernamePlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-label font-semibold tracking-wider mb-1.5 text-on-surface-variant">
                {t('login.password')}
              </label>
              <input
                className="w-full bg-background border border-outline-variant rounded-sm p-2.5 font-body text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-on-surface-variant/40"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder={t('login.passwordPlaceholder')}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-label font-semibold tracking-wider py-2.5 rounded-sm hover:bg-primary-fixed-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? t('login.loggingIn') : t('login.login')}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 font-label text-xs text-on-surface-variant/50">
          {t('login.footer')}
        </p>
      </div>
    </div>
  );
}
