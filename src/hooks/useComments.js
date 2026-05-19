import { useState, useEffect, useCallback } from 'react';
import { silentFetch } from '../utils/silentFetch';

export function useComments(postId, enabled = true) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComments = useCallback(() => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    silentFetch(`/api/comments?postId=${encodeURIComponent(postId)}`)
      .then(async (res) => {
        const data = res.ok ? await res.json() : [];
        setComments(data || []);
        setLoading(false);
      });
  }, [postId, enabled]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback((comment) => {
    setComments((prev) => [...prev, comment]);
  }, []);

  return { comments, loading, error, refetch: fetchComments, addComment };
}
