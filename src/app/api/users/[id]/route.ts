import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await req.json();
    const { display_name, email, role } = body;

    if (!email) {
      return NextResponse.json({ error: 'メールアドレスを入力してください' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '有効なメールアドレスを入力してください' }, { status: 400 });
    }
    if (!display_name) {
      return NextResponse.json({ error: '表示名を入力してください' }, { status: 400 });
    }
    if (!['admin', 'manager', 'user'].includes(role)) {
      return NextResponse.json({ error: '不正なロールです' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // メール変更時の重複チェック
    if (email !== existing.email) {
      const dup = await prisma.user.findUnique({ where: { email } });
      if (dup) {
        return NextResponse.json({ error: 'このメールアドレスは既に使用されています' }, { status: 409 });
      }
    }

    const now = BigInt(Date.now());
    const user = await prisma.user.update({
      where: { id },
      data: { display_name, email, role, updated_at: now },
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
    console.error('PUT /api/users/[id] error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
