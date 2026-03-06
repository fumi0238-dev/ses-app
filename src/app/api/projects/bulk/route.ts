import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 許可するフィールドのホワイトリスト
const ALLOWED_UPDATE_FIELDS = ['status', 'shareable', 'share_note', 'source', 'work_style'];

export async function PATCH(req: NextRequest) {
  try {
    const { ids, updates } = await req.json() as { ids: string[]; updates: Record<string, string> };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '対象IDが指定されていません' }, { status: 400 });
    }
    // ホワイトリストに含まれるフィールドのみ許可
    const safeUpdates: Record<string, string> = {};
    for (const key of Object.keys(updates)) {
      if (ALLOWED_UPDATE_FIELDS.includes(key)) {
        safeUpdates[key] = updates[key];
      }
    }
    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: '更新可能なフィールドが指定されていません' }, { status: 400 });
    }
    const now = BigInt(Date.now());
    const result = await prisma.project.updateMany({
      where: { id: { in: ids } },
      data: { ...safeUpdates, updated_at: now },
    });
    return NextResponse.json({ ok: true, count: result.count });
  } catch (e) {
    console.error('PATCH /api/projects/bulk error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json() as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '対象IDが指定されていません' }, { status: 400 });
    }
    const now = BigInt(Date.now());
    // 関連マッチング・タスクもカスケード削除
    const relatedMatchings = await prisma.matching.findMany({
      where: { project_id: { in: ids }, deleted: false },
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
    const result = await prisma.project.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true, updated_at: now },
    });
    return NextResponse.json({ ok: true, count: result.count });
  } catch (e) {
    console.error('DELETE /api/projects/bulk error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
