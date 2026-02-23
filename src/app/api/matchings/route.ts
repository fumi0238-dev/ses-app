import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const records = await prisma.matching.findMany({
      where: { deleted: false },
      orderBy: { created_at: 'asc' },
    });
    const result = records.map(r => ({
      ...r,
      created_at: r.created_at.toString(),
      updated_at: r.updated_at.toString(),
    }));
    return NextResponse.json(result);
  } catch (e) {
    console.error('GET /api/matchings error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = BigInt(Date.now());
    const record = await prisma.matching.create({
      data: {
        project_id: body.project_id,
        member_id: body.member_id,
        status: body.status ?? '',
        note: body.note ?? '',
        proposed_date: body.proposed_date ?? '',
        interview_date: body.interview_date ?? '',
        created_at: now,
        updated_at: now,
      },
    });
    return NextResponse.json({
      ...record,
      created_at: record.created_at.toString(),
      updated_at: record.updated_at.toString(),
    });
  } catch (e) {
    console.error('POST /api/matchings error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
