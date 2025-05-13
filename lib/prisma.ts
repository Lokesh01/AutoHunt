import { PrismaClient } from "./generated/prisma";

// TypeScript doesn't know that `global` can have a `prisma` property,
// so we cast it to a custom type that includes `prisma: PrismaClient`.
// This allows us to safely attach the Prisma client to the global object,
// which helps with reusing the client during development (see next lines).
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// globalForPrisma.prisma:
// This global variable is used to store a single instance of the PrismaClient.
// It ensures that the Prisma client is reused across hot reloads during development,
// preventing the creation of multiple instances. Without this check, every reload
// would create a new PrismaClient instance, which could lead to "too many connections"
// or other database-related issues. In production, we skip attaching it to the global
// object to avoid shared mutable state, which can be unsafe in serverless or multi-threaded environments.
