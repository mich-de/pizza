import { useI18n } from '../i18n/I18nContext';

export default function CommentList({ comments }) {
  const { t } = useI18n();

  if (!comments || comments.length === 0) {
    return (
      <div className="border border-outline-variant rounded-sm px-4 py-6 text-center bg-surface">
        <p className="font-label font-medium text-on-surface-variant text-sm">
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

    if (mins < 1) return t('common.justNow');
    if (mins < 60) return `${mins} ${t('common.minsAgo')}`;
    if (hours < 24) return `${hours} ${t('common.hrsAgo')}`;
    return `${days} ${t('common.daysAgo')}`;
  };

  return (
    <div className="flex flex-col gap-3">
      {comments.map((c) => (
        <div
          key={c.id}
          className="bg-surface border border-outline-variant rounded-sm p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-sm flex items-center justify-center font-label font-bold text-xs">
                {c.author.substring(0, 2).toUpperCase()}
              </div>
              <span className="font-label font-semibold text-xs text-primary">
                {c.author}
              </span>
            </div>
            <span className="font-label text-[10px] font-medium text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded-sm">
              {formatDate(c.createdAt)}
            </span>
          </div>
          <p className="font-body text-sm leading-relaxed pl-10 text-on-surface">
            {c.content}
          </p>
          {c.proposedPrice && (
            <div className="mt-2 pl-10">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-tertiary/10 text-tertiary text-[11px] font-semibold rounded-sm">
                <span className="material-symbols-outlined text-sm">payments</span>
                {t('comments.proposalLabel')} €{c.proposedPrice.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
