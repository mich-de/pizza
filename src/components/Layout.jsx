import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar, { MobileDrawer } from './TopBar';
import Footer from './Footer';
import LegalBanner from './LegalBanner';

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    /* Nessun bg qui: il fondo avorio sta su <html> e la trama diagonale su
       body::before, a z-index negativo. Un colore pieno su questo contenitore
       li coprirebbe entrambi e il fondo tornerebbe una superficie piatta. */
    <div className="text-on-background font-body min-h-screen flex flex-col md:flex-row">
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <TopBar onMenuToggle={() => setDrawerOpen(true)} />
      <Sidebar />
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </main>
      <LegalBanner />
    </div>
  );
}
