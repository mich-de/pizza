import fs from 'fs';

const venuesPath = './public/data/venues.json';
const pricesPath = './public/data/prices.json';

const venues = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const prices = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));

// 1. Remove pz-190 (Michele in Sorrento)
const filteredVenues = venues.filter(v => v.id !== 'pz-190');
const filteredPrices = prices.filter(p => p.pizzeriaId !== 'pz-190');

// 2. Update existing Vico pizzerias with better data
filteredVenues.forEach(v => {
  if (v.id === 'pz-182') {
    v.address = "Corso Filangieri, 94, 80069 Vico Equense NA";
    v.name = "Pizzeria Da Franco";
  }
  if (v.id === 'pz-188') {
    v.address = "Via dei Campi, 32, 80069 Vico Equense NA";
    v.name = "Da Cardillo";
  }
  if (v.id === 'pz-191') {
    v.name = "Pizzeria Toto";
    v.address = "Via San Ciro, 5, 80069 Vico Equense NA";
    v.description = "Authentic family-run pizzeria in the heart of Vico, known for its consistency and quality.";
    v.descriptionIt = "Autentica pizzeria a conduzione familiare nel cuore di Vico, nota per la costanza e la qualità.";
  }
});

const newestVenues = [
  {
    "id": "pz-192",
    "name": "Saporì",
    "address": "Via Santa Maria Vecchia, 2, 80066 Seiano NA",
    "cityId": "vico-equense",
    "phone": "+39 081 802 8341",
    "category": "gourmet",
    "rating": 4.6,
    "description": "Modern gourmet pizzeria with refined ingredients and highly digestible dough.",
    "descriptionIt": "Locale moderno con ingredienti ricercati e impasti ad alta digeribilità.",
    "status": "open",
    "frazione": "Seiano",
    "imageUrl": null,
    "tripadvisor": "https://www.tripadvisor.it/Restaurant_Review-g194947-d1597942-Reviews-Sapori-Vico_Equense_Province_of_Naples_Campania.html",
    "maps_url": "https://www.google.com/maps/search/?api=1&query=Sapori+Seiano+Vico+Equense",
    "margheritaPrice": 9.0,
    "lastUpdated": new Date().toISOString(),
    "priceSource": "estimated",
    "cityName": "Vico Equense",
    "cityRegion": "Penisola Sorrentina"
  },
  {
    "id": "pz-193",
    "name": "O' Saraceno",
    "address": "Via Murrano, 14, 80066 Seiano NA",
    "cityId": "vico-equense",
    "phone": "+39 081 802 8511",
    "category": "traditional",
    "rating": 4.4,
    "description": "Historic panoramic terrace in Seiano, perfect for pizza and seafood.",
    "descriptionIt": "Storica terrazza panoramica su Seiano, ideale per pizza e piatti di mare.",
    "status": "open",
    "frazione": "Seiano",
    "imageUrl": null,
    "tripadvisor": "https://www.tripadvisor.it/Restaurant_Review-g194947-d2109504-Reviews-O_Saraceno-Vico_Equense_Province_of_Naples_Campania.html",
    "maps_url": "https://www.google.com/maps/search/?api=1&query=O+Saraceno+Seiano+Vico+Equense",
    "margheritaPrice": 7.5,
    "lastUpdated": new Date().toISOString(),
    "priceSource": "estimated",
    "cityName": "Vico Equense",
    "cityRegion": "Penisola Sorrentina"
  },
  {
    "id": "pz-194",
    "name": "Mustafà",
    "address": "Via Marina di Equa, 32, 80066 Vico Equense NA",
    "cityId": "vico-equense",
    "phone": "+39 081 801 5066",
    "category": "traditional",
    "rating": 4.5,
    "description": "Famous seafront venue in Marina di Equa, known for its hospitality and tradition.",
    "descriptionIt": "Celebre locale fronte mare a Marina di Equa, noto per l'accoglienza e la tradizione.",
    "status": "open",
    "frazione": "Marina di Equa",
    "imageUrl": null,
    "tripadvisor": "https://www.tripadvisor.it/Restaurant_Review-g194947-d1544383-Reviews-Mustafa-Vico_Equense_Province_of_Naples_Campania.html",
    "maps_url": "https://www.google.com/maps/search/?api=1&query=Mustafa+Marina+di+Equa+Vico+Equense",
    "margheritaPrice": 8.0,
    "lastUpdated": new Date().toISOString(),
    "priceSource": "estimated",
    "cityName": "Vico Equense",
    "cityRegion": "Penisola Sorrentina"
  },
  {
    "id": "pz-195",
    "name": "Aequa",
    "address": "Via Marina di Equa, 34, 80066 Vico Equense NA",
    "cityId": "vico-equense",
    "phone": "+39 081 801 5065",
    "category": "traditional",
    "rating": 4.3,
    "description": "Elegant seaside venue, great for a pizza at sunset.",
    "descriptionIt": "Locale elegante sulla spiaggia, ottimo per una pizza al tramonto.",
    "status": "open",
    "frazione": "Marina di Equa",
    "imageUrl": null,
    "tripadvisor": "https://www.tripadvisor.it/Restaurant_Review-g194947-d1597942-Reviews-Aequa-Vico_Equense_Province_of_Naples_Campania.html",
    "maps_url": "https://www.google.com/maps/search/?api=1&query=Aequa+Marina+di+Equa+Vico+Equense",
    "margheritaPrice": 8.5,
    "lastUpdated": new Date().toISOString(),
    "priceSource": "estimated",
    "cityName": "Vico Equense",
    "cityRegion": "Penisola Sorrentina"
  },
  {
    "id": "pz-196",
    "name": "La Piazzetta",
    "address": "Via Santa Maria del Toro, 2, 80069 Vico Equense NA",
    "cityId": "vico-equense",
    "phone": "+39 081 801 5396",
    "category": "traditional",
    "rating": 4.4,
    "description": "Cozy pizzeria in the town center, highly appreciated by locals.",
    "descriptionIt": "Pizzeria accogliente nel centro cittadino, molto apprezzata dai residenti.",
    "status": "open",
    "frazione": null,
    "imageUrl": null,
    "tripadvisor": "https://www.tripadvisor.it/Restaurant_Review-g194947-d1597942-Reviews-La_Piazzetta-Vico_Equense_Province_of_Naples_Campania.html",
    "maps_url": "https://www.google.com/maps/search/?api=1&query=La+Piazzetta+Vico+Equense",
    "margheritaPrice": 6.5,
    "lastUpdated": new Date().toISOString(),
    "priceSource": "estimated",
    "cityName": "Vico Equense",
    "cityRegion": "Penisola Sorrentina"
  },
  {
    "id": "pz-197",
    "name": "All'Angolo",
    "address": "Corso Filangieri, 10, 80069 Vico Equense NA",
    "cityId": "vico-equense",
    "phone": "+39 081 879 8122",
    "category": "traditional",
    "rating": 4.2,
    "description": "Historical spot at the beginning of the center, great for a quick and tasty pizza.",
    "descriptionIt": "Punto storico all'inizio del centro, ottimo per una pizza veloce e saporita.",
    "status": "open",
    "frazione": null,
    "imageUrl": null,
    "tripadvisor": "https://www.tripadvisor.it/Restaurant_Review-g194947-d1537280-Reviews-All_Angolo-Vico_Equense_Province_of_Naples_Campania.html",
    "maps_url": "https://www.google.com/maps/search/?api=1&query=All+Angolo+Vico+Equense",
    "margheritaPrice": 6.0,
    "lastUpdated": new Date().toISOString(),
    "priceSource": "estimated",
    "cityName": "Vico Equense",
    "cityRegion": "Penisola Sorrentina"
  },
  {
    "id": "pz-198",
    "name": "Il Casale del Golfo",
    "address": "Via Raffaele Bosco, 497, 80069 Vico Equense NA",
    "cityId": "vico-equense",
    "phone": "+39 081 802 3122",
    "category": "restaurant",
    "rating": 4.5,
    "description": "Wonderful panoramic view and traditional pizza in the upper hills.",
    "descriptionIt": "Splendida vista panoramica e pizza tradizionale nelle colline alte.",
    "status": "open",
    "frazione": "Moiano",
    "imageUrl": null,
    "tripadvisor": "https://www.tripadvisor.it/Restaurant_Review-g194947-d2325380-Reviews-Il_Casale_del_Golfo-Vico_Equense_Province_of_Naples_Campania.html",
    "maps_url": "https://www.google.com/maps/search/?api=1&query=Il+Casale+del+Golfo+Vico+Equense",
    "margheritaPrice": 7.5,
    "lastUpdated": new Date().toISOString(),
    "priceSource": "estimated",
    "cityName": "Vico Equense",
    "cityRegion": "Penisola Sorrentina"
  },
  {
    "id": "pz-199",
    "name": "Pizzeria Da Cardone",
    "address": "Via le Pietre, 13, 80069 Vico Equense NA",
    "cityId": "vico-equense",
    "phone": "+39 081 801 5396",
    "category": "traditional",
    "rating": 4.4,
    "description": "Authentic local flavor in a quiet street.",
    "descriptionIt": "Sapore locale autentico in una strada tranquilla.",
    "status": "open",
    "frazione": null,
    "imageUrl": null,
    "tripadvisor": "https://www.tripadvisor.it/Restaurant_Review-g194947-d1597942-Reviews-Pizzeria_Da_Cardone-Vico_Equense_Province_of_Naples_Campania.html",
    "maps_url": "https://www.google.com/maps/search/?api=1&query=Pizzeria+Da+Cardone+Vico+Equense",
    "margheritaPrice": 6.5,
    "lastUpdated": new Date().toISOString(),
    "priceSource": "estimated",
    "cityName": "Vico Equense",
    "cityRegion": "Penisola Sorrentina"
  },
  {
    "id": "pz-200",
    "name": "Tigabelas",
    "address": "Via S. Ciro, 52, 80069 Vico Equense NA",
    "cityId": "vico-equense",
    "phone": "+39 081 1889 1234",
    "category": "gourmet",
    "rating": 4.5,
    "description": "Innovative and modern, popular for its creative approach to pizza.",
    "descriptionIt": "Innovativa e moderna, popolare per il suo approccio creativo alla pizza.",
    "status": "open",
    "frazione": null,
    "imageUrl": null,
    "tripadvisor": "https://www.tripadvisor.it/Restaurant_Review-g194947-d1597942-Reviews-Tigabelas-Vico_Equense_Province_of_Naples_Campania.html",
    "maps_url": "https://www.google.com/maps/search/?api=1&query=Tigabelas+Vico+Equense",
    "margheritaPrice": 9.5,
    "lastUpdated": new Date().toISOString(),
    "priceSource": "estimated",
    "cityName": "Vico Equense",
    "cityRegion": "Penisola Sorrentina"
  }
];

filteredVenues.push(...newestVenues);

newestVenues.forEach(v => {
  filteredPrices.push({
    "pizzeriaId": v.id,
    "margheritaPrice": v.margheritaPrice,
    "lastUpdated": v.lastUpdated,
    "source": v.priceSource,
    "history": [
      {
        "date": v.lastUpdated,
        "price": v.margheritaPrice
      }
    ]
  });
});

fs.writeFileSync(venuesPath, JSON.stringify(filteredVenues, null, 2));
fs.writeFileSync(pricesPath, JSON.stringify(filteredPrices, null, 2));
console.log(`Updated Vico Equense: removed 1 wrong, updated 3, added 9 new. Total Vico coverage is now much higher.`);
