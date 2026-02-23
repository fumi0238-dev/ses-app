import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const records = await prisma.task.findMany({
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    });
    const result = records.map(r => ({
      ...r,
      created_at: r.created_at.toString(),
      updated_at: r.updated_at.toString(),
    }));
    return NextResponse.json(result);
  } catch (e) {
    console.error('GET /api/tasks error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = BigInt(Date.now());
    const record = await prisma.task.create({
      data: {
        matching_id: body.matching_id,
        content: body.content ?? '',
        done: body.done ?? false,
        due_date: body.due_date ?? '',
        sort_order: body.sort_order ?? 0,
        progress_status: body.progress_status ?? '未着手',
        progress_note: body.progress_note ?? '',
        assignee: body.assignee ?? '',
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
    console.error('POST /api/tasks error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
