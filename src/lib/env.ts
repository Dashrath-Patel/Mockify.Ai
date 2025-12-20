/**
 * Environment Variable Validation and Type Safety
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod';

/**
 * Environment variable schema
 * All required variables must be defined
 */
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // AI Services
  OPENAI_API_KEY: z.string().min(1).optional(),
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),

  // App Configuration
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_DEV_MODE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  
  // Analytics (optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),

  // Rate Limiting (optional)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

/**
 * Validated environment variables with type safety
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables on startup
 * Throws error if validation fails
 */
function validateEnv(): Env {
  try {
    const env = envSchema.parse({
      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

      // AI Services
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,

      // App Configuration
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      
      // Feature Flags
      NEXT_PUBLIC_ENABLE_DEV_MODE: process.env.NEXT_PUBLIC_ENABLE_DEV_MODE,
      
      // Analytics
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,

      // Rate Limiting
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join('.')).join(', ');
      throw new Error(
        `❌ Invalid environment variables: ${missingVars}\n\n` +
        `Please check your .env.local file and ensure all required variables are set.\n` +
        `See .env.example for reference.`
      );
    }
    throw error;
  }
}

/**
 * Export validated environment variables
 * This will throw an error on startup if validation fails
 */
export const env = validateEnv();

/**
 * Type-safe environment variable access
 * Use this instead of process.env for runtime safety
 */
export const getEnv = <K extends keyof Env>(key: K): Env[K] => {
  return env[key];
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (feature: string): boolean => {
  const envKey = `NEXT_PUBLIC_ENABLE_${feature.toUpperCase()}` as keyof Env;
  return env[envKey] === true;
};

/**
 * Check if running in production
 */
export const isProduction = (): boolean => {
  return env.NODE_ENV === 'production';
};

/**
 * Check if running in development
 */
export const isDevelopment = (): boolean => {
  return env.NODE_ENV === 'development';
};

/**
 * Get base URL for the application
 */
export const getBaseUrl = (): string => {
  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  if (isProduction()) {
    return 'https://mockify.ai'; // Replace with your production URL
  }

  return 'http://localhost:3000';
};

/**
 * Validate API key presence
 */
export const hasApiKey = (service: 'openai' | 'google' | 'gemini'): boolean => {
  const keyMap = {
    openai: 'OPENAI_API_KEY',
    google: 'GOOGLE_AI_API_KEY',
    gemini: 'GEMINI_API_KEY',
  } as const;

  const key = keyMap[service] as keyof Env;
  return !!env[key];
};
