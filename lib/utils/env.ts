/**
 * Environment variable validation.
 * Called on startup — throws a descriptive error if any required variable is missing.
 */

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const;

const REQUIRED_SERVER_ENV_VARS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
] as const;

/**
 * Validates that all required public environment variables are present.
 * Safe to call in both server and client contexts.
 */
export function validatePublicEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join("\n")}\n\nCopy .env.example to .env.local and fill in the values.`
    );
  }
}

/**
 * Validates that all required server-side environment variables are present.
 * Only call this in server-side code (API routes, Server Components).
 */
export function validateServerEnv(): void {
  validatePublicEnv();

  const missing = REQUIRED_SERVER_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required server environment variables:\n${missing.map((k) => `  - ${k}`).join("\n")}\n\nThese must be set in .env.local (development) or your hosting platform (production).`
    );
  }
}

/**
 * Type-safe environment variable getters.
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  appUrl: process.env.NEXT_PUBLIC_APP_URL!,
  cronSecret: process.env.CRON_SECRET!,
} as const;
