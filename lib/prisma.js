import { PrismaClient } from "@prisma/client";

export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = db;
}

// globalThis.prisma : This is a global object that is used to share the PrismaClient instance across the entire application. This is useful because PrismaClient is a singleton and should only be instantiated once per application. This is a common pattern in Next.js applications to ensure that the PrismaClient instance is shared across all requests.