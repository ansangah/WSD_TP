// src/config/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env"; // 이미 만들어 둔 env.ts

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL, // .env의 DATABASE_URL
});

export const prisma = new PrismaClient({
  adapter,
});