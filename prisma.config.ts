import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // Make sure this is updated to the NEW password
    url: "postgresql://postgres:GetDone2026@localhost:5432/getdone_db?schema=public&sslmode=disable",
  },
});