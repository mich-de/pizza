import { z } from 'zod';

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
  status: z.enum(['open', 'closed']).default('open'),
  frazione: z.string().max(100).nullable().default(null),
  imageUrl: z.string().nullable().default(null),
  tripadvisor: z.string().url().nullable().default(null),
  maps_url: z.string().url().nullable().default(null),
});

const priceSchema = z.object({
  id: z.string().min(1).max(50),
  pizzeriaId: z.string().min(1).max(50),
  margheritaPrice: z.number().min(0).max(100),
  currency: z.string().length(3).default('EUR'),
  lastUpdated: z.string().datetime().or(z.string().date()).optional(),
  source: z.enum(['official-menu', 'piatti-menu', 'estimated', 'user-proposal', 'unverified']).default('unverified'),
});

const commentSchema = z.object({
  id: z.number().int().positive(),
  postId: z.string().min(1).max(50),
  author: z.string().min(2).max(30),
  content: z.string().min(5).max(500),
  createdAt: z.string().datetime(),
  approved: z.boolean().default(true),
});

const proposalSchema = z.object({
  id: z.number().int().positive(),
  postId: z.string().min(1).max(50),
  pizzeriaId: z.string().min(1).max(50),
  author: z.string().min(2).max(30),
  proposedPrice: z.number().min(0).max(100),
  currentPrice: z.number().min(0).max(100).nullable().default(null),
  createdAt: z.string().datetime(),
  reviewed: z.boolean().default(false),
});

const stitchedVenueSchema = venueSchema.extend({
  margheritaPrice: z.number().min(0).max(100).default(0),
  lastUpdated: z.string().nullable().default(null),
  priceSource: z.string().nullable().default(null),
  cityName: z.string().min(1).max(100).default('Unknown'),
  cityRegion: z.string().default(''),
});

export const TownsSchema = z.array(townSchema);
export const VenuesSchema = z.array(venueSchema);
export const PricesSchema = z.array(priceSchema);
export const CommentsSchema = z.array(commentSchema);
export const ProposalsSchema = z.array(proposalSchema);
export const StitchedVenuesSchema = z.array(stitchedVenueSchema);

export function validateData(data, schema) {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { valid: false, errors: result.error.errors };
  }
  return { valid: true, data: result.data };
}
