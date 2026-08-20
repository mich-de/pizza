import { useState } from 'react';
import { CHIP_ACTIVE } from '../config/uiTokens';

export default function SocialActions({ fires, onCommentClick, t }) {
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
    <div className="flex items-center gap-2 border-t border-outline-variant pt-4 mt-5">
      <div className="flex items-center bg-surface-variant border border-outline-variant rounded-sm overflow-hidden">
        <button 
          onClick={handleLike}
          className={`group flex items-center gap-1.5 px-3 py-1.5 transition-colors duration-150 border-r border-outline-variant ${isLiked ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface hover:text-primary'}`}
        >
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
            local_fire_department
          </span>
          <span className="font-label font-semibold text-xs">{formatLikes(likes)}</span>
        </button>

        <button 
          onClick={onCommentClick}
          className="group flex items-center gap-1.5 px-3 py-1.5 text-on-surface-variant hover:bg-surface hover:text-primary transition-colors duration-150 border-r border-outline-variant"
        >
          <span className="material-symbols-outlined text-lg">chat_bubble</span>
          <span className="font-label font-semibold text-xs uppercase hidden sm:inline">{t?.('common.comments')}</span>
        </button>

        <button 
          onClick={handleShare}
          className="group flex items-center gap-1.5 px-3 py-1.5 text-on-surface-variant hover:bg-surface hover:text-primary transition-colors duration-150"
        >
          <span className="material-symbols-outlined text-lg">share</span>
          <span className="font-label font-semibold text-xs uppercase hidden sm:inline">{t?.('common.share')}</span>
        </button>
      </div>

      <button 
        onClick={() => setIsSaved(!isSaved)}
        aria-pressed={isSaved}
        className={`btn btn-icon btn-sm ml-auto ${isSaved ? CHIP_ACTIVE : 'btn-ghost'}`}
      >
        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>
          bookmark
        </span>
      </button>
    </div>
  );
}
