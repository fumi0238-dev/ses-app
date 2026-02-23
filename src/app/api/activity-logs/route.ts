import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const records = await prisma.activityLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
    });
    const result = records.map(r => ({
      ...r,
      created_at: r.created_at.toString(),
    }));
    return NextResponse.json(result);
  } catch (e) {
    console.error('GET /api/activity-logs error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = BigInt(Date.now());
    const record = await prisma.activityLog.create({
      data: {
        action: body.action ?? '',
        target_table: body.target_table ?? '',
        target_id: body.target_id ?? '',
        target_name: body.target_name ?? '',
        detail: body.detail ?? '',
        timestamp: body.timestamp ?? '',
        created_at: now,
      },
    });
    return NextResponse.json({
      ...record,
      created_at: record.created_at.toString(),
    });
  } catch (e) {
    console.error('POST /api/activity-logs error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
