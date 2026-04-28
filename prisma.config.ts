import "dotenv/config";
import { defineConfig } from "prisma/config";

// ✅ We use a fallback URL to prevent build failures when DATABASE_URL is not present (e.g. during CI/CD generation)
const databaseUrl = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";

export default defineConfig({
  schema: "prisma/schema.prisma",

  datasource: {
    url: databaseUrl,
  },
});
