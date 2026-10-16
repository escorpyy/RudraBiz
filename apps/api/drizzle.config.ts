import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
  // Triggers/functions live in hand-written SQL migrations, not the schema file.
  verbose: true,
  strict: true,
});
