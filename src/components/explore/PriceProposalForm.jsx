import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '../../i18n/I18nContext';

export default function PriceProposalForm({ pizzeriaId, pizzeriaName, currentPrice, onSubmitted }) {
  const { t } = useI18n();
  const [author, setAuthor] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [content, setContent] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [captcha, setCaptcha] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const initRef = useRef(false);

  const fetchCaptcha = useCallback(async () => {
    try {
      const res = await fetch('/api/comments/captcha');
      const data = await res.json();
      setCaptcha(data);
      setCaptchaAnswer('');
    } catch {
      setError('Impossibile caricare la verifica. Riprova.');
    }
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    fetchCaptcha();
  }, [fetchCaptcha]);

  useEffect(() => { fetchCaptcha(); }, [fetchCaptcha]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    if (!author.trim()) {
      setError('Inserisci il tuo nome o nickname.');
      return;
    }
    if (!proposedPrice || isNaN(parseFloat(proposedPrice))) {
      setError('Inserisci il prezzo proposto per la Margherita.');
      return;
    }
    const price = parseFloat(proposedPrice);
    if (price <= 0 || price > 100) {
      setError('Il prezzo deve essere compreso tra €0.10 e €100.');
      return;
    }
    if (!captcha || captchaAnswer === '' || parseInt(captchaAnswer) !== captcha.answer) {
      setError('Risposta alla verifica errata. Riprova.');
      fetchCaptcha();
      return;
    }

    setSubmitting(true);
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const noteText = content.trim().length >= 5
        ? content.trim()
        : `Prezzo Margherita proposto a €${price.toFixed(2)}`;

      const res = await fetch('/api/comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          postId: pizzeriaId,
          author: author.trim(),
          content: noteText,
          proposedPrice: price,
          honeypot,
          mathAnswer: parseInt(captchaAnswer),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Errore durante l\'invio. Riprova.');
        fetchCaptcha();
        return;
      }
      setSuccess(true);
      onSubmitted?.();
    } catch {
      setError('Errore di rete. Verifica la connessione e riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-tertiary-container border-4 border-tertiary p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-3xl text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
            task_alt
          </span>
          <h4 className="font-headline font-black uppercase text-lg text-tertiary">
            Segnalazione inviata!
          </h4>
        </div>
        <p className="font-body text-sm text-on-surface-variant">
          Grazie per il contributo. Il prezzo proposto verrà verificato e aggiornato a breve.
        </p>
        <button
          onClick={() => { setSuccess(false); setProposedPrice(''); setContent(''); setAuthor(''); fetchCaptcha(); }}
          className="mt-4 font-label font-bold uppercase text-xs py-1 px-4 border-2 border-tertiary text-tertiary hover:bg-tertiary hover:text-on-tertiary transition-colors"
        >
          Invia un'altra segnalazione
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      className="space-y-4"
      noValidate
    >
      {/* Header */}
      <div className="bg-secondary-container border-2 border-primary p-3 flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary text-2xl flex-shrink-0">
          local_pizza
        </span>
        <div>
          <p className="font-headline font-black uppercase text-sm text-primary leading-tight">
            {pizzeriaName}
          </p>
          {currentPrice > 0 && (
            <p className="font-label text-xs text-on-surface-variant mt-0.5">
              Prezzo attuale registrato: <span className="font-headline font-black text-secondary">€{currentPrice.toFixed(2)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary mb-1.5">
          🍕 Prezzo Margherita *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-headline font-black text-primary text-sm">€</span>
          <input
            type="number"
            min="0.10"
            max="100"
            step="0.50"
            value={proposedPrice}
            onChange={(e) => setProposedPrice(e.target.value)}
            className="w-full bg-surface border-2 border-primary pl-8 pr-3 py-2.5 font-headline font-black text-lg text-primary focus:outline-none focus:border-secondary"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      {/* Author */}
      <div>
        <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary mb-1.5">
          Il tuo nome / nickname *
        </label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={30}
          className="w-full bg-surface border-2 border-primary px-3 py-2.5 font-body font-bold text-sm text-primary focus:outline-none focus:border-secondary"
          placeholder="Es. Marco R."
          required
        />
        <p className="text-right text-[10px] text-on-surface-variant mt-0.5">{author.length}/30</p>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary mb-1.5">
          Note aggiuntive
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={200}
          rows={2}
          className="w-full bg-surface border-2 border-primary px-3 py-2.5 font-body font-bold text-sm text-primary focus:outline-none focus:border-secondary resize-none"
          placeholder="Es. Prezzo da menù in sala, aggiornato ad aprile 2026..."
        />
        <p className="text-right text-[10px] text-on-surface-variant -mt-1">{content.length}/200</p>
      </div>

      {/* Captcha */}
      <div className="bg-surface-variant border-2 border-primary p-3">
        <p className="text-xs font-black font-headline uppercase tracking-widest text-on-surface-variant mb-2">
          Verifica anti-spam
        </p>
        <div className="flex items-center gap-3">
          {captcha ? (
            <span className="font-headline text-xl font-black bg-primary text-on-primary px-4 py-2 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] min-w-[80px] text-center">
              {captcha.question}
            </span>
          ) : (
            <span className="font-label text-sm text-on-surface-variant">Caricamento...</span>
          )}
          <input
            type="number"
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value)}
            className="w-20 bg-surface border-2 border-primary px-3 py-2 font-headline font-black text-lg focus:outline-none focus:border-secondary text-center"
            placeholder="?"
            required
          />
          <button
            type="button"
            onClick={fetchCaptcha}
            className="text-on-surface-variant hover:text-primary transition-colors"
            title="Nuovo calcolo"
            tabIndex={-1}
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error-container border-2 border-error p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-error text-sm flex-shrink-0 mt-0.5">error</span>
          <p className="font-label font-bold text-sm text-on-error-container">{error}</p>
        </div>
      )}

      {/* Honeypot */}
      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
        aria-hidden="true"
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !captcha}
        className="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary font-headline font-black uppercase py-3 px-6 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
      >
        {submitting ? (
          <>
            <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
            Invio in corso...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-sm">send</span>
            Invia segnalazione
          </>
        )}
      </button>

      <p className="text-[10px] font-label text-on-surface-variant text-center">
        Le segnalazioni vengono verificate prima di essere pubblicate. Grazie per il contributo!
      </p>
    </form>
  );
}
