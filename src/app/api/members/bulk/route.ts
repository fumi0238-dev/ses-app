import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json() as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '対象IDが指定されていません' }, { status: 400 });
    }
    const now = BigInt(Date.now());
    // 関連マッチング・タスクもカスケード削除
    const relatedMatchings = await prisma.matching.findMany({
      where: { member_id: { in: ids }, deleted: false },
      select: { id: true },
    });
    if (relatedMatchings.length > 0) {
      const matchingIds = relatedMatchings.map(m => m.id);
      await prisma.task.deleteMany({
        where: { matching_id: { in: matchingIds } },
      });
      await prisma.matching.updateMany({
        where: { id: { in: matchingIds } },
        data: { deleted: true, updated_at: now },
      });
    }
    const result = await prisma.member.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true, updated_at: now },
    });
    return NextResponse.json({ ok: true, count: result.count });
  } catch (e) {
    console.error('DELETE /api/members/bulk error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
