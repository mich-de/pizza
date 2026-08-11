import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import LoadingSpinner from '../components/LoadingSpinner';

const API_BASE = globalThis.process?.env?.VITE_API_BASE || '';

async function fetchWithAuth(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (res.status === 401) {
    try {
      const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (refreshRes.ok) {
        return fetch(`${API_BASE}${url}`, {
          ...options,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...options.headers },
        });
      }
    } catch (e) { console.error(e); }
    throw new Error('SESSION_EXPIRED');
  }
  return res;
}

export default function AdminProposals({ onDataChange }) {
  const { t, lang } = useI18n();
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

  const fetchCSRF = async () => {
    const res = await fetch(`${API_BASE}/api/csrf-token`, { credentials: 'include' });
    const data = await res.json();
    return data.csrfToken;
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

  return (
    <div className="w-full">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] font-headline font-bold uppercase px-6 py-3 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] ${toast.isError ? 'bg-secondary text-on-tertiary' : 'bg-primary text-on-primary'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-8 border-b-4 border-primary pb-4">
        <div>
          <h1 className="font-headline font-black text-3xl uppercase text-primary">{t('nav.approvals')}</h1>
          <p className="font-body text-on-surface-variant mt-1">
            {t('admin.proposalsSummary', { proposals: proposals.length, comments: pendingComments.length, posts: pendingFeedPosts.length })}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-surface text-primary font-label font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors"
        >
          <span className="material-symbols-outlined">refresh</span> {t('admin.refresh')}
        </button>
      </div>

      {error && (
        <div className="bg-error-container border-2 border-error p-6 text-center mb-6">
          <p className="font-label font-bold text-on-error-container">{error}</p>
        </div>
      )}

      {pendingComments.length > 0 && (
        <section className="mb-10">
          <h2 className="font-headline font-black text-xl uppercase text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">chat_bubble</span>
            {t('admin.commentsPendingTitle')} ({pendingComments.length})
          </h2>
          <div className="space-y-3">
            {pendingComments.map(c => (
              <div key={c.id} className="bg-surface border-2 border-primary p-4 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] relative">
                {confirmAction?.type === 'comment' && confirmAction.id === c.id && (
                  <div className="absolute inset-0 bg-surface/95 border-2 border-primary p-4 flex flex-col items-center justify-center z-10">
                    <p className="font-headline font-bold text-sm text-primary mb-3">
                      {t('admin.confirmPrompt', { action: confirmAction.action === 'approve' ? t('admin.confirmApprove') : t('admin.confirmReject'), item: 'commento' })}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmAction.action === 'approve' ? handleApproveComment(c.id) : handleRejectComment(c.id)}
                        className={`font-label font-bold uppercase py-2 px-4 border-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] text-sm ${confirmAction.action === 'approve' ? 'bg-tertiary text-on-tertiary border-primary' : 'bg-error text-on-error border-error'}`}
                      >
                        {t('common.confirm')}
                      </button>
                      <button onClick={() => setConfirmAction(null)} className="bg-surface text-primary font-label font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] text-sm">
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-headline font-bold text-sm text-primary">{c.author}</span>
                      <span className="text-xs text-on-surface-variant">{new Date(c.createdAt).toLocaleString(lang === 'it' ? 'it-IT' : 'en-US')}</span>
                    </div>
                    <p className="font-body text-sm text-on-surface">{c.content}</p>
                    <p className="text-xs text-on-surface-variant mt-1">Post: {c.postId}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setConfirmAction({ type: 'comment', id: c.id, action: 'approve' })}
                      className="bg-tertiary text-on-tertiary font-label font-bold uppercase py-2 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-tertiary-container transition-colors text-xs"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span> {t('admin.publish')}
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'comment', id: c.id, action: 'reject' })}
                      className="bg-error text-on-error font-label font-bold uppercase py-2 px-3 border-2 border-error shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors text-xs"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span> {t('admin.hide')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-headline font-black text-xl uppercase text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">edit_note</span>
          {t('admin.proposalsTitle')} ({proposals.length})
        </h2>

        {proposals.length === 0 && (
          <div className="bg-surface-variant border-2 border-primary p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-primary/30">task_alt</span>
            <p className="font-headline font-black text-2xl text-primary mt-4">{t('admin.noProposals')}</p>
            <p className="font-body text-on-surface-variant mt-2">{t('admin.noProposalsDesc')}</p>
          </div>
        )}

        <div className="space-y-4">
          {proposals.map(p => (
            <div key={p.id} className="bg-surface border-2 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] relative">
              {confirmAction?.type === 'proposal' && confirmAction.id === p.id && (
                <div className="absolute inset-0 bg-surface/95 border-2 border-primary p-4 flex flex-col items-center justify-center z-10">
                  <p className="font-headline font-bold text-sm text-primary mb-3">
                    {t('admin.confirmPrompt', { action: confirmAction.action === 'approve' ? t('admin.confirmApprove') : t('admin.confirmReject'), item: 'proposta' })}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmAction.action === 'approve' ? handleApprovePrice(p) : handleRejectProposal(p.id)}
                      disabled={saving}
                      className={`font-label font-bold uppercase py-2 px-4 border-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] text-sm disabled:opacity-50 ${confirmAction.action === 'approve' ? 'bg-tertiary text-on-tertiary border-primary' : 'bg-error text-on-error border-error'}`}
                    >
                      {saving ? (t('admin.saving')) : t('common.confirm')}
                    </button>
                    <button onClick={() => setConfirmAction(null)} className="bg-surface text-primary font-label font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] text-sm">
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-headline font-bold text-lg text-primary mb-1">{getVenueName(p.pizzeriaId)}</h3>
                  <p className="text-xs text-on-surface-variant mb-2">{p.author} · {new Date(p.createdAt).toLocaleString(lang === 'it' ? 'it-IT' : 'en-US')}</p>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs font-black font-headline uppercase text-on-surface-variant">{t('admin.current')}</p>
                      <p className="font-headline font-bold text-lg text-on-surface-variant">€{p.currentPrice?.toFixed(2) || '---'}</p>
                    </div>
                    <span className="material-symbols-outlined text-2xl text-secondary">arrow_forward</span>
                    <div>
                      <p className="text-xs font-black font-headline uppercase text-primary">{t('admin.proposed')}</p>
                      <p className="font-headline font-bold text-lg text-primary">€{p.proposedPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black font-headline uppercase text-tertiary">Δ</p>
                      <p className={`font-headline font-bold text-lg ${(p.proposedPrice - (p.currentPrice || 0)) > 0 ? 'text-secondary' : 'text-tertiary'}`}>
                        {(p.proposedPrice - (p.currentPrice || 0)) > 0 ? '+' : ''}€{(p.proposedPrice - (p.currentPrice || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => setConfirmAction({ type: 'proposal', id: p.id, action: 'approve' })}
                    disabled={saving}
                    className="bg-tertiary text-on-tertiary font-label font-bold uppercase py-2 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-tertiary-container transition-colors text-xs disabled:opacity-50"
                  >
                      <span className="material-symbols-outlined text-sm">check_circle</span> {t('admin.publish')}
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'proposal', id: p.id, action: 'reject' })}
                      className="bg-error text-on-error font-label font-bold uppercase py-2 px-3 border-2 border-error shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors text-xs"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span> {t('admin.hide')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {pendingFeedPosts.length > 0 && (
        <section className="mb-10">
          <h2 className="font-headline font-black text-xl uppercase text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">add_a_photo</span>
            {t('admin.feedPostsTitle')} ({pendingFeedPosts.length})
          </h2>
          <div className="space-y-3">
            {pendingFeedPosts.map(p => (
              <div key={p.id} className="bg-surface border-2 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] relative">
                {confirmAction?.type === 'feedPost' && confirmAction.id === p.id && (
                  <div className="absolute inset-0 bg-surface/95 border-2 border-primary p-4 flex flex-col items-center justify-center z-10">
                    <p className="font-headline font-bold text-sm text-primary mb-3">
                      {t('admin.confirmPrompt', { action: confirmAction.action === 'approve' ? t('admin.confirmApprove') : t('admin.confirmReject'), item: 'post' })}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmAction.action === 'approve' ? handleApproveFeedPost(p.id) : handleRejectFeedPost(p.id)}
                        className={`font-label font-bold uppercase py-2 px-4 border-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] text-sm ${confirmAction.action === 'approve' ? 'bg-tertiary text-on-tertiary border-primary' : 'bg-error text-on-error border-error'}`}
                      >
                        {t('common.confirm')}
                      </button>
                      <button onClick={() => setConfirmAction(null)} className="bg-surface text-primary font-label font-bold uppercase py-2 px-4 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] text-sm">
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-headline font-bold text-sm text-primary">{p.author}</span>
                      <span className="text-xs text-on-surface-variant">{new Date(p.createdAt).toLocaleString(lang === 'it' ? 'it-IT' : 'en-US')}</span>
                    </div>
                    <h3 className="font-headline font-bold text-lg text-secondary mt-1">{p.title}</h3>
                    {p.description_it || p.description_en || p.description ? (
                      <p className="font-body text-sm text-on-surface mt-1">
                        {lang === 'it' ? (p.description_it || p.description) : (p.description_en || p.description)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setConfirmAction({ type: 'feedPost', id: p.id, action: 'approve' })}
                      className="bg-tertiary text-on-tertiary font-label font-bold uppercase py-2 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-tertiary-container transition-colors text-xs"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span> {t('admin.publishBtn')}
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'feedPost', id: p.id, action: 'reject' })}
                      className="bg-error text-on-error font-label font-bold uppercase py-2 px-3 border-2 border-error shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-error-container transition-colors text-xs"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span> {t('admin.hideBtn')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
