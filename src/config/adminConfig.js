export const CATEGORIES = ['traditional', 'gourmet', 'wood-fired'];

export const CITY_IDS = [
  'sorrento',
  'piano',
  'meta',
  'vico-equense',
  'massa-lubrense',
  'sant-agnello',
];

export function generateId() {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `pz-${rand}`;
}
