import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import { hashPassword } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await req.json();
    const { new_password } = body;

    if (!new_password || new_password.length < 4) {
      return NextResponse.json({ error: 'パスワードは4文字以上で入力してください' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const password_hash = await hashPassword(new_password);
    const now = BigInt(Date.now());

    await prisma.user.update({
      where: { id },
      data: { password_hash, updated_at: now },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('PATCH /api/users/[id]/reset-password error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
