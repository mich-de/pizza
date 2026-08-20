import { useState, useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext';

const AUTHOR_REGEX = /^[a-zA-Z0-9àèéìòùÀÈÉÌÒÙ\s'-]+$/;

export default function CommentForm({ postId, onCommentSubmitted }) {
  const { t } = useI18n();
  const [author, setAuthor] = useState('');
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
      setError(t('comments.fetchCaptchaError'));
    }
  }, [t]);

  const [didInit, setDidInit] = useState(false);
  if (!didInit) {
    setDidInit(true);
    fetchCaptcha();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (honeypot.trim() !== '') {
      setError(t('comments.invalidRequest'));
      return;
    }

    if (!author.trim() || !content.trim()) {
      setError(t('comments.fillAll'));
      return;
    }

    const trimmedAuthor = author.trim();
    const trimmedContent = content.trim();

    if (trimmedAuthor.length < 2 || trimmedAuthor.length > 30) {
      setError(t('comments.authorLengthError'));
      return;
    }

    if (!AUTHOR_REGEX.test(trimmedAuthor)) {
      setError(t('comments.authorCharError'));
      return;
    }

    if (trimmedContent.length < 5) {
      setError(t('comments.minLengthError'));
      return;
    }

    if (captchaAnswer === '') {
      setError(t('comments.captchaWrong'));
      fetchCaptcha();
      return;
    }

    setSubmitting(true);
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('/api/comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          postId,
          author: trimmedAuthor,
          content: trimmedContent,
          honeypot,
          mathAnswer: parseInt(captchaAnswer),
          captchaToken: captcha?.captchaToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('comments.submitError'));
        if (res.status === 429) {
          fetchCaptcha();
        }
        return;
      }

      setSuccess(true);
      setAuthor('');
      setContent('');
      setCaptchaAnswer('');
      fetchCaptcha();
      onCommentSubmitted?.(data);
    } catch {
      setError(t('comments.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /* Il modulo compone una richiesta: non finisce sulla carta. */
    <form onSubmit={handleSubmit} className="panel no-print">
      {error && (
        <div className="alert alert-error mb-4">
          <span className="material-symbols-outlined text-base leading-none">error</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-4">
          <span className="material-symbols-outlined text-base leading-none">check_circle</span>
          <span>{t('comments.submitted')}</span>
        </div>
      )}

      {/* Niente campo prezzo qui: segnalare un prezzo e' un'altra cosa, e ha
          il suo pulsante e il suo modulo. Infilato in coda a un commento
          faceva nascere due righe da approvare per un gesto solo. */}
      <label className="field">
        <span>{t('comments.yourName')}</span>
        <input
          type="text"
          className="w-full"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={30}
          placeholder={t('comments.namePlaceholder')}
        />
      </label>

      <label className="field">
        <span>{t('comments.yourComment')}</span>
        <textarea
          className="w-full"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder={t('comments.textPlaceholder')}
        />
        <small className="block text-right font-mono tabular-nums text-[0.68rem] text-on-surface-variant">
          {content.length}/500
        </small>
      </label>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="font-label text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mb-1.5">
            {t('comments.verifyHuman')}
          </div>
          {/* Il quesito e' l'unico dato da leggere qui: flap. La risposta si
              digita, quindi resta un campo in monospaziato. */}
          <div className="flex gap-2 items-center">
            {captcha && <span className="flap">{captcha.question}</span>}
            <span className="font-mono text-on-surface-variant">=</span>
            <input
              type="number"
              className="w-20 text-center font-mono tabular-nums"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              placeholder="?"
            />
          </div>
        </div>

        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
          aria-hidden="true"
        />

        <button type="submit" disabled={submitting} className="btn btn-primary shrink-0">
          <span className={`material-symbols-outlined text-base ${submitting ? 'animate-spin' : ''}`}>
            {submitting ? 'refresh' : 'send'}
          </span>
          {submitting ? t('comments.sending') : t('comments.submit')}
        </button>
      </div>
    </form>
  );
}
