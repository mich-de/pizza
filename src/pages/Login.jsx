import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { PageHeader } from '../components/ui';

const API_BASE = globalThis.process?.env?.VITE_API_BASE || '';

export default function Login() {
  const { t } = useI18n();
  const [username, setUsername] = useState(import.meta.env.VITE_ADMIN_USERNAME || '');
  const [password, setPassword] = useState(import.meta.env.VITE_ADMIN_PASSWORD || '');
  const [twoFACode, setTwoFACode] = useState('');
  const [tempToken, setTempToken] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
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

      if (data.mustChangePassword) {
        setMustChangePassword(true);
        return;
      }

      localStorage.setItem('pizza_session_hint', 'true');
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError(t('login.newPasswordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('login.passwordsMismatch'));
      return;
    }
    if (newPassword === password) {
      setError(t('login.passwordSameAsOld'));
      return;
    }

    setChangingPwd(true);

    try {
      const csrfRes = await fetch(`${API_BASE}/api/csrf-token`, { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: password, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('login.passwordChangeError'));
        return;
      }

      localStorage.setItem('pizza_session_hint', 'true');
      navigate('/admin');
      window.location.reload();
    } catch {
      setError(t('login.connectionError'));
    } finally {
      setChangingPwd(false);
    }
  };

  /* Tutta la pagina serve a comporre una richiesta: su carta non resterebbe
     niente da leggere, quindi l'intero involucro e' `no-print`. */
  const shell = 'min-h-screen flex items-start justify-center pt-[12vh] p-6 no-print';

  // Force password change screen
  if (mustChangePassword) {
    return (
      <div className={shell}>
        <div className="w-full max-w-sm">
          <PageHeader
            compact
            eyebrow={t('common.restrictedArea')}
            title={t('login.changeRequired')}
            subtitle={t('login.changeRequiredDesc')}
          />

          {/* Unica superficie a schermo, quindi l'unica barra ambra. */}
          <form onSubmit={handleChangePassword} className="card card-accent">
            <div className="section-title">
              <h2 className="text-base">{t('login.newPasswordTitle')}</h2>
            </div>

            {error && (
              <div className="alert alert-error mb-4">
                <span className="material-symbols-outlined text-base leading-none">error</span>
                <span>{error}</span>
              </div>
            )}

            <p className="note">{t('login.changePasswordHint')}</p>

            <label className="field mt-4">
              <span>{t('login.newPassword')}</span>
              <input
                className="w-full font-mono"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                required
                autoFocus
              />
            </label>

            <label className="field">
              <span>{t('login.confirmPassword')}</span>
              <input
                className="w-full font-mono"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                required
              />
            </label>

            {newPassword && confirmPassword && newPassword === confirmPassword && (
              <p className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {t('login.passwordsMatch')}
              </p>
            )}

            <button
              type="submit"
              disabled={changingPwd || !newPassword || !confirmPassword || newPassword.length < 6}
              className="btn btn-primary btn-block btn-lg"
            >
              {changingPwd ? t('login.saving') : t('login.saveAndContinue')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2FA verification screen
  if (tempToken) {
    return (
      <div className={shell}>
        <div className="w-full max-w-sm">
          <PageHeader
            compact
            eyebrow={t('common.restrictedArea')}
            title={t('login.verify2FA')}
            subtitle={t('login.verify2FADesc')}
          />

          <form onSubmit={handle2FASubmit} className="card card-accent">
            {error && (
              <div className="alert alert-error mb-4">
                <span className="material-symbols-outlined text-base leading-none">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Sei cifre in monospaziato spaziato: e' il campo di un tabellone,
                non un flap — il flap mostra un dato, non lo raccoglie. */}
            <label className="field">
              <span>{t('login.codeLabel')}</span>
              <input
                className="w-full text-center font-mono tabular-nums text-3xl tracking-[0.3em]"
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
            </label>

            <button
              type="submit"
              disabled={loading || twoFACode.length !== 6}
              className="btn btn-primary btn-block btn-lg"
            >
              <span className="material-symbols-outlined text-base">shield</span>
              {loading ? t('login.verifying') : t('login.verify')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Normal login screen
  return (
    <div className={shell}>
      <div className="w-full max-w-sm">
        {/* Anche qui il marchio in filigrana esce: la testatina e' la stessa
            delle altre due schermate d'ingresso e di tutte le pagine. */}
        <PageHeader
          compact
          eyebrow={t('common.restrictedArea')}
          title={t('login.pizzaRadar')}
          subtitle={t('login.loginDesc')}
        />

        <form onSubmit={handlePasswordSubmit} className="card card-accent">
          <div className="section-title">
            <h2 className="text-base">{t('login.login')}</h2>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <span className="material-symbols-outlined text-base leading-none">error</span>
              <span>{error}</span>
            </div>
          )}

          <label className="field">
            <span>{t('login.username')}</span>
            <input
              className="w-full"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder={t('login.usernamePlaceholder')}
              required
            />
          </label>

          <label className="field">
            <span>{t('login.password')}</span>
            <input
              className="w-full font-mono"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder={t('login.passwordPlaceholder')}
              required
            />
          </label>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg">
            <span className="material-symbols-outlined text-base">login</span>
            {loading ? t('login.loggingIn') : t('login.login')}
          </button>
        </form>

        <p className="text-center mt-6 font-label text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant">
          {t('login.footer')}
        </p>
      </div>
    </div>
  );
}
