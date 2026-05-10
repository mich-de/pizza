import { useState } from 'react';

export default function SocialActions({ fires, onCommentClick }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likes, setLikes] = useState(parseInt(fires?.replace('K', '000')) || 0);

  const formatLikes = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Pizza Feed',
        text: 'Check out this awesome pizza!',
        url: window.location.href,
      });
    } else {
      alert('Share functionality simulated!');
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-4 border-t-2 border-primary/10 pt-4 mt-6">
      <div className="flex items-center bg-primary/5 p-1 rounded-full border border-primary/5 backdrop-blur-sm">
        <button 
          onClick={handleLike}
          className={`group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 transform active:scale-90 ${isLiked ? 'bg-secondary text-on-secondary shadow-lg shadow-secondary/20' : 'hover:bg-primary/5 text-primary/60 hover:text-primary'}`}
        >
          <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-125 ${isLiked ? 'fill-1' : ''}`} style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
            local_fire_department
          </span>
          <span className="font-label font-bold text-sm tracking-tighter">{formatLikes(likes)}</span>
        </button>

        <button 
          onClick={onCommentClick}
          className="group flex items-center gap-2 px-4 py-2 rounded-full text-primary/60 hover:text-tertiary hover:bg-tertiary/5 transition-all duration-300 transform active:scale-90"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:rotate-12">chat_bubble</span>
          <span className="font-label font-bold text-sm tracking-tighter uppercase hidden sm:inline">Comments</span>
        </button>

        <button 
          onClick={handleShare}
          className="group flex items-center gap-2 px-4 py-2 rounded-full text-primary/60 hover:text-primary hover:bg-primary/5 transition-all duration-300 transform active:scale-90"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1">share</span>
          <span className="font-label font-bold text-sm tracking-tighter uppercase hidden sm:inline">Share</span>
        </button>
      </div>

      <button 
        onClick={() => setIsSaved(!isSaved)}
        className={`ml-auto flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 transform active:scale-90 border border-primary/10 ${isSaved ? 'bg-tertiary text-on-tertiary shadow-lg shadow-tertiary/20' : 'bg-surface hover:bg-tertiary/5 text-primary/40 hover:text-tertiary hover:border-tertiary/30'}`}
      >
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>
          bookmark
        </span>
      </button>
    </div>
  );
}
