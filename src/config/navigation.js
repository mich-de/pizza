export const navItems = [
  { to: '/', icon: 'analytics', labelKey: 'nav.analytics' },
  { to: '/events', icon: 'event', labelKey: 'nav.events' },
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

export const activeLinkClass = 'bg-primary/10 text-primary rounded-sm px-3 py-2.5 my-0.5 flex items-center gap-3 font-label font-medium text-sm transition-all';

export const inactiveLinkClass = 'text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-sm px-3 py-2.5 my-0.5 flex items-center gap-3 font-label font-medium text-sm transition-all';

export const activeLinkClassMobile = 'bg-primary/10 text-primary border-l-2 border-primary px-4 py-3 mx-2 my-0.5 flex items-center gap-3 font-label font-medium text-sm';

export const inactiveLinkClassMobile = 'text-on-surface-variant px-4 py-3 mx-2 my-0.5 flex items-center gap-3 font-label font-medium text-sm hover:text-primary hover:bg-surface-variant transition-colors';
