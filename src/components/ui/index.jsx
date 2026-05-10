export function StatCard({ title, value, icon, color = 'primary', className = '', subtitle }) {
  const colorMap = {
    primary: { bg: 'bg-surface', border: 'border-primary', text: 'text-primary', iconText: 'text-primary', badge: 'bg-primary/10' },
    secondary: { bg: 'bg-secondary', border: 'border-secondary', text: 'text-on-secondary', iconText: 'text-on-secondary/80', badge: 'bg-on-secondary/10' },
    tertiary: { bg: 'bg-tertiary', border: 'border-tertiary', text: 'text-on-tertiary', iconText: 'text-on-tertiary/80', badge: 'bg-on-tertiary/10' },
    primaryContainer: { bg: 'bg-primary-container', border: 'border-primary/30', text: 'text-on-primary-container', iconText: 'text-primary', badge: 'bg-primary/10' },
  };
  const c = colorMap[color] || colorMap.primary;

  return (
    <div className={`${c.bg} border ${c.border} rounded-sm ${className}`}>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className={`font-label text-[11px] font-semibold uppercase tracking-wider ${c.text} opacity-70 mb-1`}>
              {title}
            </div>
            <div className={`text-3xl font-display font-bold tracking-tight ${c.text}`}>{value}</div>
            {subtitle && (
              <div className={`font-label text-xs mt-1 ${c.text} opacity-60`}>{subtitle}</div>
            )}
          </div>
          {icon && (
            <span className={`material-symbols-outlined text-4xl ${c.iconText} opacity-60`}>{icon}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function Card({ children, className = '', variant = 'default' }) {
  const variants = {
    default: 'bg-surface border border-outline-variant rounded-sm',
    primary: 'bg-primary text-on-primary border border-primary rounded-sm',
    container: 'bg-primary-container border border-primary/30 rounded-sm',
    secondary: 'bg-secondary text-on-secondary border border-secondary rounded-sm',
    tertiary: 'bg-tertiary text-on-tertiary border border-tertiary rounded-sm',
    surface: 'bg-surface border border-outline-variant rounded-sm',
  };

  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    tertiary: 'bg-tertiary/10 text-tertiary',
    error: 'bg-error/10 text-error',
  };

  return (
    <span className={`inline-block px-2.5 py-0.5 font-label font-semibold text-[11px] uppercase tracking-wider rounded-sm ${colors[color] || colors.primary}`}>
      {children}
    </span>
  );
}

export function BrutalistButton({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) {
  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-primary-fixed-dim active:bg-primary-fixed-dim',
    secondary: 'bg-secondary text-on-secondary hover:opacity-90 active:opacity-80',
    surface: 'bg-surface text-primary border border-outline-variant hover:bg-surface-variant active:bg-surface-dim',
    error: 'bg-error text-on-error hover:opacity-90 active:opacity-80',
  };
  const base = 'font-label font-semibold text-sm tracking-wider uppercase px-5 py-2.5 transition-all duration-150 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-8 border-b border-outline-variant pb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight leading-[1.1] text-primary">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base font-body text-on-surface-variant mt-2 max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {children && <div className="flex gap-3 items-center flex-shrink-0">{children}</div>}
      </div>
    </header>
  );
}
