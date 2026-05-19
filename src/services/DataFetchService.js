function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

function sanitizeForAttribute(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/["'&<>/`]/g, '').trim();
}

async function fetchJSON(url, retries = 2, delay = 500) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      if (i < retries) await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
  return null;
}

async function getStitchedData() {
  return await fetchJSON('/api/data/stitched') ?? [];
}

async function getLocations() {
  return await fetchJSON('/api/data/towns') ?? [];
}

async function getPizzerias() {
  return await fetchJSON('/api/data/venues') ?? [];
}

async function getPrices() {
  return await fetchJSON('/api/data/prices') ?? [];
}

function groupByCity(stitchedData) {
  const grouped = {};
  stitchedData.forEach((entry) => {
    if (!grouped[entry.cityName]) grouped[entry.cityName] = [];
    grouped[entry.cityName].push(entry);
  });
  Object.values(grouped).forEach((arr) =>
    arr.sort((a, b) => (a.margheritaPrice || 0) - (b.margheritaPrice || 0))
  );
  return grouped;
}

export { getStitchedData, getLocations, getPizzerias, getPrices, groupByCity, sanitizeInput, sanitizeForAttribute };
