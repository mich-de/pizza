import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Feed = lazy(() => import('./pages/Feed'));
const Directory = lazy(() => import('./pages/Directory'));
const Prices = lazy(() => import('./pages/Prices'));
const Network = lazy(() => import('./pages/Network'));
const Explore = lazy(() => import('./pages/Explore'));
const Login = lazy(() => import('./pages/Login'));

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/prices" element={<Prices />} />
              <Route path="/network" element={<Network />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
