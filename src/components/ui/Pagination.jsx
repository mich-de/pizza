/* Paginazione condivisa fra la tabella dei prezzi e quella di Esplora: era lo
   stesso blocco copiato due volte, e riscriverlo due volte in vocabolario
   Quadro Partenze avrebbe solo raddoppiato il punto in cui sbagliare.

   Sfogliare serve a comporre la richiesta, non a leggere il risultato: il
   blocco porta `no-print` e su carta sparisce. */
export default function Pagination({ page, setPage, totalPages, t, summary }) {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  const maxButtons = 5;
  const endPage = Math.min(totalPages, Math.max(0, page - 2) + maxButtons);
  const startPage = Math.max(0, endPage - maxButtons);
  for (let i = startPage; i < endPage; i++) pageNumbers.push(i);

  return (
    <div className="panel flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 no-print">
      <span className="font-label text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-on-surface-variant order-2 sm:order-1">
        {t('prices.page')} {page + 1} {t('prices.of')} {totalPages}
      </span>
      <div className="flex gap-1 order-1 sm:order-2">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="btn btn-ghost btn-sm"
        >
          &larr;
        </button>
        {pageNumbers.map((pageNum) => (
          <button
            key={`page-${pageNum}`}
            onClick={() => setPage(pageNum)}
            className={`btn btn-sm btn-icon ${pageNum === page ? 'btn-primary' : 'btn-ghost'}`}
          >
            {pageNum + 1}
          </button>
        ))}
        {totalPages > maxButtons && page < totalPages - 3 && (
          <span className="px-1 self-center font-display text-on-surface-variant">&hellip;</span>
        )}
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page === totalPages - 1}
          className="btn btn-ghost btn-sm"
        >
          &rarr;
        </button>
      </div>
      <span className="font-label text-[0.72rem] uppercase tracking-[0.08em] text-on-surface-variant order-3">
        {summary}
      </span>
    </div>
  );
}
