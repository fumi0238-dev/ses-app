import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { task_id, new_section_id, new_sort_order } = body;
    const now = BigInt(Date.now());

    await prisma.generalTask.update({
      where: { id: task_id },
      data: {
        section_id: new_section_id ?? null,
        sort_order: new_sort_order ?? 0,
        updated_at: now,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('PUT /api/general-tasks/reorder error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
