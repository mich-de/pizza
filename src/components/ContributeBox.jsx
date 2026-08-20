import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import PriceProposalForm from './explore/PriceProposalForm';
import CommentForm from './CommentForm';

/* Due gesti diversi, due pulsanti diversi.
   Segnalare un prezzo e' consegnare un dato — un numero, con accanto una nota
   che lo spiega — e finisce nell'elenco delle proposte. Lasciare un commento
   e' scrivere a qualcuno, e finisce fra i messaggi. Prima erano lo stesso
   modulo con un campo prezzo in coda, e ogni segnalazione lasciava due righe
   da approvare per una cosa sola.

   Questo riquadro stava scritto due volte quasi uguale — in Esplora e nel
   dettaglio di Prezzi — e ora sta qui una volta sola. */
export default function ContributeBox({ pizzeriaId, pizzeriaName, currentPrice, priceLabel, className = '' }) {
  const { t } = useI18n();
  // null = chiuso; 'price' | 'comment' = quale dei due moduli e' aperto
  const [mode, setMode] = useState(null);

  const labelPrice = priceLabel || t('prices.reportWrongPrice');
  const labelComment = t('comments.leaveComment');

  return (
    /* Comporre una segnalazione non e' leggere un risultato: su carta sparisce. */
    <div className={`no-print ${className}`}>
      {mode === null ? (
        /* In colonna sotto i 40rem: due pulsanti affiancati su uno schermo
           stretto scendono sotto i 44px di lato utile e si sbagliano a premere. */
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={() => setMode('price')} className="btn btn-ghost flex-1">
            <span className="material-symbols-outlined text-base">edit_note</span>
            {labelPrice}
          </button>
          <button onClick={() => setMode('comment')} className="btn btn-ghost flex-1">
            <span className="material-symbols-outlined text-base">chat</span>
            {labelComment}
          </button>
        </div>
      ) : (
        <div>
          <div className="section-title">
            <h2 className="text-base">{mode === 'price' ? labelPrice : labelComment}</h2>
            <button onClick={() => setMode(null)} className="btn btn-ghost btn-sm">
              {t('common.cancel')}
            </button>
          </div>
          {mode === 'price' ? (
            <PriceProposalForm
              pizzeriaId={pizzeriaId}
              pizzeriaName={pizzeriaName}
              currentPrice={currentPrice}
              onSubmitted={() => setMode(null)}
            />
          ) : (
            <CommentForm postId={pizzeriaId} onCommentSubmitted={() => setMode(null)} />
          )}
        </div>
      )}
    </div>
  );
}
