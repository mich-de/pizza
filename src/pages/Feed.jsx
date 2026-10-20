import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { checkAuth } from '../services/authService';
import { useComments } from '../hooks/useComments';
import CommentForm from '../components/CommentForm';
import CommentList from '../components/CommentList';
import SocialActions from '../components/SocialActions';
import LoadingSpinner from '../components/LoadingSpinner';
import StatTile from '../components/StatTile';
import { CHIP_ACTIVE } from '../config/uiTokens';
import { PageHeader } from '../components/ui';

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
    <div className="mt-4 pt-4 border-t border-outline-variant">
      {/* Il modulo compone, la lista si legge: solo il primo esce dalla stampa. */}
      {!loading && (
        <div className="no-print">
          <CommentForm postId={postId} onCommentSubmitted={(c) => { addComment(c); onToggle(); }} />
        </div>
      )}
      <div className="mt-4 max-h-60 overflow-y-auto pr-2">
        {loading ? (
          <p className="font-body text-sm text-on-surface-variant">{t('common.loading')}</p>
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 pt-[20vh] no-print" onClick={onClose}>
      <div className="card card-accent w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <span className="eyebrow">{t('feed.title')}</span>
            <h2 className="mt-1 mb-0">{t('feed.editPost')}</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon shrink-0" aria-label={t('common.close')}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="alert alert-error mb-4">
              <span className="material-symbols-outlined text-base leading-none">error</span>
              <span>{error}</span>
            </div>
          )}
          <label className="field">
            <span>{t('feed.postTitle')} *</span>
            <input type="text" className="w-full" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
          </label>
          <label className="field">
            <span>{t('feed.postDescription')}</span>
            <textarea className="w-full" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} />
          </label>
          <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
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
    <article className="card">
      <div className="flex flex-col md:flex-row md:gap-5">
        {post.img && (
          <div className="w-full md:w-44 lg:w-52 shrink-0 mb-4 md:mb-0 overflow-hidden border border-outline-variant">
            <img
              alt={lang === 'it' ? post.title_it : post.title_en}
              className="w-full h-40 md:h-full object-cover"
              src={post.img}
              loading="lazy"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-base text-on-surface-variant shrink-0">person</span>
              <span className="font-label text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant truncate">
                {post.author}
              </span>
              {post._isUserPost && <span className="badge badge-ghost">{t('feed.shared')}</span>}
            </div>
            <span className="font-mono tabular-nums text-xs text-on-surface-variant shrink-0">
              {post.time}{post._isUserPost ? '' : t('common.hrsAgo')}
            </span>
          </div>

          <div className="flex items-start gap-5">
            {/* Il voto e' il solo flap della tessera: l'identificativo sopra e i
                voti sotto restano in monospaziato, altrimenti competono. */}
            <div className="hidden md:block text-center shrink-0 w-16">
              <div className="font-mono tabular-nums text-xs text-on-surface-variant mb-1">{post.id}</div>
              <span className="flap flap-lg">{post.rating?.split('/')[0] || '--'}</span>
              <div className="font-label text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mt-1.5">
                {t('common.votes')}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="mb-2">{lang === 'it' ? post.title_it : post.title_en}</h3>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed line-clamp-3 mb-0">
                {lang === 'it' ? post.description_it : post.description_en}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-outline-variant">
                <SocialActions fires={post.fires} onCommentClick={() => setShowComments(!showComments)} t={t} />
              </div>

              {isAdmin && post._isUserPost && (
                /* Il pannello di moderazione compone una richiesta: fuori dalla stampa.
                   Il rosso sta solo sull'eliminazione, dove si toglie qualcosa. */
                <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-outline-variant no-print">
                  <span className="font-label text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mr-1">
                    {t('feed.adminLabel')}
                  </span>
                  <button onClick={() => onModAction?.(postId, 'approve')} className="btn btn-primary btn-sm">
                    <span className="material-symbols-outlined text-sm">check_circle</span> {t('feed.approve')}
                  </button>
                  <button onClick={() => onEdit?.(post)} className="btn btn-ghost btn-sm">
                    <span className="material-symbols-outlined text-sm">edit</span> {t('feed.edit')}
                  </button>
                  <button onClick={() => onModAction?.(postId, 'reject')} className="btn btn-secondary btn-sm">
                    <span className="material-symbols-outlined text-sm">delete</span> {t('feed.delete')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <PostComments postId={post.id} show={showComments} onToggle={() => setShowComments(false)} />
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
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/55 p-4 pt-[10vh] overflow-y-auto no-print" onClick={onClose}>
      <div className="card card-accent w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <span className="eyebrow">{t('feed.title')}</span>
            <h2 className="mt-1 mb-0">{t('feed.createPostTitle')}</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon shrink-0" aria-label={t('common.close')}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">task_alt</span>
            <h3 className="mb-2">{t('feed.postSubmitted')}</h3>
            <p className="font-body text-on-surface-variant mb-6">{t('feed.postPendingApproval')}</p>
            <button onClick={onClose} className="btn btn-primary">{t('common.close')}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="alert alert-error mb-4">
                <span className="material-symbols-outlined text-base leading-none">error</span>
                <span>{error}</span>
              </div>
            )}

            <label className="field">
              <span>{t('feed.yourName')} *</span>
              <input type="text" className="w-full" value={author} onChange={(e) => setAuthor(e.target.value)}
                maxLength={30} placeholder={t('comments.namePlaceholder')} required />
              <small className="block text-right font-mono tabular-nums text-[0.68rem] text-on-surface-variant">{author.length}/30</small>
            </label>

            <label className="field">
              <span>{t('feed.postTitle')} *</span>
              <input type="text" className="w-full" value={title} onChange={(e) => setTitle(e.target.value)}
                maxLength={100} placeholder={t('feed.postTitlePlaceholder')} required />
              <small className="block text-right font-mono tabular-nums text-[0.68rem] text-on-surface-variant">{title.length}/100</small>
            </label>

            <label className="field">
              <span>{t('feed.postDescription')}</span>
              <textarea className="w-full" value={description} onChange={(e) => setDescription(e.target.value)}
                maxLength={500} rows={3} placeholder={t('feed.postDescriptionPlaceholder')} />
              <small className="block text-right font-mono tabular-nums text-[0.68rem] text-on-surface-variant">{description.length}/500</small>
            </label>

            {/* Il quesito e' un dato da leggere, non un campo: e' l'unico flap
                del modulo, la risposta accanto resta un campo normale. */}
            <div className="panel mb-5">
              <div className="section-title">{t('comments.verifyHuman')}</div>
              <div className="flex items-center gap-3 flex-wrap">
                {captcha
                  ? <span className="flap flap-lg">{captcha.question}</span>
                  : <span className="font-body text-sm text-on-surface-variant">{t('common.loading')}</span>}
                <input type="number" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="w-20 text-center font-mono tabular-nums text-lg" placeholder="?" required />
                <button type="button" onClick={fetchCaptcha} className="btn btn-ghost btn-icon btn-sm" tabIndex={-1}
                  aria-label={t('comments.verifyHuman')}>
                  <span className="material-symbols-outlined text-sm">refresh</span>
                </button>
              </div>
            </div>

            <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }} aria-hidden="true" />

            <button type="submit" disabled={submitting || !captcha} className="btn btn-primary btn-block">
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
      {/* Un pulsante largo, non una finta casella di testo: apre un modulo,
          non raccoglie nulla qui. Fuori dalla stampa come il modulo stesso. */}
      <button type="button" onClick={() => setModalOpen(true)} className="btn btn-primary btn-block btn-lg mb-10 no-print">
        <span className="material-symbols-outlined">add_a_photo</span>
        {t('feed.whatsNew')}
      </button>
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

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="container fade-in">
      <PageHeader
        eyebrow={t('common.peninsula')}
        title={t('feed.title')}
        subtitle={t('feed.subtitle')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <StatTile icon="rss_feed" label={t('feed.totalPosts')} value={allPosts.length} />
        <StatTile icon="star" label={t('feed.topRatedTitle')} value={allPosts.filter(p => parseFloat(p.rating) >= 9).length} />
        <StatTile icon="group" label={t('feed.userContributions')} value={userPosts.length} />
      </div>

      {/* Ricerca e ordinamento compongono la richiesta: fuori dalla stampa. */}
      <div className="panel mb-10 no-print">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <label className="field flex-1 mb-0">
            <span>{t('common.search')}</span>
            <input className="w-full" placeholder={t('feed.searchPlaceholder')}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <div className="mb-0">
            <div className="font-label text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-on-surface-variant mb-1.5">
              {t('common.sortBy')}
            </div>
            {/* Due palette accostate: quella scelta e' nera, non ambra. */}
            <div className="chips">
              {[['latest', t('feed.latest')], ['top', t('feed.topRated')]].map(([key, label]) => (
                <button key={key} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key}
                  className={`chip font-display uppercase tracking-[0.06em] px-4 py-2 transition-colors ${filter === key ? CHIP_ACTIVE : 'hover:border-outline'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        <CreatePost t={t} onCreated={fetchUserPosts} />

        {sorted.length === 0 ? (
          <div className="panel text-center py-16">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">rss_feed</span>
            <p className="font-body text-on-surface-variant mt-3 mb-0">{t('feed.noResults')}</p>
          </div>
        ) : (
          <div className="stack">
            {sorted.map((post) => (
              <FeedPost key={post.id} post={post} lang={lang} t={t} isAdmin={isAdmin}
                onModAction={handleModAction} onEdit={setEditPost} />
            ))}
          </div>
        )}
      </div>

      <EditPostModal post={editPost} open={!!editPost} onClose={() => setEditPost(null)} t={t} onSaved={fetchUserPosts} />
    </div>
  );
}
