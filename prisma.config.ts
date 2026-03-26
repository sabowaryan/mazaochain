import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// DATABASE_URL may not be available during `npm install` on CI/CD (Vercel installs
// dependencies before environment variables are injected). Using process.env directly
// instead of env() avoids a PrismaConfigEnvError at postinstall time.
// prisma generate runs in the `build` script where the variable is always present.
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
