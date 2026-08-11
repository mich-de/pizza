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
  proposedPrice: z.number().positive().max(100).optional(),
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
