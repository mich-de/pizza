import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { checkAuth } from '../services/authService';
import { useComments } from '../hooks/useComments';
import CommentForm from '../components/CommentForm';
import CommentList from '../components/CommentList';
import SocialActions from '../components/SocialActions';

const FALLBACK = [
  {
    id: '#001', title_it: 'Classica Sorrentina', title_en: 'Sorrento Classic',
    author: '@MarioBros_Pie', time: '2H', rating: '9.2/10',
    description_it: 'Architettura della crosta ottimale.', description_en: 'Crust architecture is optimal.',
    fires: '1.2K', img: '/images/pizzerias/pizza-1.png',
  },
  {
    id: '#002', title_it: 'Pep Industriale', title_en: 'Industrial Pep',
    author: '@IronOven', time: '4H', rating: '8.8/10',
    description_it: 'Carbonizzazione aggressiva sui pepperoni.', description_en: 'Aggressive charring on pepperoni cups.',
    fires: '890', img: '/images/pizzerias/pizza-2.png',
  },
  {
    id: '#003', title_it: 'Stack Metro Vico', title_en: 'Vico Metro Stack',
    author: '@DoughEngineer', time: '6H', rating: '9.0/10',
    description_it: 'Pizza a metro al picco strutturale.', description_en: 'Pizza a metro at structural peak.',
    fires: '1.5K', img: '/images/pizzerias/pizza-3.png',
  },
  {
    id: '#004', title_it: 'Minimalista Meta', title_en: 'Meta Minimalist',
    author: '@CrustPunk', time: '8H', rating: '8.5/10',
    description_it: 'Essenziale, niente fronzoli.', description_en: 'Stripped down to the essentials.',
    fires: '670', img: '/images/pizzerias/pizza-4.png',
  },
];

function PostComments({ postId, show, onToggle }) {
  const { t } = useI18n();
  const { comments, loading, addComment } = useComments(postId, show);

  if (!show) return null;

  return (
    <div className="mt-4 pt-4 border-t border-primary/5 animate-subtle-fade">
      {!loading && (
        <CommentForm postId={postId} onCommentSubmitted={(c) => { addComment(c); onToggle(); }} />
      )}
      <div className="mt-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <p className="font-label text-sm text-primary/50">{t('common.loading')}</p>
        ) : (
          <CommentList comments={comments} />
        )}
      </div>
    </div>
  );
}

