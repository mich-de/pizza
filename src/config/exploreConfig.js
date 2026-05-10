export const PLACEHOLDER_IMGS = [
  'https://picsum.photos/seed/pizza1/400/200',
  'https://picsum.photos/seed/pizza2/400/200',
  'https://picsum.photos/seed/pizza3/400/200',
];

export const CATEGORY_BADGE_COLORS = {
  traditional: 'bg-primary text-surface',
  gourmet: 'bg-tertiary text-on-tertiary',
  'wood-fired': 'bg-error text-on-error',
  restaurant: 'bg-secondary text-on-secondary',
};

export const PAGE_SIZE = 20;

export function priceTier(price, min, range) {
  if (range === 0) return 'mid';
  const ratio = (price - min) / range;
  if (ratio < 0.33) return 'cheap';
  if (ratio < 0.66) return 'mid';
  return 'expensive';
}

export function tierLabel(tier, t) {
  switch (tier) {
    case 'cheap': return '€';
    case 'mid': return '€€';
    case 'expensive': return '€€€';
  }
}

export function formatDate(iso, lang) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
