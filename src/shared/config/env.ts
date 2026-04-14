import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5925").transform(Number).pipe(z.number().int().positive()),
  MONGODB_URI: z
    .string()
    .min(1)
    .transform((uri) => {
      // If URI doesn't have a database name, append 'ok11'
      // MongoDB URI format: mongodb://[user:pass@]host[:port][/database][?options]
      const baseUri = uri.includes("?") ? uri.split("?")[0] : uri;

      // Check if there's a database name after the last /
      const lastSlashIndex = baseUri.lastIndexOf("/");
      const dbPart = baseUri.substring(lastSlashIndex + 1);

      // If no database name or empty after last slash, append ok11
      if (!dbPart || dbPart.includes("@") || dbPart.includes(":")) {
        // No db name - the last slash is part of host:port or credentials
        return uri.replace(/\/?(\?|$)/, "/ok11$1");
      }

      return uri;
    }),
  FIREBASE_PROJECT_ID: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("24h"),
  CORS_ORIGIN: z.string().default("http://localhost:5925"),
  CORS_CREDENTIALS: z
    .string()
    .default("true")
    .transform((val: string) => val === "true"),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default("900000")
    .transform(Number)
    .pipe(z.number().int().positive()),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default("100")
    .transform(Number)
    .pipe(z.number().int().positive()),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error: unknown) {
  if (error instanceof z.ZodError) {
    console.error("❌ Invalid environment variables:");
    error.issues.forEach((err: z.ZodIssue) => {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export default env;
