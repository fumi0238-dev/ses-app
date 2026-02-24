import { PrismaClient } from '@/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// Bump this version whenever the Prisma schema changes (migration / new fields)
const PRISMA_SCHEMA_VERSION = 4;

declare global {
  // eslint-disable-next-line no-var
  var prismaV2: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var prismaSchemaVersion: number | undefined;
}

function createClient(): PrismaClient {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'dev.db');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaBetterSqlite3({ url: dbPath } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

// Clear stale cache when schema version changes (new models / fields added)
if (global.prismaV2 && global.prismaSchemaVersion !== PRISMA_SCHEMA_VERSION) {
  global.prismaV2 = undefined;
}
const prisma = global.prismaV2 ?? createClient();
if (process.env.NODE_ENV !== 'production') {
  global.prismaV2 = prisma;
  global.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}

export default prisma;
