import fs from 'fs';

const venuesPath = './public/data/venues.json';
const pricesPath = './public/data/prices.json';

const venues = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const prices = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));

const tottoi = {
  "id": "pz-191",
  "name": "Pizzeria Tottoi",
  "address": "Via S. Ciro, 42, 80069 Vico Equense NA",
  "cityId": "vico-equense",
  "phone": "+39 081 879 0048",
  "category": "traditional",
  "rating": 4.5,
  "description": "Authentic local pizzeria known for its welcoming atmosphere and high-quality traditional pizzas.",
  "descriptionIt": "Autentica pizzeria locale nota per l'atmosfera accogliente e le pizze tradizionali di alta qualità.",
  "status": "open",
  "frazione": null,
  "imageUrl": null,
  "tripadvisor": "https://www.tripadvisor.it/Restaurant_Review-g194947-d3386001-Reviews-Pizzeria_Tottoi-Vico_Equense_Province_of_Naples_Campania.html",
  "maps_url": "https://www.google.com/maps/search/?api=1&query=Pizzeria+Tottoi+Vico+Equense",
  "margheritaPrice": 6.5,
  "lastUpdated": new Date().toISOString(),
  "priceSource": "estimated",
  "cityName": "Vico Equense",
  "cityRegion": "Penisola Sorrentina"
};

venues.push(tottoi);

prices.push({
  "pizzeriaId": tottoi.id,
  "margheritaPrice": tottoi.margheritaPrice,
  "lastUpdated": tottoi.lastUpdated,
  "source": tottoi.priceSource,
  "history": [
    {
      "date": tottoi.lastUpdated,
      "price": tottoi.margheritaPrice
    }
  ]
});

fs.writeFileSync(venuesPath, JSON.stringify(venues, null, 2));
fs.writeFileSync(pricesPath, JSON.stringify(prices, null, 2));
console.log('Added Pizzeria Tottoi (pz-191).');
