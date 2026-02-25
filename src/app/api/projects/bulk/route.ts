import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  try {
    const { ids, updates } = await req.json() as { ids: string[]; updates: Record<string, string> };
    const now = BigInt(Date.now());
    await prisma.project.updateMany({
      where: { id: { in: ids } },
      data: { ...updates, updated_at: now },
    });
    return NextResponse.json({ ok: true, count: ids.length });
  } catch (e) {
    console.error('PATCH /api/projects/bulk error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json() as { ids: string[] };
    const now = BigInt(Date.now());
    await prisma.project.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true, updated_at: now },
    });
    return NextResponse.json({ ok: true, count: ids.length });
  } catch (e) {
    console.error('DELETE /api/projects/bulk error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
