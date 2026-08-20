import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatAmount } from '../utils/formatAmount';
import { fetchWithAuth, fetchCSRF } from '../services/adminApi';
import { useDateTime } from '../prefs/DateTimeContext';

export default function AdminProposals({ onDataChange }) {
  const { t, lang } = useI18n();
  const { formatDateTime } = useDateTime();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [pendingComments, setPendingComments] = useState([]);
  const [pendingFeedPosts, setPendingFeedPosts] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };


  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/dashboard-stats');
      if (!res.ok) throw new Error(t('admin.toastLoadError'));
      const data = await res.json();
      
      setProposals(data.proposals || []);
      setPendingComments(data.pendingComments || []);
      setPendingFeedPosts(data.pendingFeedPosts || []);
      setVenues(data.venues || []);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        navigate('/login');
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, t]);

  const [didInit, setDidInit] = useState(false);
  if (!didInit) {
    setDidInit(true);
    fetchData();
  }

  const getVenueName = (id) => venues.find(v => v.id === id)?.name || id;

  const handleApprovePrice = async (proposal) => {
    setSaving(true);
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth('/api/admin/approve-price', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          pizzeriaId: proposal.pizzeriaId,
          proposedPrice: proposal.proposedPrice,
          author: proposal.author,
        }),
      });
      if (!res.ok) throw new Error(t('admin.toastApprovalError'));
      showToast(t('admin.toastPriceApproved'));
      fetchData();
      onDataChange?.();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
      setConfirmAction(null);
    }
  };

  const handleRejectProposal = async (id) => {
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth(`/api/admin/reject-proposal/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      if (!res.ok) throw new Error(t('admin.toastRejectError'));
      showToast(t('admin.toastProposalRejected'));
      fetchData();
      onDataChange?.();
    } catch (err) {
      showToast(err.message, true);
    }
    setConfirmAction(null);
  };

  const handleApproveComment = async (id) => {
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth(`/api/admin/approve-comment/${id}`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      if (!res.ok) throw new Error(t('admin.toastCommentApprovalError'));
      showToast(t('admin.toastCommentApproved'));
      fetchData();
      onDataChange?.();
    } catch (err) {
      showToast(err.message, true);
    }
    setConfirmAction(null);
  };

  const handleApproveFeedPost = async (id) => {
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth(`/api/admin/approve-feed-post/${id}`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      if (!res.ok) throw new Error(t('admin.toastApprovalError'));
      showToast(t('admin.toastPostApproved'));
      fetchData();
      onDataChange?.();
    } catch (err) {
      showToast(err.message, true);
    }
    setConfirmAction(null);
  };

  const handleRejectFeedPost = async (id) => {
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth(`/api/admin/reject-feed-post/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      if (!res.ok) throw new Error(t('admin.toastRejectError'));
      showToast(t('admin.toastPostRejected'));
      fetchData();
      onDataChange?.();
    } catch (err) {
      showToast(err.message, true);
    }
    setConfirmAction(null);
  };

  const handleRejectComment = async (id) => {
    try {
      const csrfToken = await fetchCSRF();
      const res = await fetchWithAuth(`/api/admin/reject-comment/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      if (!res.ok) throw new Error(t('admin.toastCommentRejectError'));
      showToast(t('admin.toastCommentRejected'));
      fetchData();
      onDataChange?.();
    } catch (err) {
      showToast(err.message, true);
    }
    setConfirmAction(null);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  // Data e ora nella forma scelta in Impostazioni, non in quella della macchina.
  const fmtDate = (d) => formatDateTime(d);

  return (
    <div className="w-full">
      {toast && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm bg-surface shadow-lg no-print">
          <div className={`alert ${toast.isError ? 'alert-error' : 'alert-success'}`}>
            <span className="material-symbols-outlined text-base leading-none">
              {toast.isError ? 'error' : 'check_circle'}
            </span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Vedi Admin: scheda dentro il Pannello, la testatina e' gia' sopra.
          Il pulsante di ricarica sta in fondo alla riga del titolo, dopo il
          filetto, e resta fuori di stampa perche' compone la richiesta. */}
      <div className="section-title">
        <h2 className="text-base">{t('nav.approvals')}</h2>
        <button onClick={fetchData} className="btn btn-ghost btn-sm no-print">
          <span className="material-symbols-outlined text-sm">refresh</span>
          {t('admin.refresh')}
        </button>
      </div>
      <p className="muted small mb-6">{t('admin.proposalsSubtitle')}</p>

      {error && (
        <div className="alert alert-error mb-6">
          <span className="material-symbols-outlined text-base leading-none">error</span>
          <span>{error}</span>
        </div>
      )}

      {pendingComments.length > 0 && (
        <section className="mb-10">
          <div className="section-title">
            <h2 className="text-base">{t('admin.commentsPendingTitle')}</h2>
            <span className="badge badge-ghost font-mono tabular-nums">{pendingComments.length}</span>
          </div>
          <div className="stack">
            {pendingComments.map(c => (
              <div key={c.id} className="tile relative">
                <ConfirmOverlay
                  open={confirmAction?.type === 'comment' && confirmAction.id === c.id}
                  action={confirmAction?.action}
                  item={t('admin.itemComment')}
                  onConfirm={() => confirmAction.action === 'approve' ? handleApproveComment(c.id) : handleRejectComment(c.id)}
                  onCancel={() => setConfirmAction(null)}
                  t={t}
                />
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[16rem]">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-display uppercase tracking-[0.04em] text-sm">{c.author}</span>
                      <span className="font-mono text-xs text-on-surface-variant">{fmtDate(c.createdAt)}</span>
                    </div>
                    <p className="font-body text-sm mt-1 mb-1">{c.content}</p>
                    <p className="font-mono text-xs text-on-surface-variant mb-0">Post: {c.postId}</p>
                  </div>
                  <ActionPair
                    onApprove={() => setConfirmAction({ type: 'comment', id: c.id, action: 'approve' })}
                    onReject={() => setConfirmAction({ type: 'comment', id: c.id, action: 'reject' })}
                    approveLabel={t('admin.publish')}
                    rejectLabel={t('admin.hide')}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <div className="section-title">
          <h2 className="text-base">{t('admin.proposalsTitle')}</h2>
          <span className="badge badge-ghost font-mono tabular-nums">{proposals.length}</span>
        </div>

        {proposals.length === 0 && (
          <div className="panel text-center py-12">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">task_alt</span>
            <h3 className="mt-3 mb-1">{t('admin.noProposals')}</h3>
            <p className="font-body text-sm text-on-surface-variant mb-0">{t('admin.noProposalsDesc')}</p>
          </div>
        )}

        <div className="stack">
          {proposals.map(p => {
            const diff = p.proposedPrice - (p.currentPrice || 0);
            return (
              <div key={p.id} className="tile relative">
                <ConfirmOverlay
                  open={confirmAction?.type === 'proposal' && confirmAction.id === p.id}
                  action={confirmAction?.action}
                  item={t('admin.itemProposal')}
                  busy={saving}
                  busyLabel={t('admin.saving')}
                  onConfirm={() => confirmAction.action === 'approve' ? handleApprovePrice(p) : handleRejectProposal(p.id)}
                  onCancel={() => setConfirmAction(null)}
                  t={t}
                />
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[16rem]">
                    <h3 className="mb-1">{getVenueName(p.pizzeriaId)}</h3>
                    <p className="font-mono text-xs text-on-surface-variant mb-3">{p.author} · {fmtDate(p.createdAt)}</p>
                    {/* Un solo flap per tessera: il prezzo proposto, cioe' il dato
                        su cui si decide. Attuale e delta restano in monospaziato. */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="font-mono tabular-nums text-on-surface-variant line-through">
                        &euro;{p.currentPrice != null ? formatAmount(p.currentPrice, lang) : '---'}
                      </span>
                      <span className="material-symbols-outlined text-base text-on-surface-variant">arrow_forward</span>
                      <span className="flap flap-lg">{formatAmount(p.proposedPrice, lang)}</span><span className="unit">EUR</span>
                      <span className="font-mono tabular-nums text-sm text-on-surface-variant">
                        Δ {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                      </span>
                    </div>
                    {/* La nota di chi segnala: sta qui, sotto il prezzo che
                        spiega, e non e' piu' un messaggio da approvare a
                        parte. Il filetto a sinistra la lega al dato senza
                        aprire un secondo riquadro. */}
                    {p.note && (
                      <p className="font-body text-sm text-on-surface-variant mt-3 mb-0 pl-3 border-l border-outline-variant">
                        {p.note}
                      </p>
                    )}
                  </div>
                  <ActionPair
                    disabled={saving}
                    onApprove={() => setConfirmAction({ type: 'proposal', id: p.id, action: 'approve' })}
                    onReject={() => setConfirmAction({ type: 'proposal', id: p.id, action: 'reject' })}
                    approveLabel={t('admin.publish')}
                    rejectLabel={t('admin.hide')}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {pendingFeedPosts.length > 0 && (
        <section className="mb-10">
          <div className="section-title">
            <h2 className="text-base">{t('admin.feedPostsTitle')}</h2>
            <span className="badge badge-ghost font-mono tabular-nums">{pendingFeedPosts.length}</span>
          </div>
          <div className="stack">
            {pendingFeedPosts.map(p => (
              <div key={p.id} className="tile relative">
                <ConfirmOverlay
                  open={confirmAction?.type === 'feedPost' && confirmAction.id === p.id}
                  action={confirmAction?.action}
                  item={t('admin.itemPost')}
                  onConfirm={() => confirmAction.action === 'approve' ? handleApproveFeedPost(p.id) : handleRejectFeedPost(p.id)}
                  onCancel={() => setConfirmAction(null)}
                  t={t}
                />
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[16rem]">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-display uppercase tracking-[0.04em] text-sm">{p.author}</span>
                      <span className="font-mono text-xs text-on-surface-variant">{fmtDate(p.createdAt)}</span>
                    </div>
                    <h3 className="mt-1 mb-1">{p.title}</h3>
                    {p.description_it || p.description_en || p.description ? (
                      <p className="font-body text-sm mb-0">
                        {lang === 'it' ? (p.description_it || p.description) : (p.description_en || p.description)}
                      </p>
                    ) : null}
                  </div>
                  <ActionPair
                    onApprove={() => setConfirmAction({ type: 'feedPost', id: p.id, action: 'approve' })}
                    onReject={() => setConfirmAction({ type: 'feedPost', id: p.id, action: 'reject' })}
                    approveLabel={t('admin.publishBtn')}
                    rejectLabel={t('admin.hideBtn')}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* Approva e rifiuta comparivano identici in tre punti: una sola coppia.
   Il rosso sta sul rifiuto perche' li' si toglie qualcosa. */
function ActionPair({ onApprove, onReject, approveLabel, rejectLabel, disabled }) {
  return (
    <div className="flex gap-2 shrink-0 no-print">
      <button onClick={onApprove} disabled={disabled} className="btn btn-primary btn-sm">
        <span className="material-symbols-outlined text-sm">check_circle</span>
        {approveLabel}
      </button>
      <button onClick={onReject} disabled={disabled} className="btn btn-secondary btn-sm">
        <span className="material-symbols-outlined text-sm">cancel</span>
        {rejectLabel}
      </button>
    </div>
  );
}

/* La conferma copre la tessera invece di aprire una finestra: si decide dove
   si sta guardando. Fondo pieno, non trasparente, altrimenti si legge doppio. */
function ConfirmOverlay({ open, action, item, onConfirm, onCancel, busy, busyLabel, t }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-10 bg-surface border border-outline-variant flex flex-col items-center justify-center gap-3 p-4 text-center no-print">
      <p className="font-display uppercase tracking-[0.06em] text-sm mb-0">
        {t('admin.confirmPrompt', {
          action: action === 'approve' ? t('admin.confirmApprove') : t('admin.confirmReject'),
          item,
        })}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={busy}
          className={`btn btn-sm ${action === 'approve' ? 'btn-primary' : 'btn-secondary'}`}
        >
          {busy ? busyLabel : t('common.confirm')}
        </button>
        <button onClick={onCancel} className="btn btn-ghost btn-sm">
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
