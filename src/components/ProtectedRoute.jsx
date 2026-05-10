import { useState, useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { checkAuth } from '../services/authService';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const user = await checkAuth();
        if (!cancelled) {
          if (user && user.role === 'admin') {
            setAuthenticated(true);
          } else {
            navigate('/login', { replace: true });
          }
        }
      } catch {
        if (!cancelled) navigate('/login', { replace: true });
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [navigate]);

  if (checking) return <LoadingSpinner fullScreen />;

  if (!authenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
