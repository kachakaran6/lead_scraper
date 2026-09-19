import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  API_PORT: z.coerce.number().default(4000),
  WORKER_PORT: z.coerce.number().default(4001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().default("dev-secret-change-me"),
  JWT_EXPIRY: z.string().default("7d"),
  SEARXNG_URL: z.string().optional(),
  OLLAMA_BASE_URL: z.string().optional(),
  OLLAMA_MODEL: z.string().default("llama3"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("meta-llama/llama-3.3-70b-instruct"),
  OPENROUTER_BASE_URL: z.string().default("https://openrouter.ai/api/v1"),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  OVERPASS_API_URL: z.string().default("https://overpass-api.de/api/interpreter"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  DEMO_MODE: z.coerce.boolean().default(false),
  CRAWL_MAX_DEPTH: z.coerce.number().default(3),
  CRAWL_MAX_PAGES: z.coerce.number().default(50),
  CRAWL_CONCURRENT: z.coerce.number().default(5),
  CRAWL_REQUEST_DELAY: z.coerce.number().default(1000),
  ALLOWED_DOMAINS: z.string().optional(),
  BLOCKED_DOMAINS: z.string().default("localhost,127.0.0.1,169.254.169.254"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables: ${parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ")}`,
    );
  }

  cached = parsed.data;
  return cached;
}

export function resetEnv() {
  cached = null;
}

export function parseCsvList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