function EditPostModal({ post, open, onClose, onSaved, t }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [prevPost, setPrevPost] = useState(null);
  if (open && post && post !== prevPost) {
    setPrevPost(post);
    setTitle(post.title || '');
    setDescription(post.description || '');
    setError('');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError(t('feed.postTitleRequired')); return; }

    setSubmitting(true);
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch(`/api/admin/feed-posts/${post.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t('common.saveError'));
        return;
      }
      onSaved?.();
      onClose();
    } catch {
      setError(t('common.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-[20vh]" onClick={onClose}>
      <div className="bg-surface border-4 border-primary w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]" onClick={(e) => e.stopPropagation()}>
        <div className="bg-primary text-on-primary p-4 flex items-center justify-between">
          <h2 className="font-headline font-black uppercase text-lg">{t('feed.editPost')}</h2>
          <button onClick={onClose} className="text-on-primary hover:text-secondary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          <div>
            <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary mb-1.5">{t('feed.postTitle')} *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100}
              className="w-full bg-surface border-2 border-primary px-3 py-2.5 font-headline font-bold text-base text-primary focus:outline-none focus:border-secondary" />
          </div>
          <div>
            <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary mb-1.5">{t('feed.postDescription')}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3}
              className="w-full bg-surface border-2 border-primary px-3 py-2.5 font-body font-bold text-sm text-primary focus:outline-none focus:border-secondary resize-none" />
          </div>
          {error && (
            <div className="bg-error-container border-2 border-error p-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-error text-sm flex-shrink-0 mt-0.5">error</span>
              <p className="font-label font-bold text-sm text-on-error-container">{error}</p>
            </div>
          )}
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary font-headline font-black uppercase py-3 px-6 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50">
            {submitting ? t('feed.saving') : t('feed.saveChanges')}
          </button>
        </form>
      </div>
    </div>
  );
}

function FeedPost({ post, lang, t, isAdmin, onModAction, onEdit }) {
  const [showComments, setShowComments] = useState(false);

  const postId = post._originalId || post.id;

  return (
    <article className="bg-surface-bright border-2 border-primary/10 shadow-xl p-0 flex flex-col md:flex-row group hover:border-primary/40 transition-all duration-500 overflow-hidden">
      <div className="w-full md:w-2/5 relative overflow-hidden bg-primary aspect-square md:aspect-auto">
        <img
          alt={lang === 'it' ? post.title_it : post.title_en}
          className="w-full h-full object-cover mix-blend-luminosity opacity-80 group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out"
          src={post.img}
          loading="lazy"
        />
        <div className="absolute top-4 left-4 bg-primary text-on-primary font-headline font-black px-3 py-1 border border-on-primary/20 backdrop-blur-md bg-opacity-80 flex items-center gap-2">
          {post._isUserPost && (
            <span className="material-symbols-outlined text-xs">add_a_photo</span>
          )}
          {post.id}
        </div>
        {post._isUserPost && (
          <div className="absolute top-4 right-4 bg-secondary text-on-secondary font-label font-bold text-[10px] uppercase px-2 py-1 tracking-widest">
            {t('feed.shared')}
          </div>
        )}
      </div>
      <div className="p-6 md:p-8 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-headline text-2xl md:text-4xl font-black uppercase tracking-tight mb-2 group-hover:text-secondary transition-colors duration-300">
              {lang === 'it' ? post.title_it : post.title_en}
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center border border-primary/10 overflow-hidden">
                <span className="material-symbols-outlined text-xs text-secondary">person</span>
              </div>
              <p className="font-label font-bold text-primary/60 uppercase text-xs tracking-widest">
                {post.author} &bull; {post.time} {post._isUserPost ? '' : t('common.hrsAgo')?.toUpperCase()}
              </p>
            </div>
          </div>
          {post.rating && (
            <div className="bg-primary text-on-primary font-headline font-black text-xl px-4 py-2 border-b-4 border-secondary">
              {post.rating}
            </div>
          )}
        </div>

        <p className="font-body text-lg leading-relaxed mb-6 font-medium text-primary/80">
          {lang === 'it' ? post.description_it : post.description_en}
        </p>

        <div className="mt-auto">
          <SocialActions fires={post.fires} onCommentClick={() => setShowComments(!showComments)} t={t} />
          {isAdmin && post._isUserPost && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary/10">
              <span className="font-label font-bold text-[10px] uppercase tracking-widest text-primary/40 mr-2">{t('feed.adminLabel')}</span>
              <button
                onClick={() => onModAction?.(postId, 'approve')}
                className="flex items-center gap-1 bg-tertiary text-on-tertiary font-label font-bold uppercase text-[10px] py-1 px-3 border border-primary/20 hover:bg-tertiary-container hover:text-tertiary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span> {t('feed.approve')}
              </button>
              <button
                onClick={() => onEdit?.(post)}
                className="flex items-center gap-1 bg-surface text-primary font-label font-bold uppercase text-[10px] py-1 px-3 border border-primary/20 hover:bg-primary hover:text-on-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">edit</span> {t('feed.edit')}
              </button>
              <button
                onClick={() => onModAction?.(postId, 'reject')}
                className="flex items-center gap-1 bg-error text-on-error font-label font-bold uppercase text-[10px] py-1 px-3 border border-error/20 hover:bg-error-container hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-sm">delete</span> {t('feed.delete')}
              </button>
            </div>
          )}
          <PostComments postId={post.id} show={showComments} onToggle={() => setShowComments(false)} />
        </div>
      </div>
    </article>
  );
}

function CreatePostModal({ open, onClose, t, onCreated }) {
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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

  const [prevOpen, setPrevOpen] = useState(false);
  if (open && open !== prevOpen) {
    setPrevOpen(open);
    fetchCaptcha();
    setAuthor('');
    setTitle('');
    setDescription('');
    setHoneypot('');
    setCaptchaAnswer('');
    setError('');
    setSuccess(false);
  } else if (!open && open !== prevOpen) {
    setPrevOpen(open);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!author.trim()) { setError(t('priceProposal.errorAuthorRequired')); return; }
    if (!title.trim()) { setError(t('feed.postTitleRequired')); return; }
    if (!captcha || captchaAnswer === '') {
      setError(t('priceProposal.errorCaptchaWrong'));
      fetchCaptcha();
      return;
    }

    setSubmitting(true);
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('/api/feed/posts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          author: author.trim(),
          title: title.trim(),
          description: description.trim(),
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
      onCreated?.();
    } catch {
      setError(t('priceProposal.errorNetwork'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-[10vh] overflow-y-auto" onClick={onClose}>
      <div className="bg-surface border-4 border-primary w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-primary text-on-primary p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl">add_a_photo</span>
            <h2 className="font-headline font-black uppercase text-lg">
              {t('feed.createPostTitle')}
            </h2>
          </div>
          <button onClick={onClose} className="text-on-primary hover:text-secondary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-tertiary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            </div>
            <h3 className="font-headline font-black text-2xl uppercase text-tertiary mb-2">
              {t('feed.postSubmitted')}
            </h3>
            <p className="font-body text-on-surface-variant mb-6">
              {t('feed.postPendingApproval')}
            </p>
            <button
              onClick={onClose}
              className="bg-secondary text-on-secondary font-headline font-black uppercase py-3 px-8 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
            <div>
              <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary mb-1.5">
                {t('feed.yourName')} *
              </label>
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={30}
                className="w-full bg-surface border-2 border-primary px-3 py-2.5 font-body font-bold text-sm text-primary focus:outline-none focus:border-secondary"
                placeholder={t('comments.namePlaceholder')} required />
              <p className="text-right text-[10px] text-on-surface-variant mt-0.5">{author.length}/30</p>
            </div>

            <div>
              <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary mb-1.5">
                {t('feed.postTitle')} *
              </label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100}
                className="w-full bg-surface border-2 border-primary px-3 py-2.5 font-headline font-bold text-base text-primary focus:outline-none focus:border-secondary"
                placeholder={t('feed.postTitlePlaceholder')} required />
              <p className="text-right text-[10px] text-on-surface-variant mt-0.5">{title.length}/100</p>
            </div>

            <div>
              <label className="block text-xs font-black font-headline uppercase tracking-widest text-primary mb-1.5">
                {t('feed.postDescription')}
              </label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3}
                className="w-full bg-surface border-2 border-primary px-3 py-2.5 font-body font-bold text-sm text-primary focus:outline-none focus:border-secondary resize-none"
                placeholder={t('feed.postDescriptionPlaceholder')} />
              <p className="text-right text-[10px] text-on-surface-variant -mt-1">{description.length}/500</p>
            </div>

            <div className="bg-surface-variant border-2 border-primary p-3">
              <p className="text-xs font-black font-headline uppercase tracking-widest text-on-surface-variant mb-2">
                {t('comments.verifyHuman')}
              </p>
              <div className="flex items-center gap-3">
                {captcha ? (
                  <span className="font-headline text-xl font-black bg-primary text-on-primary px-4 py-2 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] min-w-[80px] text-center">
                    {captcha.question}
                  </span>
                ) : (
                  <span className="font-label text-sm text-on-surface-variant">{t('common.loading')}</span>
                )}
                <input type="number" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="w-20 bg-surface border-2 border-primary px-3 py-2 font-headline font-black text-lg focus:outline-none focus:border-secondary text-center" placeholder="?" required />
                <button type="button" onClick={fetchCaptcha} className="text-on-surface-variant hover:text-primary transition-colors" title="Nuovo calcolo" tabIndex={-1}>
                  <span className="material-symbols-outlined text-sm">refresh</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-error-container border-2 border-error p-3 flex items-start gap-2">
                <span className="material-symbols-outlined text-error text-sm flex-shrink-0 mt-0.5">error</span>
                <p className="font-label font-bold text-sm text-on-error-container">{error}</p>
              </div>
            )}

            <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }} aria-hidden="true" />

            <button type="submit" disabled={submitting || !captcha}
              className="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary font-headline font-black uppercase py-3 px-6 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
            >
              {submitting ? (
                <><span className="material-symbols-outlined text-sm animate-spin">refresh</span>{t('comments.sending')}</>
              ) : (
                <><span className="material-symbols-outlined text-sm">add_a_photo</span>{t('feed.submitPost')}</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function CreatePost({ t, onCreated }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        className="bg-surface border-2 border-primary/5 p-6 shadow-xl flex items-center gap-6 group cursor-pointer hover:border-secondary/30 transition-all duration-500 mb-12 relative overflow-hidden"
        onClick={() => setModalOpen(true)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
        <div className="relative w-14 h-14 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-lg group-hover:bg-secondary group-hover:rotate-12 transition-all duration-500">
          <span className="material-symbols-outlined text-2xl">add_a_photo</span>
        </div>
        <div className="relative flex-1">
          <p className="font-headline font-bold text-2xl text-primary/30 group-hover:text-primary transition-colors duration-300">
            {t('feed.whatsNew')}
          </p>
          <div className="h-0.5 w-0 group-hover:w-full bg-secondary transition-all duration-500 mt-1"></div>
        </div>
        <div className="relative hidden sm:flex gap-4">
          <div className="p-2 rounded-full bg-primary/5 text-primary/20 group-hover:text-secondary group-hover:bg-secondary/10 transition-all duration-300">
            <span className="material-symbols-outlined">emoji_events</span>
          </div>
          <div className="p-2 rounded-full bg-primary/5 text-primary/20 group-hover:text-tertiary group-hover:bg-tertiary/10 transition-all duration-300">
            <span className="material-symbols-outlined">location_on</span>
          </div>
        </div>
      </div>
      <CreatePostModal open={modalOpen} onClose={() => setModalOpen(false)} t={t} onCreated={onCreated} />
    </>
  );
}

export default function Feed() {
  const [filter, setFilter] = useState('latest');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const { t, lang } = useI18n();

  const fetchUserPosts = useCallback(() => {
    fetch('/api/feed/posts')
      .then(r => r.ok ? r.json() : [])
      .then(data => setUserPosts(data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    checkAuth().then(user => {
      setIsAdmin(user?.role === 'admin');
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch('/feed-data.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(data => { if (isMounted) setPosts(data); })
      .catch(() => { if (isMounted) setPosts(null); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  const handleModAction = async (postId, action) => {
    const numId = postId.replace('#USR-', '').replace(/^0+/, '');
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      if (action === 'approve') {
        await fetch(`/api/admin/approve-feed-post/${numId}`, {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        });
      } else {
        await fetch(`/api/admin/reject-feed-post/${numId}`, {
          method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        });
      }
      fetchUserPosts();
    } catch (e) { console.error(e); }
  };

  const display = posts || FALLBACK;
  const allPosts = [...userPosts, ...display];

  let filtered = allPosts;
  if (search.trim()) {
    const s = search.toLowerCase();
    filtered = filtered.filter(p =>
      (lang === 'it' ? p.title_it : p.title_en)?.toLowerCase().includes(s) ||
      (lang === 'it' ? p.description_it : p.description_en)?.toLowerCase().includes(s) ||
      p.author?.toLowerCase().includes(s)
    );
  }

  const sorted = filter === 'top'
    ? [...filtered].sort((a, b) => {
      const ra = parseFloat(a.rating) || 0;
      const rb = parseFloat(b.rating) || 0;
      return rb - ra;
    })
    : filtered;

  return (
    <div className="p-4 md:p-8 flex flex-col lg:flex-row gap-8">
      <div className="flex-1 flex flex-col gap-8 max-w-4xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b-2 border-primary/10 pb-6 gap-6">
          <div>
            <h2 className="font-headline text-5xl md:text-7xl font-black uppercase tracking-tighter mb-2">
              {t('feed.title')}
            </h2>
            <p className="font-label font-bold text-secondary uppercase tracking-widest text-sm">
              {t('feed.subtitle')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">search</span>
              <input type="text" placeholder={t('common.search')} value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface border-2 border-primary/10 py-3 pl-10 pr-4 font-label font-bold focus:border-secondary transition-all shadow-sm" />
            </div>
            <div className="flex bg-primary-container p-1 border-2 border-primary/5">
              <button onClick={() => setFilter('latest')}
                className={`font-label font-bold px-6 py-2 transition-all duration-300 ${filter === 'latest' ? 'bg-primary text-on-primary shadow-lg' : 'text-primary/60 hover:text-primary'}`}>
                {t('feed.latest')}
              </button>
              <button onClick={() => setFilter('top')}
                className={`font-label font-bold px-6 py-2 transition-all duration-300 ${filter === 'top' ? 'bg-primary text-on-primary shadow-lg' : 'text-primary/60 hover:text-primary'}`}>
                {t('feed.topRated')}
              </button>
            </div>
          </div>
        </div>

        <CreatePost t={t} onCreated={fetchUserPosts} />

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-surface-bright border-4 border-primary p-8 text-center shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <p className="font-headline text-xl font-bold uppercase">{t('common.noResults')}</p>
          </div>
        ) : (
          sorted.map((post) => (
            <FeedPost key={post.id} post={post} lang={lang} t={t} isAdmin={isAdmin}
              onModAction={handleModAction} onEdit={setEditPost} />
          ))
        )}
      </div>

      <EditPostModal post={editPost} open={!!editPost} onClose={() => setEditPost(null)} t={t} onSaved={fetchUserPosts} />
    </div>
  );
}