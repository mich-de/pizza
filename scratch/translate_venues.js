import fs from 'fs';

const venuesPath = './public/data/venues.json';
const venues = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));

const translations = {
  "pz-006": "Pittoresca terrazza vista mare a Marina di Cassano.",
  "pz-007": "Famosa per i suoi enormi crocché e l'atmosfera locale autentica.",
  "pz-008": "Amato panificio e pizzeria a Meta.",
  "pz-009": "Storico locale di Meta con interni accoglienti.",
  "pz-010": "Pizza a metro: 30cm=8€, 50cm=15€. La mundialmente famosa Università della Pizza a Vico Equense.",
  "pz-011": "Qualità moderna, vivace e costante nel centro di Vico Equense.",
  "pz-012": "Posizione panoramica sulle colline di Moiano.",
  "pz-013": "Istituzione pluripremiata di Sant'Agata con ingredienti locali di alta qualità.",
  "pz-014": "Autentica pizza napoletana nel tranquillo fascino di Schiazzano.",
  "pz-016": "Nuova sede a Piano di Sorrento con splendida vista mare. Pizze d'autore e grandi classici.",
  "pz-018": "Splendida vista mare e pizze gourmet con ingredienti locali.",
  "pz-020": "Pizzeria boutique con menù creativo e giardino interno.",
  "pz-021": "Specialità locali e pizza tradizionale a Massa Lubrense.",
  "pz-022": "Pizzeria gourmet con ingredienti ricercati e ampia scelta di birre artigianali.",
  "pz-023": "Locale rustico e accogliente nel cuore di Sant'Agata.",
  "pz-024": "Pizza tradizionale nel suggestivo borgo di Marina della Lobra.",
  "pz-025": "Gemma rustica e accogliente nel villaggio di Schiazzano.",
  "pz-029": "Pizzeria moderna molto apprezzata a Piano di Sorrento.",
  "pz-036": "Locale tradizionale vicino al porto di Sorrento.",
  "pz-037": "Famoso per l'ampia scelta e il servizio cordiale.",
  "pz-039": "Posto storico nei vicoli di Sorrento.",
  "pz-040": "Accogliente e autentico nella vivace Via Fuoro.",
  "pz-041": "Versione moderna della pizza con prodotti locali.",
  "pz-042": "Ristorante classico sorrentino con posti a sedere all'aperto.",
  "pz-043": "Famoso per le sue creative opzioni metà e metà.",
  "pz-046": "Autentico e in posizione centrale.",
  "pz-061": "Storica pizzeria ora chiusa definitivamente.",
  "pz-062": "Atmosfera accogliente in una zona tranquilla di Piano.",
  "pz-081": "Autentica pizza vicana con prodotti locali.",
  "pz-083": "Famosa per l'eccellente impasto a Moiano.",
  "pz-091": "Deliziosa pizza nel suggestivo borgo di Seiano.",
  "pz-102": "Un pilastro della comunità di Ticciano.",
  "pz-105": "Storica pizzeria della famiglia a Mortora, ora chiusa definitivamente.",
  "pz-106": "Bellissima vista su Marina Grande. Pizzeria e cucina di mare.",
  "pz-107": "Storico ristorante sul mare a Marina Grande.",
  "pz-109": "Atmosfera autentica nelle colline di Sorrento.",
  "pz-110": "Cucina tipica e pizza di qualità a Casarlano.",
  "pz-115": "Mangiare in riva al mare a Nerano.",
  "pz-123": "Sapori classici in un vicolo dello shopping. Autentica taverna napoletana.",
  "pz-124": "Cucina elegante e ottima pizza vicino alla Cattedrale.",
  "pz-130": "Sapori autentici a Termini.",
  "pz-133": "Pizza artigianale di alto livello.",
  "pz-134": "Mito di Nerano.",
  "pz-135": "Lusso estremo e pizze da sogno.",
  "pz-140": "Locale storico in Piazza Tasso.",
  "pz-141": "Dedicato al tenore Caruso.",
  "pz-142": "Ristorante moderno e creativo nel centro di Sorrento.",
  "pz-145": "Ristorante celebre al centro.",
  "pz-147": "Esperienza di lusso con vista.",
  "pz-148": "Famoso giardino di limoni.",
  "pz-149": "Atmosfera portuale a Marina Piccola.",
  "pz-150": "Cenare sulla scogliera a Marina Piccola.",
  "pz-155": "Pizza e pesce contemporaneo.",
  "pz-158": "Autentiche vibrazioni del porto a Marina Grande.",
  "pz-159": "Pizza di lusso all'Orangerie, Grand Hotel Excelsior Vittoria.",
  "pz-160": "Ristorante italiano classico e pizzeria nel cuore di Sorrento.",
  "pz-161": "Autentica trattoria nel centro storico di Sorrento.",
  "pz-162": "Classica pizzeria a conduzione familiare nel centro storico di Sorrento.",
  "pz-163": "Autentico street food napoletano nel cuore di Sorrento.",
  "pz-164": "Storico ristorante a conduzione familiare sulle colline di Sorrento.",
  "pz-165": "Posto locale autentico famoso per il panuozzo e la pizza a lievitazione naturale.",
  "pz-166": "Pizzeria tranquilla e accogliente in un vicolo caratteristico del centro storico.",
  "pz-167": "Storica pizzeria e rosticceria da asporto e con seduta nel cuore del centro di Sorrento.",
  "pz-168": "Elegante ristorante con giardino e pizzeria sulla strada principale di Sorrento.",
  "pz-169": "Istituzione a conduzione familiare famosa per il pollo allo spiedo e l'ottima pizza al forno a legna.",
  "pz-170": "Incantevole ristorante con terrazza, ampia scelta di pizze e frutti di mare.",
  "pz-171": "Trattoria-pizzeria moderna e accogliente popolare tra i locali.",
  "pz-172": "Storico bar e pasticceria a Sorrento, offre anche ottimi snack e pasti leggeri tra cui la pizza.",
  "pz-173": "Il bar più famoso di Sorrento, situato nella piazza principale.",
  "pz-174": "Molto apprezzata dai locali, con punteggi altissimi per la qualità della pizza.",
  "pz-175": "Situata nella zona collinare di Trasaella, è nota per gli impasti digeribili e l'ambiente giovane.",
  "pz-176": "Locale a conduzione familiare molto centrale, ideale per pizze da asporto e pasti veloci.",
  "pz-177": "Altro punto di riferimento storico lungo il Corso Italia.",
  "pz-178": "Eccellente per la pizza a taglio e prodotti da forno locali di alta qualità.",
  "pz-179": "Situata ai Colli di Fontanelle, offre una splendida vista e ottima cucina locale.",
  "pz-180": "Storica pizzeria con ambiente accogliente."
};

let updatedCount = 0;
venues.forEach(v => {
  if (translations[v.id]) {
    if (!v.descriptionIt) {
      v.descriptionIt = translations[v.id];
      updatedCount++;
    }
    // Also ensure English description is present
    if (v.id === "pz-016" && v.description === v.descriptionIt) {
        v.description = "New location in Piano di Sorrento with splendid sea view. Signature pizzas and great classics.";
    }
  }
});

fs.writeFileSync(venuesPath, JSON.stringify(venues, null, 2));
console.log(`Updated ${updatedCount} venues with Italian descriptions.`);
