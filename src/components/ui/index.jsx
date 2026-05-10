export function StatCard({ title, value, icon, color = 'primary', className = '' }) {
  const colorMap = {
    primary: { bg: 'bg-surface-variant', border: 'border-primary', text: 'text-primary', iconText: 'text-primary' },
    secondary: { bg: 'bg-secondary-container', border: 'border-secondary', text: 'text-secondary', iconText: 'text-secondary' },
    tertiary: { bg: 'bg-tertiary-container', border: 'border-tertiary', text: 'text-tertiary', iconText: 'text-tertiary' },
    primaryContainer: { bg: 'bg-primary-container', border: 'border-primary', text: 'text-primary', iconText: 'text-primary' },
  };
  const c = colorMap[color] || colorMap.primary;

  return (
    <div className={`${c.bg} border-4 ${c.border} p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-sm font-black font-headline uppercase tracking-widest mb-1 ${c.text}`}>
            {title}
          </div>
          <div className={`text-4xl font-black font-headline ${c.text}`}>{value}</div>
        </div>
        {icon && (
          <span className={`material-symbols-outlined text-5xl ${c.iconText}`}>{icon}</span>
        )}
      </div>
    </div>
  );
}

export function Card({ children, className = '', variant = 'default' }) {
  const variants = {
    default: 'bg-surface-bright border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]',
    primary: 'bg-primary text-on-primary border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]',
    container: 'bg-primary-container border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]',
    secondary: 'bg-secondary text-on-tertiary border-4 border-primary shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]',
    tertiary: 'bg-tertiary-container border-4 border-tertiary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]',
    surface: 'bg-surface border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]',
  };

  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary text-on-primary border-primary',
    secondary: 'bg-secondary text-on-secondary border-secondary',
    tertiary: 'bg-tertiary text-on-tertiary border-tertiary',
    container: 'bg-primary-container text-primary border-primary',
    surface: 'bg-surface text-primary border-primary',
    error: 'bg-error text-on-error border-error',
  };

  return (
    <span className={`inline-block px-3 py-1 font-label font-bold uppercase text-xs border-2 ${colors[color]}`}>
      {children}
    </span>
  );
}

export function BrutalistButton({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) {
  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container',
    secondary: 'bg-secondary text-on-secondary hover:bg-primary hover:text-on-primary',
    surface: 'bg-surface text-primary hover:bg-primary hover:text-on-primary',
    error: 'bg-error text-on-error hover:bg-primary hover:text-on-primary',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`font-headline font-bold uppercase py-3 px-6 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-colors ${variants[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:translate-x-1 active:translate-y-1 active:shadow-none'} ${className}`}
    >
      {children}
    </button>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-8 border-b-4 border-primary pb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase leading-none text-primary">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg font-bold text-on-surface-variant mt-3 max-w-xl">
              {subtitle}
            </p>
          )}
        </div>
        {children && <div className="flex gap-4 items-center">{children}</div>}
      </div>
    </header>
  );
}
