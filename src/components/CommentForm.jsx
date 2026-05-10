import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '../i18n/I18nContext';

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
  const initRef = useRef(false);

  const fetchCaptcha = useCallback(async () => {
    try {
      const res = await fetch('/api/comments/captcha');
      const data = await res.json();
      setCaptcha(data);
      setCaptchaAnswer('');
    } catch {
      setError(t('comments.captchaError'));
    }
  }, [t]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    fetchCaptcha();
  }, [fetchCaptcha]);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!author.trim() || !content.trim()) {
      setError(t('comments.fillAll'));
      return;
    }
    if (captchaAnswer === '' || parseInt(captchaAnswer) !== captcha?.answer) {
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
          author: author.trim(),
          content: content.trim(),
          proposedPrice: proposedPrice !== '' ? parseFloat(proposedPrice) : undefined,
          honeypot,
          mathAnswer: parseInt(captchaAnswer),
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
    <form onSubmit={handleSubmit} className="space-y-6 bg-primary/5 p-6 border border-primary/10 backdrop-blur-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-label font-bold uppercase text-[10px] tracking-widest text-primary/60">
            {t('comments.yourName')}
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={30}
            className="bg-surface border-2 border-primary/10 px-4 py-3 font-body focus:outline-none focus:border-secondary transition-all shadow-sm"
            placeholder={t('comments.namePlaceholder')}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-label font-bold uppercase text-[10px] tracking-widest text-primary/60">
            {t('comments.proposedPrice', 'Prezzo proposto (opzionale)')}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 font-bold">€</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={proposedPrice}
              onChange={(e) => setProposedPrice(e.target.value)}
              className="bg-surface border-2 border-primary/10 pl-8 pr-4 py-3 font-body w-full focus:outline-none focus:border-secondary transition-all shadow-sm"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-label font-bold uppercase text-[10px] tracking-widest text-primary/60">
          {t('comments.yourComment')}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          rows={4}
          className="bg-surface border-2 border-primary/10 px-4 py-3 font-body focus:outline-none focus:border-secondary resize-none transition-all shadow-sm"
          placeholder={t('comments.textPlaceholder')}
        />
        <div className="flex justify-end">
          <span className="font-label text-[10px] font-bold text-primary/30 uppercase tracking-tighter">
            {content.length} / 500 characters
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-2">
        <div className="flex flex-col gap-2">
          <label className="font-label font-bold uppercase text-[10px] tracking-widest text-primary/60">
            {t('comments.verifyHuman')}
          </label>
          <div className="flex gap-2 items-center">
            {captcha && (
              <div className="font-headline text-lg font-black bg-primary text-on-primary px-4 py-2 border-2 border-primary flex items-center justify-center min-w-[80px]">
                {captcha.question}
              </div>
            )}
            <span className="font-black text-primary/40">=</span>
            <input
              type="number"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              className="bg-surface border-2 border-primary/10 px-4 py-2 font-headline font-black w-24 focus:outline-none focus:border-secondary transition-all shadow-sm text-center"
              placeholder="?"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="relative group bg-primary text-on-primary font-headline font-black uppercase py-4 px-10 overflow-hidden transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-secondary translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <span className="relative z-10 flex items-center gap-2 justify-center">
            {submitting ? (
              <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="material-symbols-outlined text-[20px]">send</span>
            )}
            {submitting ? t('comments.sending') : t('comments.submit')}
          </span>
        </button>
      </div>

      {error && (
        <div className="bg-error/10 border-l-4 border-error px-4 py-3 font-label font-bold text-error text-xs animate-subtle-fade">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-tertiary/10 border-l-4 border-tertiary px-4 py-3 font-label font-bold text-tertiary text-xs animate-subtle-fade">
          {t('comments.submitted')}
        </div>
      )}
    </form>
  );
}
