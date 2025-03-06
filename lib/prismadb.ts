import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
  // Add EdgeRuntime to globalThis for TypeScript
  var EdgeRuntime: string | undefined;
}

// Check if we're in Edge Runtime
const isEdgeRuntime = typeof globalThis.EdgeRuntime === 'string';

// Configure Prisma Client with better connection handling
const prismaClientSingleton = () => {
  // If we're in Edge Runtime, we need to use Prisma Accelerate
  if (isEdgeRuntime) {
    return new PrismaClient({
      log: ['error', 'warn'],
      // The data proxy flag is required for Edge Runtime
      // This is automatically set when using Prisma Accelerate URLs
    });
  }
  
  // For Node.js runtime
  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || process.env.DIRECT_URL
      }
    },
    // Add connection timeout settings as part of the client options
  });
  // Note: connectionTimeout is not a valid direct option for PrismaClient
};

// In Edge Runtime, we don't use the global singleton pattern
const prismadb = isEdgeRuntime 
  ? prismaClientSingleton() 
  : (globalThis.prisma ?? prismaClientSingleton());

// Only cache the instance if not in Edge Runtime and not in production
if (!isEdgeRuntime && process.env.NODE_ENV !== "production") {
  globalThis.prisma = prismadb;
}

// Add a helper function for retrying queries
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 100
): Promise<T> {
  let retries = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      retries++;
      
      // If we've reached the max retries, throw the error
      if (retries >= maxRetries) {
        throw error;
      }
      
      // If the error is a connection error, wait and retry
      if (error.message.includes('connection') || error.message.includes('retry')) {
        console.log(`Retrying operation (${retries}/${maxRetries}) after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Increase delay for next retry (exponential backoff)
        delay *= 2;
      } else {
        // If it's not a connection error, throw it
        throw error;
      }
    }
  }
}

export { prismadb };
export default prismadb;
