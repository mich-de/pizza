import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { checkAuth } from '../services/authService';

const ZONES = [
  'Massa Lubrense',
  'Sorrento',
  "Sant'Agnello",
  'Piano di Sorrento',
  'Meta',
  'Vico Equense',
];

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-14 h-8 border-2 border-primary flex items-center transition-colors ${value ? 'bg-primary justify-end' : 'bg-surface justify-start'}`}
    >
      <div className="w-6 h-6 bg-on-primary border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] mx-1" />
    </button>
  );
}

function TwoFAModal({ onClose, onEnabled }) {
  const { t } = useI18n();
  const [step, setStep] = useState('setup');
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('settings.saveError'));

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('setup');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('/api/auth/2fa/verify-setup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        const serverErrors = {
          'Codice non valido': t('login.invalidCode'),
          'Nessun setup in corso': t('login.invalidCode'),
          'Codice mancante': t('login.invalidCode'),
        };
        throw new Error(serverErrors[data.error] || data.error || t('login.invalidCode'));
      }

      onEnabled();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-md my-8">
        <div className="bg-primary text-on-primary p-4 border-b-4 border-primary flex justify-between items-center">
          <h3 className="font-headline font-black text-lg uppercase">
            {step === 'setup' ? t('settings.enable2FA') : t('settings.verify2FA')}
          </h3>
          <button onClick={onClose} className="text-on-primary hover:opacity-75">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-error-container border-2 border-error p-3 font-label font-bold uppercase text-sm text-error">
              {error}
            </div>
          )}

          {step === 'setup' && (
            <>
              <p className="font-body text-sm text-on-surface-variant">
                {t('settings.qrDesc')}
              </p>
              <button
                onClick={handleSetup}
                disabled={loading}
                className="w-full bg-primary text-on-primary font-headline font-bold uppercase py-3 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-colors disabled:opacity-50"
              >
                {loading ? t('settings.generating') : t('settings.generateQR')}
              </button>
              {qrCode && (
                <>
                  <div className="flex justify-center">
                    <img src={qrCode} alt="QR Code 2FA" className="border-2 border-primary p-2 bg-white" />
                  </div>
                  <div className="bg-background border-2 border-primary p-3">
                    <label className="block text-xs font-black font-headline uppercase tracking-widest mb-1 text-primary">
                      {t('settings.manualKey')}
                    </label>
                    <code className="font-mono text-sm break-all text-primary">{secret}</code>
                  </div>
                  <button
                    onClick={() => setStep('verify')}
                    className="w-full bg-secondary text-on-error font-headline font-bold uppercase py-3 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    {t('settings.next')}
                  </button>
                </>
              )}
            </>
          )}

          {step === 'verify' && (
            <>
              <p className="font-body text-sm text-on-surface-variant">
                {t('settings.verifyCodeDesc')}
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-background border-2 border-primary p-3 font-body font-bold text-primary text-center text-2xl tracking-widest focus:outline-none focus:border-secondary"
                placeholder={t('settings.verifyCodePlaceholder')}
                autoFocus
              />
              <button
                onClick={handleVerify}
                disabled={loading || verifyCode.length !== 6}
                className="w-full bg-primary text-on-primary font-headline font-bold uppercase py-3 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-colors disabled:opacity-50"
              >
                {loading ? t('settings.verifying') : t('settings.verifyAndEnable')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TwoFADisableModal({ onClose, onDisabled }) {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDisable = async () => {
    setLoading(true);
    setError('');
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('settings.saveError'));

      onDisabled();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface border-4 border-primary shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] w-full max-w-md my-8">
        <div className="bg-error-container text-error p-4 border-b-4 border-error flex justify-between items-center">
          <h3 className="font-headline font-black text-lg uppercase">{t('settings.disable2FA')}</h3>
          <button onClick={onClose} className="text-error hover:opacity-75">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-error-container border-2 border-error p-3 font-label font-bold uppercase text-sm text-error">
              {error}
            </div>
          )}
          <p className="font-body text-sm text-on-surface-variant">
            {t('settings.disable2FADesc')}
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-background border-2 border-primary p-3 font-body font-bold text-primary focus:outline-none focus:border-secondary"
            placeholder={t('settings.passwordPlaceholder')}
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-surface text-primary font-headline font-bold uppercase py-3 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors"
            >
              {t('admin.cancel')}
            </button>
            <button
              onClick={handleDisable}
              disabled={loading || !password}
              className="flex-1 bg-error text-on-error font-headline font-bold uppercase py-3 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:opacity-75 transition-colors disabled:opacity-50"
            >
              {loading ? t('settings.disabling') : t('settings.disable')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Settings({ user }) {
  const { t, lang, setLang } = useI18n();
  const { dark, toggle: toggleDark } = useTheme();

  const [settings, setSettings] = useState({
    displayName: user?.username || 'Admin',
    email: '',
    role: user?.role || 'viewer',
    defaultZone: 'Sorrento',
    currency: 'EUR',
    notifications: true,
    emailAlerts: true,
    lowStockAlerts: true,
    priceChangeAlerts: true,
    compactView: false,
    autoRefresh: true,
    refreshInterval: '30',
  });

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showTwoFAModal, setShowTwoFAModal] = useState(false);
  const [showTwoFADisableModal, setShowTwoFADisableModal] = useState(false);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState(null);

  useEffect(() => {
    if (user) {
      checkAuth().then(data => {
        if (data) {
          setSettings(prev => ({
            ...prev,
            displayName: data.displayName || data.username || prev.displayName,
            email: data.email || '',
            role: data.role || prev.role,
          }));
        }
      });

      fetch('/api/auth/2fa/status', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) setTwoFAEnabled(data.enabled);
        })
        .catch(() => {});
    }
  }, [user]);

  const [prevLang, setPrevLang] = useState(lang);
  const [prevDark, setPrevDark] = useState(dark);
  if (lang !== prevLang || dark !== prevDark) {
    setPrevLang(lang);
    setPrevDark(dark);
    setSettings((prev) => ({
      ...prev,
      language: lang,
      darkMode: dark,
    }));
  }

  const handleChange = (key, value) => {
    if (key === 'language') {
      setLang(value);
      return;
    }
    if (key === 'darkMode') {
      toggleDark();
      return;
    }
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!settings.displayName.trim()) {
      setSaveError(t('settings.displayNameRequired'));
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          displayName: settings.displayName.trim(),
          email: settings.email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('settings.saveError'));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      // Refresh local state
      const meData = await checkAuth();
      if (meData) {
        setSettings(prev => ({
          ...prev,
          displayName: meData.displayName || meData.username,
          email: meData.email || '',
        }));
      }
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (user) {
      checkAuth().then(data => {
        if (data) {
          setSettings({
            displayName: data.displayName || data.username || 'Admin',
            email: data.email || '',
            role: data.role || 'viewer',
            defaultZone: 'Sorrento',
            currency: 'EUR',
            notifications: true,
            emailAlerts: true,
            lowStockAlerts: true,
            priceChangeAlerts: true,
            compactView: false,
            autoRefresh: true,
            refreshInterval: '30',
          });
        }
      });
    }
    setSaved(false);
    setSaveError(null);
  };

  const handleRegenerateKey = async () => {
    setRegenerating(true);
    setNewApiKey(null);
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();
      const res = await fetch('/api/admin/regenerate-key', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('settings.regenerationError'));
      setNewApiKey(data.apiKey);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleValidateJson = async () => {
    setValidating(true);
    setValidationResult(null);
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();
      const res = await fetch('/api/admin/validate-json', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('settings.validationError'));
      setValidationResult(data);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/admin/export-data', { credentials: 'include' });
      if (!res.ok) throw new Error(t('settings.exportError'));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'pizza-data-export.json'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setSaveError(err.message);
    }
  };

  const handlePurgeCache = async () => {
    setPurging(true);
    setPurgeResult(null);
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();
      const res = await fetch('/api/admin/purge-cache', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('settings.purgeError'));
      setPurgeResult({ success: true, message: data.message });
      setTimeout(() => setPurgeResult(null), 3000);
    } catch (err) {
      setPurgeResult({ success: false, message: err.message });
      setTimeout(() => setPurgeResult(null), 3000);
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto">
      <header className="mb-12 border-b-4 border-primary pb-6">
        <h1 className="text-5xl md:text-7xl font-black font-headline tracking-tighter uppercase mb-4 text-primary">
          {t('settings.title')}
        </h1>
        <p className="text-xl font-bold font-body max-w-2xl text-on-surface-variant">
          {t('settings.subtitle')}
        </p>
      </header>

      <section className="mb-8">
        <div className="flex items-center gap-4 border-b-4 border-primary pb-4 mb-6">
          <span className="material-symbols-outlined text-3xl text-primary">person</span>
          <h2 className="text-3xl font-headline font-black uppercase">{t('settings.profile')}</h2>
        </div>
        <div className="bg-surface-bright border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-black font-headline uppercase tracking-widest mb-2 text-primary">
                {t('settings.displayName')}
              </label>
              <input
                type="text"
                className="w-full bg-background border-2 border-primary p-3 font-body font-bold text-primary focus:ring-0 focus:border-secondary"
                value={settings.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-black font-headline uppercase tracking-widest mb-2 text-primary">
                {t('settings.email')}
              </label>
              <input
                type="email"
                className="w-full bg-background border-2 border-primary p-3 font-body font-bold text-primary focus:ring-0 focus:border-secondary"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder={t('settings.emailPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-black font-headline uppercase tracking-widest mb-2 text-primary">
                {t('settings.role')}
              </label>
              <div className="w-full bg-background border-2 border-primary p-3 font-body font-bold text-primary uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-tertiary">shield</span>
                {settings.role === 'admin' ? t('settings.roleAdmin') : settings.role === 'editor' ? t('settings.roleEditor') : t('settings.roleViewer')}
              </div>
            </div>
            <div>
              <label className="block text-sm font-black font-headline uppercase tracking-widest mb-2 text-primary">
                {t('settings.defaultZone')}
              </label>
              <select
                className="w-full bg-background border-2 border-primary p-3 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer"
                value={settings.defaultZone}
                onChange={(e) => handleChange('defaultZone', e.target.value)}
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center gap-4 border-b-4 border-primary pb-4 mb-6">
          <span className="material-symbols-outlined text-3xl text-primary">language</span>
          <h2 className="text-3xl font-headline font-black uppercase">{t('settings.regional')}</h2>
        </div>
        <div className="bg-surface-bright border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-black font-headline uppercase tracking-widest mb-2 text-primary">
                {t('settings.currency')}
              </label>
              <select
                className="w-full bg-background border-2 border-primary p-3 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer"
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
              >
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - US Dollar</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-black font-headline uppercase tracking-widest mb-2 text-primary">
                {t('settings.language')}
              </label>
              <select
                className="w-full bg-background border-2 border-primary p-3 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer"
                value={lang}
                onChange={(e) => handleChange('language', e.target.value)}
              >
                <option value="it">Italiano</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center gap-4 border-b-4 border-primary pb-4 mb-6">
          <span className="material-symbols-outlined text-3xl text-primary">notifications</span>
          <h2 className="text-3xl font-headline font-black uppercase">{t('settings.notifications')}</h2>
        </div>
        <div className="bg-surface-bright border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-headline font-bold uppercase">{t('settings.pushNotifications')}</h4>
                <p className="font-body text-sm text-on-surface-variant">{t('settings.pushNotificationsDesc')}</p>
              </div>
              <Toggle value={settings.notifications} onChange={(v) => handleChange('notifications', v)} />
            </div>
            <div className="border-t-2 border-outline-variant" />
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-headline font-bold uppercase">{t('settings.emailAlerts')}</h4>
                <p className="font-body text-sm text-on-surface-variant">{t('settings.emailAlertsDesc')}</p>
              </div>
              <Toggle value={settings.emailAlerts} onChange={(v) => handleChange('emailAlerts', v)} />
            </div>
            <div className="border-t-2 border-outline-variant" />
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-headline font-bold uppercase">{t('settings.lowStockAlerts')}</h4>
                <p className="font-body text-sm text-on-surface-variant">{t('settings.lowStockAlertsDesc')}</p>
              </div>
              <Toggle value={settings.lowStockAlerts} onChange={(v) => handleChange('lowStockAlerts', v)} />
            </div>
            <div className="border-t-2 border-outline-variant" />
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-headline font-bold uppercase">{t('settings.priceChangeAlerts')}</h4>
                <p className="font-body text-sm text-on-surface-variant">{t('settings.priceChangeAlertsDesc')}</p>
              </div>
              <Toggle value={settings.priceChangeAlerts} onChange={(v) => handleChange('priceChangeAlerts', v)} />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center gap-4 border-b-4 border-primary pb-4 mb-6">
          <span className="material-symbols-outlined text-3xl text-primary">palette</span>
          <h2 className="text-3xl font-headline font-black uppercase">{t('settings.display')}</h2>
        </div>
        <div className="bg-surface-bright border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-headline font-bold uppercase">{t('settings.darkMode')}</h4>
                <p className="font-body text-sm text-on-surface-variant">{t('settings.darkModeDesc')}</p>
              </div>
              <Toggle value={dark} onChange={() => handleChange('darkMode', !dark)} />
            </div>
            <div className="border-t-2 border-outline-variant" />
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-headline font-bold uppercase">{t('settings.compactView')}</h4>
                <p className="font-body text-sm text-on-surface-variant">{t('settings.compactViewDesc')}</p>
              </div>
              <Toggle value={settings.compactView} onChange={(v) => handleChange('compactView', v)} />
            </div>
            <div className="border-t-2 border-outline-variant" />
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-headline font-bold uppercase">{t('settings.autoRefresh')}</h4>
                <p className="font-body text-sm text-on-surface-variant">{t('settings.autoRefreshDesc')}</p>
              </div>
              <Toggle value={settings.autoRefresh} onChange={(v) => handleChange('autoRefresh', v)} />
            </div>
            {settings.autoRefresh && (
              <>
                <div className="border-t-2 border-outline-variant" />
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-headline font-bold uppercase">{t('settings.refreshInterval')}</h4>
                    <p className="font-body text-sm text-on-surface-variant">{t('settings.refreshIntervalDesc')}</p>
                  </div>
                  <select
                    className="bg-background border-2 border-primary p-2 font-body font-bold text-primary focus:ring-0 focus:border-secondary cursor-pointer"
                    value={settings.refreshInterval}
                    onChange={(e) => handleChange('refreshInterval', e.target.value)}
                  >
                    <option value="15">15s</option>
                    <option value="30">30s</option>
                    <option value="60">60s</option>
                    <option value="120">120s</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center gap-4 border-b-4 border-primary pb-4 mb-6">
          <span className="material-symbols-outlined text-3xl text-primary">shield</span>
          <h2 className="text-3xl font-headline font-black uppercase">{t('settings.security')}</h2>
        </div>
        <div className="bg-surface-bright border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-headline font-bold uppercase">{t('settings.twoFactor')}</h4>
                <p className="font-body text-sm text-on-surface-variant">{t('settings.twoFactorDesc')}</p>
              </div>
              {twoFAEnabled ? (
                <button
                  onClick={() => setShowTwoFADisableModal(true)}
                  className="bg-error text-on-error font-label font-bold uppercase px-4 py-2 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:opacity-75 transition-colors"
                >
                  {t('settings.disable')}
                </button>
              ) : (
                <button
                  onClick={() => setShowTwoFAModal(true)}
                  className="bg-primary text-on-primary font-label font-bold uppercase px-4 py-2 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-colors"
                >
                  {t('settings.enable2FA')}
                </button>
              )}
            </div>
            <div className="border-t-2 border-outline-variant" />
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-headline font-bold uppercase">{t('settings.apiAccessKey')}</h4>
                <p className="font-body text-sm text-on-surface-variant">{t('settings.apiAccessKeyDesc')}</p>
              </div>
              <button onClick={handleRegenerateKey} disabled={regenerating}
                className="bg-surface text-primary font-label font-bold uppercase px-4 py-2 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50">
                {regenerating ? '...' : t('settings.regenerate')}
              </button>
              {newApiKey && (
                <div className="mt-2 bg-background border-2 border-primary p-3 flex items-center gap-2">
                  <code className="font-mono text-sm break-all text-primary flex-1">{newApiKey}</code>
                  <button onClick={() => { navigator.clipboard.writeText(newApiKey); setNewApiKey(null); }}
                    className="bg-primary text-on-primary font-label font-bold uppercase px-3 py-1 border-2 border-primary text-xs">{t('settings.copy')}</button>
                </div>
              )}
            </div>
            <div className="border-t-2 border-outline-variant" />
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-headline font-bold uppercase">{t('settings.corsPolicy')}</h4>
                <p className="font-body text-sm text-on-surface-variant">{t('settings.corsPolicyDesc')}</p>
              </div>
              <span className="bg-primary-container text-on-primary-container font-label font-bold uppercase px-3 py-1 border-2 border-primary text-sm">
                {t('settings.active')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {showTwoFAModal && (
        <TwoFAModal
          onClose={() => setShowTwoFAModal(false)}
          onEnabled={() => setTwoFAEnabled(true)}
        />
      )}

      {showTwoFADisableModal && (
        <TwoFADisableModal
          onClose={() => setShowTwoFADisableModal(false)}
          onDisabled={() => setTwoFAEnabled(false)}
        />
      )}

      <section className="mb-8">
        <div className="flex items-center gap-4 border-b-4 border-primary pb-4 mb-6">
          <span className="material-symbols-outlined text-3xl text-primary">database</span>
          <h2 className="text-3xl font-headline font-black uppercase">{t('settings.data')}</h2>
        </div>
        <div className="bg-surface-bright border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-headline font-bold uppercase">{t('settings.validateJson')}</h4>
                <p className="font-body text-sm text-on-surface-variant">{t('settings.validateJsonDesc')}</p>
              </div>
              <button onClick={handleValidateJson} disabled={validating}
                className="bg-primary text-on-primary font-label font-bold uppercase px-4 py-2 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-surface hover:text-primary transition-colors disabled:opacity-50">
                {validating ? '...' : t('settings.validate')}
              </button>
              {validationResult && (
                <div className={`mt-2 p-3 border-2 font-label text-sm ${validationResult.valid ? 'bg-tertiary-container border-tertiary' : 'bg-error-container border-error'}`}>
                  {validationResult.valid ? t('settings.jsonValid') : t('settings.jsonErrors', { count: validationResult.errors.length })}
                  {!validationResult.valid && (
                    <ul className="mt-1 list-disc list-inside">
                      {validationResult.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                      {validationResult.errors.length > 10 && <li>{t('settings.moreErrors', { count: validationResult.errors.length - 10 })}</li>}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="border-t-2 border-outline-variant" />
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-headline font-bold uppercase">{t('settings.exportAllData')}</h4>
                <p className="font-body text-sm text-on-surface-variant">{t('settings.exportAllDataDesc')}</p>
              </div>
              <button onClick={handleExportData}
                className="bg-surface text-primary font-label font-bold uppercase px-4 py-2 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors">
                {t('settings.export')}
              </button>
            </div>
            <div className="border-t-2 border-outline-variant" />
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-headline font-bold uppercase text-secondary">{t('settings.purgeCache')}</h4>
                <p className="font-body text-sm text-on-surface-variant">{t('settings.purgeCacheDesc')}</p>
              </div>
              <button onClick={handlePurgeCache} disabled={purging}
                className="bg-secondary text-on-error font-label font-bold uppercase px-4 py-2 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50">
                {purging ? '...' : t('settings.purge')}
              </button>
              {purgeResult && (
                <div className={`mt-2 p-3 border-2 font-label text-sm ${purgeResult.success ? 'bg-tertiary-container border-tertiary' : 'bg-error-container border-error'}`}>
                  {purgeResult.success ? t('settings.cachePurged') : `❌ ${purgeResult.message}`}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 bg-background border-t-4 border-primary p-4 flex justify-between items-center z-30">
        <button
          onClick={handleReset}
          className="bg-surface text-primary font-headline font-bold uppercase px-6 py-3 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container hover:text-on-error-container transition-colors"
        >
          {t('settings.resetDefaults')}
        </button>
        <div className="flex items-center gap-4">
          {saveError && (
            <span className="font-label font-bold uppercase text-error flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {saveError}
            </span>
          )}
          {saved && (
            <span className="font-label font-bold uppercase text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              {t('settings.saved')}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-on-primary font-headline font-bold uppercase px-8 py-3 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary-container hover:text-on-primary-container transition-colors active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
          >
            {saving ? t('admin.saving') : t('settings.saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );
}
