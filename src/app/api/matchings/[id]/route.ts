import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const now = BigInt(Date.now());
    const record = await prisma.matching.update({
      where: { id },
      data: {
        project_id: body.project_id,
        member_id: body.member_id,
        status: body.status,
        note: body.note,
        proposed_date: body.proposed_date,
        interview_date: body.interview_date,
        updated_at: now,
      },
    });
    return NextResponse.json({
      ...record,
      created_at: record.created_at.toString(),
      updated_at: record.updated_at.toString(),
    });
  } catch (e) {
    console.error('PUT /api/matchings/[id] error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.matching.update({
      where: { id },
      data: { deleted: true, updated_at: BigInt(Date.now()) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/matchings/[id] error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
