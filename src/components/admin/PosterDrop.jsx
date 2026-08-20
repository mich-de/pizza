import { useState, useRef, useCallback } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { fetchWithAuth, fetchCSRF } from '../../services/adminApi';

/* La locandina di un evento: si trascina dentro, si sceglie da disco o si
   incolla. Prima c'era un campo di testo dove scrivere a mano il percorso di
   un file che qualcun altro doveva aver gia' messo sul server — cioe' non
   c'era modo di aggiungere una locandina dal Pannello.

   Il ridimensionamento e la conversione si fanno qui, nel browser di chi
   carica: una foto da telefono pesa 6-8 MB e sul server diventerebbe una
   locandina da 6-8 MB. Ridotta a 1600 quadri di lato lungo e riscritta in
   WebP sta in poche decine di kB, e il server resta senza librerie di
   immagini da mantenere. Se il browser non sa scrivere WebP si manda il file
   com'e': meglio pesante che niente. */

const MAX_SIDE = 1600;
const QUALITY = 0.85;
const MAX_BYTES = 4 * 1024 * 1024;

async function shrink(file) {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise(r => canvas.toBlob(r, 'image/webp', QUALITY));
    // Se la conversione non serve a niente, si tiene l'originale.
    if (blob && blob.type === 'image/webp' && blob.size < file.size) return blob;
  } catch {
    /* immagine illeggibile per il browser: la manda cosi' com'e' e decide il
       server, che controlla i byte d'intestazione. */
  }
  return file;
}

export default function PosterDrop({ value, onChange, disabled = false }) {
  const { t } = useI18n();
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const upload = useCallback(async (file) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) { setError(t('adminEvents.posterNotImage')); return; }

    setBusy(true);
    try {
      const body = await shrink(file);
      if (body.size > MAX_BYTES) throw new Error(t('adminEvents.posterTooBig'));
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth('/api/admin/events/poster', {
        method: 'POST',
        headers: { 'Content-Type': body.type || 'application/octet-stream', 'X-CSRF-Token': csrfToken },
        body,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t('adminEvents.posterFailed'));
      }
      const { url } = await res.json();
      onChange(url);
    } catch (err) {
      setError(err.message === 'SESSION_EXPIRED' ? t('adminEvents.posterFailed') : err.message);
    } finally {
      setBusy(false);
    }
  }, [onChange, t]);

  const onDrop = (e) => {
    e.preventDefault();
    setOver(false);
    if (disabled || busy) return;
    upload(e.dataTransfer.files?.[0]);
  };

  const onPaste = (e) => {
    const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
    if (item) { e.preventDefault(); upload(item.getAsFile()); }
  };

  if (value) {
    return (
      <div className="field">
        <span>{t('adminEvents.fieldImage')}</span>
        <div className="flex items-start gap-4 flex-wrap">
          {/* Il riquadro attorno c'e' perche' una locandina puo' essere chiara
              sui bordi e senza filetto si perderebbe nel fondo della pagina. */}
          <img src={value} alt="" className="w-32 h-32 object-cover border border-outline-variant bg-surface-dim" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-on-surface-variant break-all mb-3">{value}</p>
            <div className="flex gap-2 flex-wrap">
              <button type="button" disabled={disabled || busy}
                onClick={() => inputRef.current?.click()} className="btn btn-ghost btn-sm">
                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                {t('adminEvents.posterReplace')}
              </button>
              {/* Neutro: qui si stacca la locandina dalla scheda, e il file
                  sul disco resta dov'e'. Niente di irreversibile, niente rosso. */}
              <button type="button" disabled={disabled || busy}
                onClick={() => { setError(null); onChange(null); }} className="btn btn-ghost btn-sm">
                <span className="material-symbols-outlined text-sm">close</span>
                {t('adminEvents.posterRemove')}
              </button>
            </div>
            {busy && <p className="font-body text-sm text-on-surface-variant mt-3 mb-0">{t('adminEvents.posterUploading')}</p>}
            {error && (
              <div className="alert alert-error mt-3">
                <span className="material-symbols-outlined text-base leading-none">error</span>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
    );
  }

  return (
    <div className="field">
      <span>{t('adminEvents.fieldImage')}</span>
      {/* Un <button>, non un <div> con un `onClick`: cosi' ci si arriva col
          tabulatore e si apre con Invio, e l'anello di fuoco arriva gratis.
          Il trascinamento e' in piu', non e' l'unica strada. */}
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        onPaste={onPaste}
        onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`w-full flex flex-col items-center justify-center gap-2 py-8 px-4 border border-dashed text-center transition-colors ${
          over ? 'border-accent bg-accent/10' : 'border-outline-variant bg-surface-dim hover:border-on-surface-variant'
        }`}
      >
        {busy ? (
          <>
            <span className="spinner" />
            <span className="font-body text-sm text-on-surface-variant">{t('adminEvents.posterUploading')}</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">add_photo_alternate</span>
            <span className="font-display uppercase tracking-[0.06em] text-sm">{t('adminEvents.posterDrop')}</span>
            <span className="font-body text-xs text-on-surface-variant">{t('adminEvents.posterHint')}</span>
          </>
        )}
      </button>
      {error && (
        <div className="alert alert-error mt-3">
          <span className="material-symbols-outlined text-base leading-none">error</span>
          <span>{error}</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}
