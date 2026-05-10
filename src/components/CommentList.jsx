import { useI18n } from '../i18n/I18nContext';

export default function CommentList({ comments }) {
  const { t } = useI18n();

  if (!comments || comments.length === 0) {
    return (
      <div className="border-2 border-dashed border-primary/30 px-4 py-6 text-center">
        <p className="font-label font-bold text-primary/60 uppercase text-sm">
          {t('comments.noComments')}
        </p>
      </div>
    );
  }

  const formatDate = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return t('comments.justNow');
    if (mins < 60) return `${mins} ${t('common.hrsAgo').replace('ore', 'min')}`;
    if (hours < 24) return `${hours} ${t('common.hrsAgo')}`;
    return `${days} ${t('common.daysAgo')}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {comments.map((c) => (
        <div
          key={c.id}
          className="relative group bg-white/40 p-4 border border-primary/5 hover:border-primary/20 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline text-[10px] font-black">
                {c.author.substring(0, 2).toUpperCase()}
              </div>
              <span className="font-headline font-black uppercase text-xs tracking-tight">
                {c.author}
              </span>
            </div>
            <span className="font-label text-[10px] font-bold text-primary/30 uppercase tracking-tighter bg-primary/5 px-2 py-1">
              {formatDate(c.createdAt)}
            </span>
          </div>
          <p className="font-body text-sm leading-relaxed text-primary/80 pl-11">
            {c.content}
          </p>
          {c.proposedPrice && (
            <div className="mt-3 pl-11">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-black uppercase rounded-full">
                <span className="material-symbols-outlined text-[14px]">payments</span>
                Proposta: €{c.proposedPrice.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
