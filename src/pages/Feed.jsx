import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
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
  const { comments, loading, addComment } = useComments(postId);

  if (!show) return null;

  return (
    <div className="mt-4 pt-4 border-t border-primary/5 animate-subtle-fade">
      {!loading && (
        <CommentForm postId={postId} onCommentSubmitted={(c) => { addComment(c); onToggle(); }} />
      )}
      <div className="mt-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <p className="font-label text-sm text-primary/50">{t('common.loading') || 'Loading...'}</p>
        ) : (
          <CommentList comments={comments} />
        )}
      </div>
    </div>
  );
}

function FeedPost({ post, lang, t }) {
  const [showComments, setShowComments] = useState(false);

  return (
    <article className="bg-surface-bright border-2 border-primary/10 shadow-xl p-0 flex flex-col md:flex-row group hover:border-primary/40 transition-all duration-500 overflow-hidden">
      <div className="w-full md:w-2/5 relative overflow-hidden bg-primary aspect-square md:aspect-auto">
        <img 
          alt={lang === 'it' ? post.title_it : post.title_en} 
          className="w-full h-full object-cover mix-blend-luminosity opacity-80 group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out" 
          src={post.img} 
          loading="lazy" 
        />
        <div className="absolute top-4 left-4 bg-primary text-on-primary font-headline font-black px-3 py-1 border border-on-primary/20 backdrop-blur-md bg-opacity-80">
          {post.id}
        </div>
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
                {post.author} &bull; {post.time} {t('common.hrsAgo')?.toUpperCase() || 'HRS AGO'}
              </p>
            </div>
          </div>
          <div className="bg-primary text-on-primary font-headline font-black text-xl px-4 py-2 border-b-4 border-secondary">
            {post.rating}
          </div>
        </div>
        
        <p className="font-body text-lg leading-relaxed mb-6 font-medium text-primary/80">
          {lang === 'it' ? post.description_it : post.description_en}
        </p>

        <div className="mt-auto">
          <SocialActions fires={post.fires} onCommentClick={() => setShowComments(!showComments)} />
          <PostComments postId={post.id} show={showComments} onToggle={() => setShowComments(false)} />
        </div>
      </div>
    </article>
  );
}

function CreatePost() {
  const { t } = useI18n();
  return (
    <div className="bg-surface border-2 border-primary/5 p-6 shadow-xl flex items-center gap-6 group cursor-pointer hover:border-secondary/30 transition-all duration-500 mb-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
      <div className="relative w-14 h-14 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-lg group-hover:bg-secondary group-hover:rotate-12 transition-all duration-500">
        <span className="material-symbols-outlined text-2xl">add_a_photo</span>
      </div>
      <div className="relative flex-1">
        <p className="font-headline font-bold text-2xl text-primary/30 group-hover:text-primary transition-colors duration-300">
          {t('feed.whatsNew') || 'Share your pizza discovery...'}
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
  );
}

export default function Feed() {
  const [filter, setFilter] = useState('latest');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useI18n();

  useEffect(() => {
    let isMounted = true;
    fetch('/feed-data.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(data => {
        if (isMounted) setPosts(data);
      })
      .catch(() => {
        if (isMounted) setPosts(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
      return () => { isMounted = false; };
  }, []);

  const display = posts || FALLBACK;

  let filtered = display;
  if (search.trim()) {
    const s = search.toLowerCase();
    filtered = filtered.filter(p => 
      (lang === 'it' ? p.title_it : p.title_en)?.toLowerCase().includes(s) ||
      (lang === 'it' ? p.description_it : p.description_en)?.toLowerCase().includes(s) ||
      p.author?.toLowerCase().includes(s)
    );
  }

  const sorted = filter === 'top'
    ? [...filtered].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
    : filtered;

  return (
    <div className="p-4 md:p-8 flex flex-col lg:flex-row gap-8">
      <div className="flex-1 flex flex-col gap-8 max-w-4xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b-2 border-primary/10 pb-6 gap-6">
          <div>
            <h2 className="font-headline text-5xl md:text-7xl font-black uppercase tracking-tighter mb-2">
              {t('feed.title') || 'FEED'}
            </h2>
            <p className="font-label font-bold text-secondary uppercase tracking-widest text-sm">
              {t('feed.subtitle') || 'Live Pizzeria Analytics & Intel'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">search</span>
              <input
                type="text"
                placeholder={t('common.search') || 'Search the Peninsula...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface border-2 border-primary/10 py-3 pl-10 pr-4 font-label font-bold focus:border-secondary transition-all shadow-sm"
              />
            </div>
            <div className="flex bg-primary-container p-1 border-2 border-primary/5">
              <button 
                onClick={() => setFilter('latest')} 
                className={`font-label font-bold px-6 py-2 transition-all duration-300 ${filter === 'latest' ? 'bg-primary text-on-primary shadow-lg' : 'text-primary/60 hover:text-primary'}`}
              >
                {t('feed.latest') || 'LATEST'}
              </button>
              <button 
                onClick={() => setFilter('top')} 
                className={`font-label font-bold px-6 py-2 transition-all duration-300 ${filter === 'top' ? 'bg-primary text-on-primary shadow-lg' : 'text-primary/60 hover:text-primary'}`}
              >
                {t('feed.topRated') || 'TOP'}
              </button>
            </div>
          </div>
        </div>

        <CreatePost />

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-surface-bright border-4 border-primary p-8 text-center shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <p className="font-headline text-xl font-bold uppercase">{t('common.noResults') || 'No results found'}</p>
          </div>
        ) : (
          sorted.map((post) => (
            <FeedPost key={post.id} post={post} lang={lang} t={t} />
          ))
        )}
      </div>

    </div>
  );
}
