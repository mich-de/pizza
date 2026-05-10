import { useState, useEffect, useCallback } from 'react';

export function useComments(postId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/comments?postId=${encodeURIComponent(postId)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch comments');
        return res.json();
      })
      .then((data) => {
        setComments(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback((comment) => {
    setComments((prev) => [...prev, comment]);
  }, []);

  return { comments, loading, error, refetch: fetchComments, addComment };
}
