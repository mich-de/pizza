const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const venuesPath = path.join(root, 'public/data/venues.json');
const townsPath = path.join(root, 'public/data/towns.json');

const venues = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const towns = JSON.parse(fs.readFileSync(townsPath, 'utf8'));

const townMap = {};
towns.forEach(t => { townMap[t.id] = t.name; });

const updatedVenues = venues.map(v => {
  if (!v.maps_url) {
    const cityName = townMap[v.cityId] || '';
    const query = encodeURIComponent(`${v.name} ${v.address} ${cityName}`.trim());
    v.maps_url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  }
  return v;
});

fs.writeFileSync(venuesPath, JSON.stringify(updatedVenues, null, 2), 'utf8');
console.log(`Updated ${updatedVenues.length} venues.`);
