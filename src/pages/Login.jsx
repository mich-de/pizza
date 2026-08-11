import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';

const API_BASE = globalThis.process?.env?.VITE_API_BASE || '';

export default function Login() {
  const { t, lang } = useI18n();
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

  // Force password change screen
  if (mustChangePassword) {
    return (
      <div className="min-h-screen flex items-start justify-center pt-[12vh] bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-secondary flex items-center justify-center mx-auto mb-4 border-4 border-primary shadow-[5px_5px_0px_0px_rgba(26,26,26,1)]">
              <span className="material-symbols-outlined text-primary text-3xl">lock_reset</span>
            </div>
            <h1 className="font-headline font-black text-3xl md:text-4xl uppercase text-primary tracking-tight">{t('login.changeRequired')}</h1>
            <p className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant mt-2">{t('login.changeRequiredDesc')}</p>
          </div>

          <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
            <div className="bg-secondary p-5">
              <h2 className="font-headline font-black text-base uppercase tracking-wider flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">password</span>
                {t('login.newPasswordTitle')}
              </h2>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              {error && (
                <div className="bg-error-container text-on-error-container border-2 border-error p-3 font-headline font-bold uppercase text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              <div className="bg-primary/5 border-2 border-primary/20 p-3">
                <p className="font-body text-sm text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">info</span>
                  {t('login.changePasswordHint')}
                </p>
              </div>

              <div>
                <label className="block font-headline font-black text-xs uppercase tracking-widest mb-1.5 text-primary">
                  {t('login.newPassword')}
                </label>
                <input
                  className="w-full bg-background border-4 border-primary p-3 font-body font-bold text-primary focus:outline-none focus:border-secondary placeholder:text-on-surface-variant/40 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-headline font-black text-xs uppercase tracking-widest mb-1.5 text-primary">
                  {t('login.confirmPassword')}
                </label>
                <input
                  className="w-full bg-background border-4 border-primary p-3 font-body font-bold text-primary focus:outline-none focus:border-secondary placeholder:text-on-surface-variant/40 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                />
              </div>

              {newPassword && confirmPassword && newPassword === confirmPassword && (
                <div className="flex items-center gap-2 text-tertiary font-label font-bold text-xs uppercase">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {t('login.passwordsMatch')}
                </div>
              )}

              <button
                type="submit"
                disabled={changingPwd || !newPassword || !confirmPassword || newPassword.length < 6}
                className="w-full bg-primary text-on-primary font-headline font-bold uppercase py-3.5 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {changingPwd ? t('login.saving') : t('login.saveAndContinue')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 2FA verification screen
  if (tempToken) {
    return (
      <div className="min-h-screen flex items-start justify-center pt-[15vh] bg-background p-6">
        <div className="w-full max-w-md">
          <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
            <div className="bg-primary text-on-primary p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-on-primary/20 flex items-center justify-center border-2 border-on-primary/40">
                  <span className="material-symbols-outlined text-on-primary text-xl">shield</span>
                </div>
                <div>
                  <h1 className="font-headline font-black text-xl uppercase tracking-tight">{t('login.verify2FA')}</h1>
                  <p className="font-label text-xs text-on-primary/70">{t('login.verify2FADesc')}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handle2FASubmit} className="p-6 space-y-5">
              {error && (
                <div className="bg-error-container text-on-error-container border-2 border-error p-3 font-headline font-bold uppercase text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              <div>
                <label className="block font-headline font-black text-xs uppercase tracking-widest mb-2 text-primary">
                  {t('login.codeLabel')}
                </label>
                <input
                  className="w-full bg-background border-4 border-primary p-3 font-headline font-black text-primary focus:outline-none focus:border-secondary text-center text-3xl tracking-[0.3em] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
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
                className="w-full bg-primary text-on-primary font-headline font-bold uppercase py-3.5 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? t('login.verifying') : t('login.verify')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Normal login screen
  return (
    <div className="min-h-screen flex items-start justify-center pt-[12vh] bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary flex items-center justify-center mx-auto mb-4 border-4 border-primary shadow-[5px_5px_0px_0px_rgba(26,26,26,1)]">
            <img src={lang === 'it' ? '/images/logo_ita_transparent.png' : '/images/logo_eng_transparent.png'} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-headline font-black text-4xl md:text-5xl uppercase text-primary tracking-tight">{t('login.pizzaRadar')}</h1>
          <p className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant mt-1">{t('login.penisola')}</p>
        </div>

        <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
          <div className="bg-primary text-on-primary p-5">
            <h2 className="font-headline font-black text-base uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined">admin_panel_settings</span>
              {t('login.areaRiservata')}
            </h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
            {error && (
              <div className="bg-error-container text-on-error-container border-2 border-error p-3 font-headline font-bold uppercase text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <div>
              <label className="block font-headline font-black text-xs uppercase tracking-widest mb-1.5 text-primary">
                {t('login.username')}
              </label>
              <input
                className="w-full bg-background border-4 border-primary p-3 font-body font-bold text-primary focus:outline-none focus:border-secondary placeholder:text-on-surface-variant/40 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder={t('login.usernamePlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block font-headline font-black text-xs uppercase tracking-widest mb-1.5 text-primary">
                {t('login.password')}
              </label>
              <input
                className="w-full bg-background border-4 border-primary p-3 font-body font-bold text-primary focus:outline-none focus:border-secondary placeholder:text-on-surface-variant/40 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
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
              className="w-full bg-primary text-on-primary font-headline font-bold uppercase py-3.5 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? t('login.loggingIn') : t('login.login')}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 font-headline font-bold text-xs uppercase tracking-wider text-on-surface-variant/50">
          {t('login.footer')}
        </p>
      </div>
    </div>
  );
}
