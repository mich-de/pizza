import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../i18n/I18nContext';

export default function PriceProposalForm({ pizzeriaId, pizzeriaName, currentPrice, onSubmitted }) {
  const { t, money } = useI18n();
  const [author, setAuthor] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [content, setContent] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [captcha, setCaptcha] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCaptcha = useCallback(async () => {
    try {
      const res = await fetch('/api/comments/captcha');
      const data = await res.json();
      setCaptcha(data);
      setCaptchaAnswer('');
    } catch {
      setError(t('priceProposal.errorFetchCaptcha'));
    }
  }, [t]);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    if (!author.trim()) {
      setError(t('priceProposal.errorAuthorRequired'));
      return;
    }
    if (!proposedPrice || isNaN(parseFloat(proposedPrice))) {
      setError(t('priceProposal.errorPriceRequired'));
      return;
    }
    const price = parseFloat(proposedPrice);
    if (price <= 0 || price > 100) {
      setError(t('priceProposal.errorPriceRange'));
      return;
    }
    if (!captcha || captchaAnswer === '') {
      setError(t('priceProposal.errorCaptchaWrong'));
      fetchCaptcha();
      return;
    }

    setSubmitting(true);
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      /* Rotta dedicata: questa e' una proposta di prezzo, non un commento.
         La nota parte com'e' — se vuota resta vuota. Prima, quando era corta,
         veniva sostituita con «Prezzo Margherita €5.50», cioe' un messaggio
         che ripeteva a parole il numero gia' scritto nel campo accanto. */
      const res = await fetch('/api/proposals', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          postId: pizzeriaId,
          author: author.trim(),
          proposedPrice: price,
          note: content.trim(),
          honeypot,
          mathAnswer: parseInt(captchaAnswer),
          captchaToken: captcha?.captchaToken,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t('priceProposal.errorSubmit'));
        fetchCaptcha();
        return;
      }
      setSuccess(true);
      onSubmitted?.();
    } catch {
      setError(t('priceProposal.errorNetwork'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      /* Due <span> affiancati: e' la forma «icona + testo» dell'avviso, l'unica
         che puo' accendere il flex senza spezzare il testo in colonne. */
      <div className="panel">
        <div className="alert alert-success">
          <span className="material-symbols-outlined text-base leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
          <span>
            <strong>{t('priceProposal.successTitle')}</strong> {t('priceProposal.successDesc')}
          </span>
        </div>
        <button
          onClick={() => { setSuccess(false); setProposedPrice(''); setContent(''); setAuthor(''); fetchCaptcha(); }}
          className="btn btn-ghost btn-sm mt-4"
        >
          {t('priceProposal.submitAnother')}
        </button>
      </div>
    );
  }

  return (
    /* Un modulo e' composizione della richiesta, non lettura del risultato:
       su carta sparisce tutto (regola della stampa). */
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      className="no-print"
      noValidate
    >
      <div className="section-title">
        <h2 className="text-base">{pizzeriaName}</h2>
        {currentPrice > 0 && (
          <span className="badge badge-ghost">
            {t('priceProposal.currentPrice')} &euro;{money(currentPrice)}
          </span>
        )}
      </div>

      <label className="field">
        <span>{t('priceProposal.priceLabel')} (&euro;)</span>
        <input
          type="number"
          min="0.10"
          max="100"
          step="0.50"
          value={proposedPrice}
          onChange={(e) => setProposedPrice(e.target.value)}
          className="w-full font-mono tabular-nums text-lg"
          placeholder="0.00"
          required
        />
      </label>

      <label className="field">
        <span>{t('priceProposal.authorLabel')}</span>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={30}
          className="w-full"
          placeholder={t('priceProposal.authorPlaceholder')}
          required
        />
        <span className="font-mono text-[0.68rem] text-on-surface-variant/70 text-right block mt-0.5">{author.length}/30</span>
      </label>

      <label className="field">
        <span>{t('priceProposal.notesLabel')}</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={200}
          rows={2}
          className="w-full resize-none"
          placeholder={t('priceProposal.notesPlaceholder')}
        />
        <span className="font-mono text-[0.68rem] text-on-surface-variant/70 text-right block mt-0.5">{content.length}/200</span>
      </label>

      {/* La verifica e' un dato da leggere, quindi e' composta come un flap:
          e' anche la cosa piu' facile da trovare nel modulo. */}
      <div className="panel">
        <span className="block font-label text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mb-2">
          {t('priceProposal.captchaLabel')}
        </span>
        <div className="flex items-center gap-3">
          {captcha ? (
            <span className="flap">{captcha.question}</span>
          ) : (
            <span className="font-body text-sm text-on-surface-variant">{t('priceProposal.captchaLoading')}</span>
          )}
          <input
            type="number"
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value)}
            className="w-20 text-center font-mono tabular-nums text-lg"
            placeholder="?"
            required
          />
          <button
            type="button"
            onClick={fetchCaptcha}
            className="btn btn-ghost btn-sm btn-icon"
            title={t('priceProposal.newCalculation')}
            tabIndex={-1}
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mt-4">
          <span className="material-symbols-outlined text-base leading-none">error</span>
          <span>{error}</span>
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

      {/* Il rosso e' qui perche' qui si agisce: si invia la proposta. */}
      <button type="submit" disabled={submitting || !captcha} className="btn btn-secondary btn-block mt-4">
        {submitting ? (
          <>
            <span className="spinner" />
            {t('priceProposal.submitting')}
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-base">send</span>
            {t('priceProposal.submitBtn')}
          </>
        )}
      </button>

      <p className="font-body text-[0.72rem] text-on-surface-variant text-center mt-2">
        {t('priceProposal.infoText')}
      </p>
    </form>
  );
}
