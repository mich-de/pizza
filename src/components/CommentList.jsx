import { useI18n } from '../i18n/I18nContext';
import { useDateTime } from '../prefs/DateTimeContext';

export default function CommentList({ comments }) {
  const { t } = useI18n();
  const { formatRelative } = useDateTime();

  if (!comments || comments.length === 0) {
    return (
      <div className="border border-outline-variant rounded-sm px-4 py-6 text-center bg-surface">
        <p className="font-label font-medium text-on-surface-variant text-sm">
          {t('comments.noComments')}
        </p>
      </div>
    );
  }

  /* Prima si contavano i giorni all'infinito: dopo un mese diceva «43 giorni
     fa», che nessuno riconverte a mente in una data. Oltre la settimana ora
     scrive la data vera, nel fuso e nel formato scelti in Impostazioni. */
  const formatDate = (iso) => formatRelative(iso, {
    justNow: t('common.justNow'),
    minsAgo: t('common.minsAgo'),
    hrsAgo: t('common.hrsAgo'),
    daysAgo: t('common.daysAgo'),
  });

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
              {/* Il prezzo proposto qualifica il commento: badge, non flap —
                  il flap della scheda e' gia' altrove. */}
              <span className="badge badge-success">
                <span className="material-symbols-outlined text-sm">payments</span>
                {t('comments.proposalLabel')}
                <span className="font-mono tabular-nums">€{c.proposedPrice.toFixed(2)}</span>
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
