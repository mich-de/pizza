import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { checkAuth } from '../services/authService';
import Picker from '../components/ui/Picker';
import { useDateTime } from '../prefs/DateTimeContext';
import { listZones, deviceZone, zoneOffset, DEVICE_ZONE, DATE_FORMATS, digitDate } from '../prefs/dateTime';

const ZONES = [
  'Massa Lubrense',
  'Sorrento',
  "Sant'Agnello",
  'Piano di Sorrento',
  'Meta',
  'Vico Equense',
];

/* Interruttore squadrato: acceso e' una paletta girata (fondo d'inchiostro) con
   la linguetta ambra — l'ambra segnala lo stato, non colora il fondo. */
function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className={`w-14 h-7 border shrink-0 flex items-center transition-colors ${value ? 'bg-ink border-ink justify-end' : 'bg-surface border-outline justify-start'}`}
    >
      <span className={`w-5 h-5 mx-[3px] ${value ? 'bg-accent' : 'bg-outline'}`} />
    </button>
  );
}

/* Testatina di sezione: icona piu' etichetta. Compariva identica sei volte. */
function SectionHead({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="material-symbols-outlined text-base text-on-surface-variant">{icon}</span>
      <h2 className="font-display uppercase tracking-[0.06em] text-lg mb-0">{title}</h2>
    </div>
  );
}

/* Riga di preferenza: titolo, spiegazione, comando a destra. Quindici occorrenze
   con lo stesso impianto — il filetto fra le righe lo mette la riga stessa. */
function SettingRow({ title, desc, children, footer }) {
  return (
    <div className="py-4 border-t border-outline-variant first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="min-w-0">
          <h4 className="font-display uppercase tracking-[0.04em] text-sm mb-0.5">{title}</h4>
          {desc && <p className="font-body text-sm text-on-surface-variant mb-0">{desc}</p>}
        </div>
        {children}
      </div>
      {footer}
    </div>
  );
}

/* Fuso orario e forma delle date.
   Il campione in cima non e' un ornamento: e' l'unico modo di scegliere un
   formato senza doverselo immaginare. `2026-08-20` e `20/08/2026` sono due
   righe di elenco che si somigliano; la stessa data scritta davanti agli
   occhi, no. Si aggiorna a ogni tocco perche' e' il risultato della scelta,
   non un'anteprima da chiedere.

   Niente pulsante «salva»: e' una preferenza di lettura e vale subito, come il
   tema e la lingua. */
