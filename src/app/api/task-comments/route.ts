import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get('task_id');
    if (!taskId) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }
    const records = await prisma.taskComment.findMany({
      where: { task_id: taskId },
      orderBy: { created_at: 'asc' },
    });
    const result = records.map(r => ({
      ...r,
      created_at: r.created_at.toString(),
    }));
    return NextResponse.json(result);
  } catch (e) {
    console.error('GET /api/task-comments error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = BigInt(Date.now());
    const record = await prisma.taskComment.create({
      data: {
        task_id: body.task_id,
        content: body.content ?? '',
        user_id: body.user_id ?? '',
        user_name: body.user_name ?? '',
        created_at: now,
      },
    });
    return NextResponse.json({
      ...record,
      created_at: record.created_at.toString(),
    });
  } catch (e) {
    console.error('POST /api/task-comments error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
