import { PrismaClient } from "@prisma/client";

const connectionString = "postgresql://postgres:GetDone2026@localhost:5432/getdone_db?schema=public&sslmode=disable";

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// We use the 'datasourceUrl' property which is the ONLY way 
// to bypass environment lookup in the newest Prisma versions.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasourceUrl: connectionString,
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;