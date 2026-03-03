import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const records = await prisma.taskTag.findMany({
      orderBy: { created_at: 'asc' },
    });
    const result = records.map(r => ({
      ...r,
      created_at: r.created_at.toString(),
    }));
    return NextResponse.json(result);
  } catch (e) {
    console.error('GET /api/task-tags error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = BigInt(Date.now());
    const record = await prisma.taskTag.create({
      data: {
        name: body.name ?? '',
        color: body.color ?? 'gray',
        created_at: now,
      },
    });
    return NextResponse.json({
      ...record,
      created_at: record.created_at.toString(),
    });
  } catch (e) {
    console.error('POST /api/task-tags error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
