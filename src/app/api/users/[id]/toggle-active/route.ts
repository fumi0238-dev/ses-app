import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    if (authResult.userId === id) {
      return NextResponse.json({ error: '自分自身を無効化することはできません' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const now = BigInt(Date.now());
    const user = await prisma.user.update({
      where: { id },
      data: { is_active: !existing.is_active, updated_at: now },
      select: {
        id: true, email: true, display_name: true, role: true,
        is_active: true, created_at: true, updated_at: true,
      },
    });

    return NextResponse.json({
      ...user,
      created_at: user.created_at.toString(),
      updated_at: user.updated_at.toString(),
    });
  } catch (e) {
    console.error('PATCH /api/users/[id]/toggle-active error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