function DateTimeSettings() {
  const { t, lang } = useI18n();
  const dt = useDateTime();
  const now = new Date();

  /* L'elenco si costruisce una volta: 418 fusi per cui calcolare lo scarto da
     Greenwich sono 418 formattazioni, e rifarle a ogni battuta nel campo di
     ricerca si sente. */
  const zones = useMemo(() => {
    const device = deviceZone();
    return [
      { value: DEVICE_ZONE, label: t('settings.zoneDevice'), meta: device },
      ...listZones().map(z => ({ value: z, label: z.replace(/_/g, ' '), meta: zoneOffset(z, now) })),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const dateChoices = ['auto', 'dmy', 'mdy', 'iso', 'medium', 'long'];
  const timeChoices = ['auto', 'h24', 'h12'];

  /* Un istante vero e un giorno di calendario: il secondo non si sposta col
     fuso, e vederli accanto lo spiega meglio di una nota scritta. */
  const sampleInstant = now.toISOString();
  const samplePlainDay = '2026-09-23';

  return (
    <section>
      <SectionHead icon="schedule" title={t('settings.dateTime')} />
      <div className="card">
        <div className="panel mb-6">
          <span className="eyebrow">{t('settings.dateTimeSample')}</span>
          <p className="font-mono text-base mb-1">{dt.formatDateTime(sampleInstant)}</p>
          <p className="font-body text-sm text-on-surface-variant mb-0">
            {t('settings.dateTimeZoneNow', { zone: dt.effectiveZone })} · {t('settings.dateTimeEventSample')}: {dt.formatDateRange(samplePlainDay, '2026-09-25')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
          <label className="field mb-0">
            <span>{t('settings.dateFormat')}</span>
            <select className="w-full" value={dt.dateFormat}
              onChange={(e) => dt.set({ dateFormat: e.target.value })}>
              {dateChoices.map(k => (
                <option key={k} value={k}>
                  {t(`settings.dateFormat_${k}`)} — {sampleWith(dt, k, sampleInstant)}
                </option>
              ))}
            </select>
          </label>

          <label className="field mb-0">
            <span>{t('settings.timeFormat')}</span>
            <select className="w-full" value={dt.timeFormat}
              onChange={(e) => dt.set({ timeFormat: e.target.value })}>
              {timeChoices.map(k => (
                <option key={k} value={k}>{t(`settings.timeFormat_${k}`)}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="field mt-5 mb-0">
          <span>{t('settings.timeZone')}</span>
          <Picker
            items={zones}
            value={dt.zone}
            onChange={(z) => dt.set({ zone: z })}
            searchLabel={t('settings.timeZoneSearch')}
            placeholder={t('settings.timeZoneSearch')}
            emptyLabel={t('settings.timeZoneEmpty')}
            note={t('settings.timeZoneNote')}
          />
        </div>

        <div className="mt-5">
          <button type="button" onClick={dt.reset} className="btn btn-ghost btn-sm">
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            {t('settings.dateTimeReset')}
          </button>
        </div>
      </div>
    </section>
  );
}

/* Il campione accanto a ogni voce della tendina. Passa dal contesto perche' il
   fuso e la lingua li conosce solo lui, e va calcolato col formato della voce,
   non con quello in uso — altrimenti tutte le voci scriverebbero uguale. */
function sampleWith(dt, key, instant) {
  const d = new Date(instant);
  const opts = DATE_FORMATS[key];
  /* Le stesse due strade di `formatDate`, e non per caso: se il campione lo
     calcolasse a modo suo, la tendina prometterebbe una cosa e la pagina ne
     scriverebbe un'altra. */
  if (opts === 'digits') return digitDate(d, dt.effectiveZone, key);
  return d.toLocaleDateString(dt.locale, { ...(opts || { dateStyle: 'medium' }), timeZone: dt.effectiveZone });
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
    <div className="fixed inset-0 bg-black/55 flex items-start justify-center z-[200] p-4 overflow-y-auto pt-[15vh] no-print">
      <div className="card card-accent w-full max-w-md">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <span className="eyebrow">{t('settings.security')}</span>
            <h2 className="mt-1 mb-0">
              {step === 'setup' ? t('settings.enable2FA') : t('settings.verify2FA')}
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon shrink-0" aria-label={t('common.close')}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span className="material-symbols-outlined text-base leading-none">error</span>
            <span>{error}</span>
          </div>
        )}

        {step === 'setup' && (
          <>
            <p className="font-body text-sm text-on-surface-variant">{t('settings.qrDesc')}</p>
            <button onClick={handleSetup} disabled={loading} className="btn btn-primary btn-block">
              {loading ? t('settings.generating') : t('settings.generateQR')}
            </button>
            {qrCode && (
              <>
                <div className="flex justify-center my-5">
                  <img src={qrCode} alt="QR Code 2FA" className="border border-outline-variant p-2 bg-white" />
                </div>
                {/* La chiave e' lunga: resta codice in un pannello, non un flap —
                    il flap regge tre parole, non trentadue caratteri. */}
                <div className="panel mb-5">
                  <div className="section-title">{t('settings.manualKey')}</div>
                  <code className="font-mono text-sm break-all">{secret}</code>
                </div>
                <button onClick={() => setStep('verify')} className="btn btn-primary btn-block">
                  {t('settings.next')}
                </button>
              </>
            )}
          </>
        )}

        {step === 'verify' && (
          <>
            <p className="font-body text-sm text-on-surface-variant">{t('settings.verifyCodeDesc')}</p>
            <label className="field">
              <span>{t('settings.verify2FA')}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center font-mono tabular-nums text-2xl tracking-[0.3em]"
                placeholder={t('settings.verifyCodePlaceholder')}
                autoFocus
              />
            </label>
            <button onClick={handleVerify} disabled={loading || verifyCode.length !== 6} className="btn btn-primary btn-block">
              {loading ? t('settings.verifying') : t('settings.verifyAndEnable')}
            </button>
          </>
        )}
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
    <div className="fixed inset-0 bg-black/55 flex items-start justify-center z-[200] p-4 overflow-y-auto pt-[15vh] no-print">
      <div className="card card-accent w-full max-w-md">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <span className="eyebrow">{t('settings.security')}</span>
            <h2 className="mt-1 mb-0">{t('settings.disable2FA')}</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon shrink-0" aria-label={t('common.close')}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span className="material-symbols-outlined text-base leading-none">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* L'ambra avverte di cosa si sta togliendo; il rosso sta solo
            sul pulsante che lo toglie davvero. */}
        <div className="alert alert-warning mb-4">
          <span className="material-symbols-outlined text-base leading-none">warning</span>
          <span>{t('settings.disable2FADesc')}</span>
        </div>

        <label className="field">
          <span>{t('settings.currentPassword')}</span>
          <input
            type="password"
            className="w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('settings.currentPasswordPlaceholder')}
            autoFocus
          />
        </label>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn btn-ghost">{t('admin.cancel')}</button>
          <button onClick={handleDisable} disabled={loading || !password} className="btn btn-secondary">
            {loading ? t('settings.disabling') : t('settings.disable')}
          </button>
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
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdChanged, setPwdChanged] = useState(false);
  const [pwdError, setPwdError] = useState(null);

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

  const handleChangePassword = async () => {
    setChangingPwd(true);
    setPwdError(null);
    setPwdChanged(false);
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('settings.passwordError'));

      setPwdChanged(true);
      setCurrentPwd('');
      setNewPwd('');
      setTimeout(() => setPwdChanged(false), 3000);
    } catch (err) {
      setPwdError(err.message);
      setTimeout(() => setPwdError(null), 3000);
    } finally {
      setChangingPwd(false);
    }
  };

  /* Lo svuotamento della cache si fa qui, non sul server: sul server non c'e'
     nessuna cache da svuotare — gli archivi si rileggono da disco a ogni
     richiesta. Quello che invece si accumula e' la copia che tiene il browser
     delle risposte `/api/data/*`, ed e' quella che fa vedere un prezzo vecchio
     dopo averlo corretto. `cache: 'reload'` la scavalca e la riscrive.

     Prima qui c'era una chiamata a `/api/admin/purge-cache`, che sul server
     non e' mai esistita. */
  const handlePurgeCache = async () => {
    setPurging(true);
    setPurgeResult(null);
    try {
      if (typeof caches !== 'undefined') {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
      const endpoints = ['towns', 'venues', 'prices', 'events', 'stitched'];
      await Promise.all(endpoints.map(e =>
        fetch(`/api/data/${e}`, { cache: 'reload', credentials: 'include' })
      ));
      setPurgeResult({ success: true, message: t('settings.cachePurged') });
      setTimeout(() => setPurgeResult(null), 3000);
    } catch (err) {
      setPurgeResult({ success: false, message: err.message || t('settings.purgeError') });
      setTimeout(() => setPurgeResult(null), 3000);
    } finally {
      setPurging(false);
    }
  };

  return (
    /* Impostazioni e' tutta composizione di una richiesta: su carta non
       resterebbe niente da leggere, quindi l'intera pagina e' `no-print`. */
    /* Niente `.container` qui: questa e' una scheda dentro il Pannello, che il
       suo contenitore ce l'ha gia'. Annidati, il secondo toglieva altri 2.5rem
       e la colonna si stringeva di 40px cambiando linguetta.
       Niente `PageHeader` per lo stesso motivo di Admin: la testatina e' una
       sola, sta sopra le linguette. */
    <div className="fade-in no-print">
      <div className="section-title">
        <h2 className="text-base">{t('settings.title')}</h2>
      </div>
      <p className="muted small mb-6">{t('settings.subtitle')}</p>

      <div className="stack">
        <section>
          <SectionHead icon="person" title={t('settings.profile')} />
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
              <label className="field">
                <span>{t('settings.displayName')}</span>
                <input type="text" className="w-full" value={settings.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)} />
              </label>
              <label className="field">
                <span>{t('settings.email')}</span>
                <input type="email" className="w-full" value={settings.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder={t('settings.emailPlaceholder')} />
              </label>
              <div className="field">
                <span>{t('settings.role')}</span>
                {/* Il ruolo si legge, non si sceglie: badge, non campo. */}
                <div>
                  <span className="badge badge-ghost">
                    <span className="material-symbols-outlined text-sm">shield</span>
                    {settings.role === 'admin' ? t('settings.roleAdmin') : settings.role === 'editor' ? t('settings.roleEditor') : t('settings.roleViewer')}
                  </span>
                </div>
              </div>
              <label className="field">
                <span>{t('settings.defaultZone')}</span>
                <select className="w-full" value={settings.defaultZone}
                  onChange={(e) => handleChange('defaultZone', e.target.value)}>
                  {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </label>
            </div>
          </div>
        </section>

        <section>
          <SectionHead icon="language" title={t('settings.regional')} />
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
              <label className="field mb-0">
                <span>{t('settings.currency')}</span>
                <select className="w-full" value={settings.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </label>
              <label className="field mb-0">
                <span>{t('settings.language')}</span>
                <select className="w-full" value={lang}
                  onChange={(e) => handleChange('language', e.target.value)}>
                  <option value="it">Italiano</option>
                  <option value="en">English</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <DateTimeSettings />

        <section>
          <SectionHead icon="notifications" title={t('settings.notifications')} />
          <div className="card">
            <SettingRow title={t('settings.pushNotifications')} desc={t('settings.pushNotificationsDesc')}>
              <Toggle label={t('settings.pushNotifications')} value={settings.notifications} onChange={(v) => handleChange('notifications', v)} />
            </SettingRow>
            <SettingRow title={t('settings.emailAlerts')} desc={t('settings.emailAlertsDesc')}>
              <Toggle label={t('settings.emailAlerts')} value={settings.emailAlerts} onChange={(v) => handleChange('emailAlerts', v)} />
            </SettingRow>
            <SettingRow title={t('settings.lowStockAlerts')} desc={t('settings.lowStockAlertsDesc')}>
              <Toggle label={t('settings.lowStockAlerts')} value={settings.lowStockAlerts} onChange={(v) => handleChange('lowStockAlerts', v)} />
            </SettingRow>
            <SettingRow title={t('settings.priceChangeAlerts')} desc={t('settings.priceChangeAlertsDesc')}>
              <Toggle label={t('settings.priceChangeAlerts')} value={settings.priceChangeAlerts} onChange={(v) => handleChange('priceChangeAlerts', v)} />
            </SettingRow>
          </div>
        </section>

        <section>
          <SectionHead icon="palette" title={t('settings.display')} />
          <div className="card">
            <SettingRow title={t('settings.darkMode')} desc={t('settings.darkModeDesc')}>
              <Toggle label={t('settings.darkMode')} value={dark} onChange={() => handleChange('darkMode', !dark)} />
            </SettingRow>
            <SettingRow title={t('settings.compactView')} desc={t('settings.compactViewDesc')}>
              <Toggle label={t('settings.compactView')} value={settings.compactView} onChange={(v) => handleChange('compactView', v)} />
            </SettingRow>
            <SettingRow title={t('settings.autoRefresh')} desc={t('settings.autoRefreshDesc')}>
              <Toggle label={t('settings.autoRefresh')} value={settings.autoRefresh} onChange={(v) => handleChange('autoRefresh', v)} />
            </SettingRow>
            {settings.autoRefresh && (
              <SettingRow title={t('settings.refreshInterval')} desc={t('settings.refreshIntervalDesc')}>
                <select className="shrink-0" value={settings.refreshInterval}
                  onChange={(e) => handleChange('refreshInterval', e.target.value)}>
                  <option value="15">15s</option>
                  <option value="30">30s</option>
                  <option value="60">60s</option>
                  <option value="120">120s</option>
                </select>
              </SettingRow>
            )}
          </div>
        </section>

        <section>
          <SectionHead icon="shield" title={t('settings.security')} />
          {/* L'unica barra ambra della pagina sta qui: e' la sezione che pesa. */}
          <div className="card card-accent">
            <SettingRow title={t('settings.twoFactor')} desc={t('settings.twoFactorDesc')}>
              {twoFAEnabled ? (
                <button onClick={() => setShowTwoFADisableModal(true)} className="btn btn-secondary btn-sm">
                  {t('settings.disable')}
                </button>
              ) : (
                <button onClick={() => setShowTwoFAModal(true)} className="btn btn-primary btn-sm">
                  {t('settings.enable2FA')}
                </button>
              )}
            </SettingRow>

            <div className="py-4 border-t border-outline-variant">
              <h4 className="font-display uppercase tracking-[0.04em] text-sm mb-0.5">{t('settings.changePassword')}</h4>
              <p className="font-body text-sm text-on-surface-variant mb-4">{t('settings.changePasswordDesc')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <label className="field">
                  <span>{t('settings.currentPassword')}</span>
                  <input type="password" className="w-full" value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder={t('settings.currentPasswordPlaceholder')} />
                </label>
                <label className="field">
                  <span>{t('settings.newPassword')}</span>
                  <input type="password" className="w-full" value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder={t('settings.newPasswordPlaceholder')} />
                </label>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={handleChangePassword}
                  disabled={changingPwd || !currentPwd || !newPwd || newPwd.length < 6}
                  className="btn btn-primary btn-sm">
                  {changingPwd ? '...' : t('settings.saveSettings')}
                </button>
                {pwdChanged && <span className="badge badge-success">{t('settings.passwordChanged')}</span>}
                {pwdError && <span className="badge badge-error">{pwdError}</span>}
              </div>
            </div>

            <SettingRow
              title={t('settings.apiAccessKey')}
              desc={t('settings.apiAccessKeyDesc')}
              footer={newApiKey && (
                <div className="panel mt-4 mb-0 flex items-center gap-3 flex-wrap">
                  <code className="font-mono text-sm break-all flex-1 min-w-[12rem]">{newApiKey}</code>
                  <button onClick={() => { navigator.clipboard.writeText(newApiKey); setNewApiKey(null); }}
                    className="btn btn-ghost btn-sm">{t('settings.copy')}</button>
                </div>
              )}
            >
              <button onClick={handleRegenerateKey} disabled={regenerating} className="btn btn-ghost btn-sm">
                {regenerating ? '...' : t('settings.regenerate')}
              </button>
            </SettingRow>

            <SettingRow title={t('settings.corsPolicy')} desc={t('settings.corsPolicyDesc')}>
              <span className="badge badge-success">{t('settings.active')}</span>
            </SettingRow>
          </div>
        </section>

        <section>
          <SectionHead icon="database" title={t('settings.data')} />
          <div className="card">
            <SettingRow
              title={t('settings.validateJson')}
              desc={t('settings.validateJsonDesc')}
              footer={validationResult && (
                <div className={`alert mt-4 ${validationResult.valid ? 'alert-success' : 'alert-error'}`}>
                  <strong>
                    {validationResult.valid ? t('settings.jsonValid') : t('settings.jsonErrors', { count: validationResult.errors.length })}
                  </strong>
                  {!validationResult.valid && (
                    <ul className="mt-1 list-disc list-inside">
                      {validationResult.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                      {validationResult.errors.length > 10 && <li>{t('settings.moreErrors', { count: validationResult.errors.length - 10 })}</li>}
                    </ul>
                  )}
                </div>
              )}
            >
              <button onClick={handleValidateJson} disabled={validating} className="btn btn-primary btn-sm">
                {validating ? '...' : t('settings.validate')}
              </button>
            </SettingRow>

            <SettingRow title={t('settings.exportAllData')} desc={t('settings.exportAllDataDesc')}>
              <button onClick={handleExportData} className="btn btn-ghost btn-sm">{t('settings.export')}</button>
            </SettingRow>

            <SettingRow
              title={t('settings.purgeCache')}
              desc={t('settings.purgeCacheDesc')}
              footer={purgeResult && (
                <div className={`alert mt-4 ${purgeResult.success ? 'alert-success' : 'alert-error'}`}>
                  <span className="material-symbols-outlined text-base leading-none">
                    {purgeResult.success ? 'check_circle' : 'error'}
                  </span>
                  <span>{purgeResult.success ? t('settings.cachePurged') : purgeResult.message}</span>
                </div>
              )}
            >
              {/* Svuotare la cache toglie qualcosa: rosso, come l'eliminazione. */}
              <button onClick={handlePurgeCache} disabled={purging} className="btn btn-secondary btn-sm">
                {purging ? '...' : t('settings.purge')}
              </button>
            </SettingRow>
          </div>
        </section>
      </div>

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

      <div className="sticky bottom-0 z-30 mt-8 bg-background border-t border-outline-variant py-4 flex justify-between items-center gap-4 flex-wrap">
        <button onClick={handleReset} className="btn btn-ghost">{t('settings.resetDefaults')}</button>
        <div className="flex items-center gap-3 flex-wrap">
          {saveError && <span className="badge badge-error">{saveError}</span>}
          {saved && <span className="badge badge-success">{t('settings.saved')}</span>}
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-lg">
            {saving ? t('admin.saving') : t('settings.saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );
}
