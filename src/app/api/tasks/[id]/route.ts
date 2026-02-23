import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const now = BigInt(Date.now());
    const record = await prisma.task.update({
      where: { id },
      data: {
        ...(body.content !== undefined && { content: body.content }),
        ...(body.done !== undefined && { done: body.done }),
        ...(body.due_date !== undefined && { due_date: body.due_date }),
        ...(body.sort_order !== undefined && { sort_order: body.sort_order }),
        ...(body.progress_status !== undefined && { progress_status: body.progress_status }),
        ...(body.progress_note !== undefined && { progress_note: body.progress_note }),
        ...(body.assignee !== undefined && { assignee: body.assignee }),
        ...(body.progress_status === '完了' && { done: true }),
        ...(body.progress_status !== undefined && body.progress_status !== '完了' && { done: false }),
        updated_at: now,
      },
    });
    return NextResponse.json({
      ...record,
      created_at: record.created_at.toString(),
      updated_at: record.updated_at.toString(),
    });
  } catch (e) {
    console.error('PUT /api/tasks/[id] error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/tasks/[id] error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
