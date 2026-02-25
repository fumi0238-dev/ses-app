import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json() as { ids: string[] };
    const now = BigInt(Date.now());
    await prisma.member.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true, updated_at: now },
    });
    return NextResponse.json({ ok: true, count: ids.length });
  } catch (e) {
    console.error('DELETE /api/members/bulk error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
