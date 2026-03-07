import { PrismaClient } from "../../../node_modules/.prisma/clientPg";
import { env } from "@umati/env";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL, // ✅ guaranteed safe + validated
      },
    },
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
