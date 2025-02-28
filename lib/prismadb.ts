import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'], // Removed 'query' to reduce logging
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

const prismadb = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prismadb;
}

export { prismadb };
export default prismadb;
