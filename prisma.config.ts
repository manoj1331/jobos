import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://jobos:jobos_secret@localhost:5432/jobos",
  },
} as any)
