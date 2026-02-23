import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { tasks } = await req.json();
    const now = BigInt(Date.now());
    const created = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tasks.map((t: any, i: number) =>
        prisma.task.create({
          data: {
            matching_id: t.matching_id,
            content: t.content ?? '',
            done: false,
            due_date: t.due_date ?? '',
            sort_order: t.sort_order ?? i,
            progress_status: '未着手',
            progress_note: '',
            assignee: '',
            created_at: now,
            updated_at: now,
          },
        })
      )
    );
    return NextResponse.json(
      created.map(r => ({
        ...r,
        created_at: r.created_at.toString(),
        updated_at: r.updated_at.toString(),
      }))
    );
  } catch (e) {
    console.error('POST /api/tasks/bulk error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
