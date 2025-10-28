import zennv from "zennv";
import { z } from "zod";

export const env = zennv({
  dotenv: true,
  schema: z.object({
    NODE_ENV: z.string().default("development"),
    PG_SSL: z.string().default("true"),
    DB_HOST: z.string(),
    DB_PORT: z.string(),
    DB_NAME: z.string(),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
    DB_CONNECTION: z.string(),
    JWT_SECRET: z.string().default("your-secret-key"),
    JWT_REFRESH_SECRET: z.string().default("your-refresh-secret"),
  }),
});
