import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const records = await prisma.user.findMany({
      where: { is_active: true },
      orderBy: { display_name: 'asc' },
      select: { id: true, display_name: true, role: true },
    });
    return NextResponse.json(records);
  } catch (e) {
    console.error('GET /api/users error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
