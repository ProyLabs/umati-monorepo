import zennv from "zennv";
import { z } from "zod";

export const env = zennv({
  dotenv: true,
  schema: z.object({
    NODE_ENV: z.string().default("development"),
    DATABASE_URL: z.string(),
  }),
});
