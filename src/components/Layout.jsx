import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar, { MobileDrawer } from './TopBar';

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="bg-background text-on-background font-body min-h-screen flex flex-col md:flex-row">
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <TopBar onMenuToggle={() => setDrawerOpen(true)} />
      <Sidebar />
      <main className="flex-1 md:ml-64 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
