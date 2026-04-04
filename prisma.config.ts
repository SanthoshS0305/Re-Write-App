import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "dotenv";

// Prisma CLI doesn't load .env.local automatically — do it here
config({ path: ".env.local" });

// Use DIRECT_URL for migrations (bypasses PgBouncer transaction mode),
// fall back to DATABASE_URL if DIRECT_URL is not set.
const connectionString =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";

export default defineConfig({
  datasource: {
    url: connectionString,
    adapter: new PrismaPg(new Pool({ connectionString })),
  },
});
