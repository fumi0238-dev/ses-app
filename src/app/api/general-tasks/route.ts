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

export async function GET() {
  try {
    const records = await prisma.generalTask.findMany({
      where: { deleted: false },
      include: {
        tags: { include: { tag: true } },
        children: {
          where: { deleted: false },
          include: {
            tags: { include: { tag: true } },
            children: {
              where: { deleted: false },
              include: { tags: { include: { tag: true } } },
              orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
            },
          },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        },
      },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    });
    const serializeTask = (t: typeof records[0]): Record<string, unknown> => ({
      ...serialize(t as unknown as Record<string, unknown>),
      tags: t.tags.map(ta => serializeTag(ta.tag as unknown as Record<string, unknown>)),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: (t.children ?? []).map((c: any) => serializeTask(c)),
    });
    const result = records.map(r => serializeTask(r));
    return NextResponse.json(result);
  } catch (e) {
    console.error('GET /api/general-tasks error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = BigInt(Date.now());
    const record = await prisma.generalTask.create({
      data: {
        title: body.title ?? '',
        description: body.description ?? '',
        status: body.status ?? '未着手',
        priority: body.priority ?? 'なし',
        assignee: body.assignee ?? '',
        due_date: body.due_date ?? '',
        sort_order: body.sort_order ?? 0,
        section_id: body.section_id ?? null,
        parent_id: body.parent_id ?? null,
        linked_project_id: body.linked_project_id ?? null,
        linked_member_id: body.linked_member_id ?? null,
        linked_matching_id: body.linked_matching_id ?? null,
        created_at: now,
        updated_at: now,
        ...(body.tag_ids?.length && {
          tags: {
            create: body.tag_ids.map((tagId: string) => ({ tag: { connect: { id: tagId } } })),
          },
        }),
      },
      include: {
        tags: { include: { tag: true } },
      },
    });
    return NextResponse.json({
      ...serialize(record as unknown as Record<string, unknown>),
      tags: record.tags.map(ta => serializeTag(ta.tag as unknown as Record<string, unknown>)),
      children: [],
    });
  } catch (e) {
    console.error('POST /api/general-tasks error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
