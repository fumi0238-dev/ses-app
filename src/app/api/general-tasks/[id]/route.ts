import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function serialize(r: Record<string, unknown>) {
  return {
    ...r,
    created_at: r.created_at?.toString() ?? '0',
    updated_at: r.updated_at?.toString() ?? '0',
    completed_at: r.completed_at != null ? r.completed_at.toString() : null,
  };
}

function serializeTag(t: Record<string, unknown>) {
  return { ...t, created_at: t.created_at?.toString() ?? '0' };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const now = BigInt(Date.now());

    // Handle tag updates separately
    if (body.tag_ids !== undefined) {
      await prisma.taskTagAssignment.deleteMany({ where: { task_id: id } });
      if (body.tag_ids.length > 0) {
        await prisma.taskTagAssignment.createMany({
          data: body.tag_ids.map((tagId: string) => ({ task_id: id, tag_id: tagId })),
        });
      }
    }

    const record = await prisma.generalTask.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.assignee !== undefined && { assignee: body.assignee }),
        ...(body.due_date !== undefined && { due_date: body.due_date }),
        ...(body.sort_order !== undefined && { sort_order: body.sort_order }),
        ...(body.section_id !== undefined && { section_id: body.section_id }),
        ...(body.parent_id !== undefined && { parent_id: body.parent_id }),
        ...(body.linked_project_id !== undefined && { linked_project_id: body.linked_project_id }),
        ...(body.linked_member_id !== undefined && { linked_member_id: body.linked_member_id }),
        ...(body.linked_matching_id !== undefined && { linked_matching_id: body.linked_matching_id }),
        // Auto-set completed_at when status changes to 完了
        ...(body.status === '完了' && { completed_at: now }),
        ...(body.status !== undefined && body.status !== '完了' && { completed_at: null }),
        updated_at: now,
      },
      include: {
        tags: { include: { tag: true } },
        children: {
          where: { deleted: false },
          include: { tags: { include: { tag: true } } },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        },
      },
    });
    return NextResponse.json({
      ...serialize(record as unknown as Record<string, unknown>),
      tags: record.tags.map(ta => serializeTag(ta.tag as unknown as Record<string, unknown>)),
      children: record.children.map(c => ({
        ...serialize(c as unknown as Record<string, unknown>),
        tags: c.tags.map(ta => serializeTag(ta.tag as unknown as Record<string, unknown>)),
      })),
    });
  } catch (e) {
    console.error('PUT /api/general-tasks/[id] error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const now = BigInt(Date.now());
    // Soft delete: also delete children
    await prisma.generalTask.updateMany({
      where: { OR: [{ id }, { parent_id: id }] },
      data: { deleted: true, updated_at: now },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/general-tasks/[id] error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
