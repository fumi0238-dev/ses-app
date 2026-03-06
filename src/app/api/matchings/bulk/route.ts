import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json() as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '対象IDが指定されていません' }, { status: 400 });
    }
    const now = BigInt(Date.now());
    // 関連タスクもカスケード削除
    await prisma.task.deleteMany({
      where: { matching_id: { in: ids } },
    });
    const result = await prisma.matching.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true, updated_at: now },
    });
    return NextResponse.json({ ok: true, count: result.count });
  } catch (e) {
    console.error('DELETE /api/matchings/bulk error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
