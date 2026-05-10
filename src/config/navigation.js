export const navItems = [
  { to: '/', icon: 'analytics', labelKey: 'nav.analytics' },
  { to: '/feed', icon: 'map', labelKey: 'nav.feed' },
  { to: '/explore', icon: 'storefront', labelKey: 'nav.directory' },
  { to: '/prices', icon: 'payments', labelKey: 'nav.prices' },
  { to: '/admin', icon: 'admin_panel_settings', labelKey: 'nav.admin' },
];

export const adminTabs = [
  { key: 'pizzerias', icon: 'store', labelKey: 'nav.admin' },
  { key: 'proposals', icon: 'fact_check', labelKey: 'nav.approvals' },
  { key: 'settings', icon: 'settings', labelKey: 'nav.settings' },
];

export const activeLinkClass = 'bg-primary-container text-primary border-2 border-primary my-1 mx-2 p-3 flex items-center gap-3 font-headline font-bold uppercase shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]';

export const inactiveLinkClass = 'text-primary p-3 my-1 mx-2 flex items-center gap-3 font-headline font-bold uppercase hover:bg-secondary hover:text-on-secondary transition-all hover:translate-x-1 duration-100';

export const activeLinkClassMobile = 'bg-primary-container text-primary border-2 border-primary my-1 mx-3 p-3 flex items-center gap-3 font-headline font-bold uppercase shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]';

export const inactiveLinkClassMobile = 'text-primary p-3 my-1 mx-3 flex items-center gap-3 font-headline font-bold uppercase hover:bg-secondary hover:text-on-secondary transition-all hover:translate-x-1 duration-100';
