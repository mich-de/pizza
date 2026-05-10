import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = globalThis.process?.env?.VITE_API_BASE || 'http://localhost:3001';

export default function Login() {
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
        setError(data.error || 'Login fallito');
        return;
      }

      if (data.requires2FA) {
        setTempToken(data.tempToken);
        return;
      }

      navigate('/admin');
      window.location.reload();
    } catch {
      setError('Errore di connessione');
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
        setError(data.error || 'Codice non valido');
        return;
      }

      navigate('/admin');
      window.location.reload();
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  if (tempToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-md">
          <div className="bg-primary text-on-primary p-6 border-b-4 border-primary">
            <h1 className="font-headline font-black text-2xl uppercase flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl">shield</span>
              Verifica 2FA
            </h1>
          </div>

          <form onSubmit={handle2FASubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-error-container border-2 border-error p-3 font-label font-bold uppercase text-sm text-error">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-black font-headline uppercase tracking-widest mb-2 text-primary">
                Codice a 6 cifre
              </label>
              <input
                className="w-full bg-background border-2 border-primary p-3 font-body font-bold text-primary focus:outline-none focus:border-secondary text-center text-2xl tracking-widest"
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
              className="w-full bg-primary text-on-primary font-headline font-bold uppercase py-4 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifica in corso...' : 'Verifica'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-md">
        <div className="bg-primary text-on-primary p-6 border-b-4 border-primary">
          <h1 className="font-headline font-black text-2xl uppercase flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
            Area Riservata
          </h1>
        </div>

        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-error-container border-2 border-error p-3 font-label font-bold uppercase text-sm text-error">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-black font-headline uppercase tracking-widest mb-2 text-primary">
              Username
            </label>
            <input
              className="w-full bg-background border-2 border-primary p-3 font-body font-bold text-primary focus:outline-none focus:border-secondary"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black font-headline uppercase tracking-widest mb-2 text-primary">
              Password
            </label>
            <input
              className="w-full bg-background border-2 border-primary p-3 font-body font-bold text-primary focus:outline-none focus:border-secondary"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-headline font-bold uppercase py-4 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
