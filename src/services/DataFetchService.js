const sanitizeInput = (str) => str.replace(/[<>]/g, '');

async function getStitchedData() {
  const res = await fetch('/api/data/stitched');
  if (!res.ok) throw new Error('Failed to fetch stitched data');
  return res.json();
}

async function getLocations() {
  const res = await fetch('/api/data/towns');
  if (!res.ok) throw new Error('Failed to fetch towns');
  return res.json();
}

async function getPizzerias() {
  const res = await fetch('/api/data/venues');
  if (!res.ok) throw new Error('Failed to fetch venues');
  return res.json();
}

async function getPrices() {
  const res = await fetch('/api/data/prices');
  if (!res.ok) throw new Error('Failed to fetch prices');
  return res.json();
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

export { getStitchedData, getLocations, getPizzerias, getPrices, groupByCity, sanitizeInput };
