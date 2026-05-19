import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '../i18n/I18nContext';

const AUTHOR_REGEX = /^[a-zA-Z0-9àèéìòùÀÈÉÌÒÙ\s'-]+$/;

export default function CommentForm({ postId, onCommentSubmitted }) {
  const { t } = useI18n();
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
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
          proposedPrice: proposedPrice !== '' ? parseFloat(proposedPrice) : undefined,
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
      setProposedPrice('');
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
    <form onSubmit={handleSubmit} className="space-y-5 bg-surface-variant border border-outline-variant rounded-sm p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-label font-semibold text-[11px] tracking-wider text-on-surface-variant">
            {t('comments.yourName')}
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={30}
            className="bg-surface border border-outline-variant rounded-sm px-3 py-2.5 font-body text-sm text-primary placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            placeholder={t('comments.namePlaceholder')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-label font-semibold text-[11px] tracking-wider text-on-surface-variant">
            {t('comments.proposedPrice')}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium text-sm">€</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={proposedPrice}
              onChange={(e) => setProposedPrice(e.target.value)}
              className="bg-surface border border-outline-variant rounded-sm pl-7 pr-3 py-2.5 font-body text-sm text-primary w-full focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-label font-semibold text-[11px] tracking-wider text-on-surface-variant">
          {t('comments.yourComment')}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          rows={4}
          className="bg-surface border border-outline-variant rounded-sm px-3 py-2.5 font-body text-sm text-primary placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all"
          placeholder={t('comments.textPlaceholder')}
        />
        <div className="flex justify-end">
          <span className="font-label text-[11px] text-on-surface-variant/60">
            {content.length} / 500
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div className="flex flex-col gap-1.5">
          <label className="font-label font-semibold text-[11px] tracking-wider text-on-surface-variant">
            {t('comments.verifyHuman')}
          </label>
          <div className="flex gap-2 items-center">
            {captcha && (
              <div className="font-display text-lg font-bold bg-primary/5 border border-primary/30 rounded-sm text-primary px-4 py-1.5 flex items-center justify-center min-w-[80px]">
                {captcha.question}
              </div>
            )}
            <span className="font-medium text-on-surface-variant/40">=</span>
            <input
              type="number"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              className="bg-surface border border-outline-variant rounded-sm px-3 py-2 font-label font-semibold w-20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-center"
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

        <button
          type="submit"
          disabled={submitting}
          className="bg-primary text-on-primary font-label font-semibold tracking-wider py-3 px-8 rounded-sm hover:opacity-90 transition-opacity active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2 justify-center">
            {submitting ? (
              <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-lg">send</span>
            )}
            {submitting ? t('comments.sending') : t('comments.submit')}
          </span>
        </button>
      </div>

      {error && (
        <div className="bg-error/5 border border-error/30 rounded-sm px-4 py-2.5 font-label text-sm text-error font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-tertiary/5 border border-tertiary/30 rounded-sm px-4 py-2.5 font-label text-sm text-tertiary font-medium">
          {t('comments.submitted')}
        </div>
      )}
    </form>
  );
}
