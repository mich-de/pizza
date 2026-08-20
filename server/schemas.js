import { z } from 'zod';
import {
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  MIN_CONTENT_LENGTH,
  MAX_CONTENT_LENGTH
} from './config.js';

export const LoginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export const CommentSchema = z.object({
  postId: z.string().min(1).max(50),
  author: z.string().min(MIN_NAME_LENGTH).max(MAX_NAME_LENGTH),
  content: z.string().min(MIN_CONTENT_LENGTH).max(MAX_CONTENT_LENGTH),
  honeypot: z.string().optional(),
  mathAnswer: z.number(),
  captchaToken: z.string().min(1),
});

/* Un evento e' bilingue in due campi affiancati, non in due record: la scheda
   e' una sola e cambia lingua, come tutto il resto del sito. `id` lo assegna
   il server in inserimento, quindi qui non compare. */
export const EventSchema = z.object({
  title: z.string().min(3).max(120),
  titleIt: z.string().max(120).optional().default(''),
  dateStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida'),
  dateEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida'),
  cityId: z.string().min(1).max(60),
  venue: z.string().max(160).optional().default(''),
  description: z.string().max(2000).optional().default(''),
  descriptionIt: z.string().max(2000).optional().default(''),
  type: z.string().min(1).max(40),
  imageUrl: z.string().max(500).nullable().optional().default(null),
  highlights: z.array(z.string().max(80)).max(12).optional().default([]),
}).refine(e => e.dateEnd >= e.dateStart, {
  message: 'La data di fine precede quella di inizio',
  path: ['dateEnd'],
});

/* La segnalazione di un prezzo sbagliato non e' un commento: e' un dato, con
   accanto una nota facoltativa che spiega il dato. Percio' ha uno schema suo,
   dove il prezzo e' obbligatorio e il testo no — l'esatto contrario di
   `CommentSchema`, che senza testo non ha senso di esistere. */
export const PriceProposalSchema = z.object({
  postId: z.string().min(1).max(50),
  author: z.string().min(MIN_NAME_LENGTH).max(MAX_NAME_LENGTH),
  proposedPrice: z.number().positive().max(100),
  note: z.string().max(200).optional().default(''),
  honeypot: z.string().optional(),
  mathAnswer: z.number(),
  captchaToken: z.string().min(1),
});

export const FeedPostSchema = z.object({
  author: z.string().min(2).max(30),
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional().default(''),
  honeypot: z.string().optional(),
  mathAnswer: z.number(),
  captchaToken: z.string().min(1),
});

/* --- La forma degli archivi su disco ---------------------------------------
   Gli schemi qui sopra descrivono cio' che arriva da fuori; questi descrivono
   cio' che e' gia' dentro. Servono al controllo di validita' del Pannello, che
   rilegge i file e dice cosa non torna prima che sia una distribuzione a
   dirlo.

   Stavano in `src/config/schemas.js`, dove pero' non li importava nessuno e il
   server non poteva importarli: l'immagine di produzione copia `src/` solo
   nello stadio di compilazione, quindi da qui un `import` verso li' non
   sopravviverebbe all'avvio del contenitore. */

const townSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  region: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
});

const venueSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(150),
  address: z.string().min(1).max(300),
  cityId: z.string().min(1).max(50),
  phone: z.string().max(30).optional().default(''),
  category: z.enum(['traditional', 'gourmet', 'wood-fired', 'restaurant']).default('traditional'),
  rating: z.number().min(0).max(5).default(0),
  description: z.string().max(500).optional().default(''),
  /* `permanently-closed` c'e' nei dati e vuol dire un'altra cosa da `closed`:
     chiuso stasera non e' chiuso per sempre. Lo schema di prima conosceva solo
     i primi due — ma non e' mai stato eseguito da nessuno, quindi non se n'e'
     accorto nessuno. */
  status: z.enum(['open', 'closed', 'permanently-closed']).default('open'),
  frazione: z.string().max(100).nullable().default(null),
  imageUrl: z.string().nullable().default(null),
  tripadvisor: z.string().url().nullable().default(null),
  maps_url: z.string().url().nullable().default(null),
});

const priceSchema = z.object({
  /* Facoltativo, e non per indulgenza: meta' dei prezzi non ce l'ha e niente
     nel codice lo legge — la chiave vera e' `pizzeriaId`. Pretenderlo qui
     avrebbe segnalato settanta errori che errori non sono. */
  id: z.string().min(1).max(50).optional(),
  pizzeriaId: z.string().min(1).max(50),
  margheritaPrice: z.number().min(0).max(100),
  // Nullo dove il prezzo e' una stima e la valuta non e' mai stata dichiarata.
  currency: z.string().length(3).nullable().optional(),
  lastUpdated: z.string().datetime().or(z.string().date()).nullable().optional(),
  /* `admin-manual` lo scrive il Pannello a ogni correzione di prezzo e
     `system` viene dal caricamento iniziale: due valori che l'applicazione
     produce da sempre e che lo schema non contemplava. */
  source: z.enum([
    'official-menu', 'piatti-menu', 'estimated',
    'user-proposal', 'unverified', 'admin-manual', 'system',
  ]).default('unverified'),
  // Lo storico dei ritocchi, dove c'e'.
  history: z.array(z.object({
    date: z.string(),
    price: z.number().min(0).max(100),
  })).optional(),
});

/* La scheda evento come sta su disco: quella di sopra piu' l'identificativo,
   che nell'inserimento non c'e' perche' lo assegna il server. */
const storedEventSchema = z.object({ id: z.string().min(1).max(120) })
  .and(EventSchema);

const storedCommentSchema = z.object({
  id: z.number().int().positive(),
  postId: z.string().min(1).max(50),
  author: z.string().min(2).max(30),
  content: z.string().min(1).max(MAX_CONTENT_LENGTH),
  createdAt: z.string().datetime(),
  approved: z.boolean().default(true),
});

const storedProposalSchema = z.object({
  id: z.number().int().positive(),
  postId: z.string().min(1).max(50),
  pizzeriaId: z.string().min(1).max(50),
  author: z.string().min(2).max(30),
  proposedPrice: z.number().min(0).max(100),
  currentPrice: z.number().min(0).max(100).nullable().default(null),
  createdAt: z.string().datetime(),
  reviewed: z.boolean().default(false),
});

export const TownsSchema = z.array(townSchema);
export const VenuesSchema = z.array(venueSchema);
export const PricesSchema = z.array(priceSchema);
export const EventsSchema = z.array(storedEventSchema);
export const CommentsSchema = z.array(storedCommentSchema);
export const ProposalsSchema = z.array(storedProposalSchema);
