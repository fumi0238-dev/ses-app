import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { hashPassword } from '../src/lib/auth';
import path from 'path';

async function main() {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'dev.db');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaBetterSqlite3({ url: dbPath } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma = new PrismaClient({ adapter } as any);

  const existing = await prisma.user.findUnique({
    where: { email: 'admin@ses-app.local' },
  });

  if (!existing) {
    const passwordHash = await hashPassword('admin123');
    await prisma.user.create({
      data: {
        email: 'admin@ses-app.local',
        password_hash: passwordHash,
        display_name: '管理者',
        role: 'admin',
        is_active: true,
        created_at: BigInt(Date.now()),
        updated_at: BigInt(Date.now()),
      },
    });
    console.log('Admin user created: admin@ses-app.local / admin123');
  } else {
    console.log('Admin user already exists, skipping.');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
