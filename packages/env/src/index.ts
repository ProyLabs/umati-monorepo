import zennv from "zennv";
import { z } from "zod";

export const env = zennv({
  // Automatically loads from .env, .env.local, and process.env
  // Works across monorepos when imported from apps/web or apps/ws-server
  dotenv: true,
  
  schema: z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    // Database
    DATABASE_URL: z.string().url(),

    // API and WS
    NEXT_API_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_WS_SERVER_URL: z.string().url().default("wss://umati-ws.onrender.com"),

    // Shared secret (for internal service-to-service auth)
    INTERNAL_API_KEY: z.string().default("umati_internal_secret"),

    // App-specific
    PORT: z.string().optional(), // Render WS service port
  }),
});
