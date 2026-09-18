import { z } from "zod";

export const businessSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  category: z.string().max(255).optional(),
  subCategory: z.string().max(255).optional(),
  status: z.string().max(255).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(255).optional(),
  state: z.string().max(255).optional(),
  country: z.string().max(255).optional(),
  postalCode: z.string().max(50).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().max(255).optional(),
  source: z.enum(["MAPS", "SEARCH", "DIRECTORY", "IMPORT", "API", "MANUAL"]).default("MANUAL"),
  sourceId: z.string().max(255).optional(),
  sourceUrl: z.string().url().optional(),
});

export const createBusinessSchema = businessSchema;

export const updateBusinessSchema = businessSchema.partial();

export const contactSchema = z.object({
  businessId: z.string().cuid().optional(),
  firstName: z.string().max(255).optional(),
  lastName: z.string().max(255).optional(),
  title: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  linkedinUrl: z.string().url().optional(),
  source: z.string().max(255).optional(),
  confidence: z.number().min(0).max(1).default(0),
});

export const emailSchema = z.object({
  businessId: z.string().cuid().optional(),
  value: z.string().email(),
  status: z.enum(["PUBLIC", "VERIFIED", "UNVERIFIED", "GENERIC", "PERSONAL", "INVALID"]).default("UNVERIFIED"),
  isGeneric: z.boolean().default(false),
  isPersonal: z.boolean().default(false),
  source: z.string().max(255).optional(),
});

export const phoneSchema = z.object({
  businessId: z.string().cuid().optional(),
  value: z.string().max(50),
  country: z.string().max(10).optional(),
  countryCode: z.string().max(10).optional(),
  type: z.string().max(50).optional(),
  isWhatsapp: z.boolean().optional(),
  source: z.string().max(255).optional(),
});

export const socialSchema = z.object({
  businessId: z.string().cuid().optional(),
  platform: z.string().max(50),
  username: z.string().max(255).optional(),
  url: z.string().url(),
  discoveredFrom: z.string().max(500).optional(),
  followers: z.number().optional(),
});

export const opportunitySchema = z.object({
  businessId: z.string().cuid().optional(),
  type: z.enum([
    "NO_WEBSITE",
    "WEBSITE_REDESIGN",
    "SEO",
    "PERFORMANCE",
    "MOBILE_OPTIMIZATION",
    "ECOMMERCE",
    "BOOKING_SYSTEM",
    "CRM",
    "WHATSAPP_INTEGRATION",
    "AUTOMATION",
    "LANDING_PAGE",
    "SOCIAL_MEDIA",
    "LOCAL_SEO",
  ]),
  title: z.string().max(255),
  description: z.string().max(2000).optional(),
  priority: z.string().max(50).default("MEDIUM"),
  confidence: z.number().min(0).max(1).default(0),
  status: z.string().max(50).default("OPEN"),
  score: z.number().default(0),
});

export const campaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  searchQuery: z.string().max(500).optional(),
  location: z.string().max(500).optional(),
  radiusKm: z.number().positive().optional(),
  limit: z.number().int().positive().max(100000).default(1000),
  filters: z.record(z.unknown()).optional(),
  source: z.enum(["MAPS", "SEARCH", "DIRECTORY", "IMPORT", "API", "MANUAL"]).default("SEARCH"),
});

export const scoringRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  signal: z.string().min(1).max(255),
  weight: z.number().int(),
  operator: z.string().max(50).default("equals"),
  value: z.string().max(255).optional(),
  enabled: z.boolean().default(true),
});

export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().max(255).optional(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(100),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(500),
  location: z.string().max(500).optional(),
  radiusKm: z.number().positive().optional(),
  limit: z.number().int().positive().max(100000).default(1000),
  filters: z.record(z.unknown()).optional(),
});
