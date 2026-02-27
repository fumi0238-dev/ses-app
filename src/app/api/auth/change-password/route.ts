import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth';

interface UserRow {
  id: string;
  password_hash: string;
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, current_password, new_password } = await req.json();

    if (!user_id || !current_password || !new_password) {
      return NextResponse.json(
        { error: '全ての項目を入力してください' },
        { status: 400 },
      );
    }

    if (new_password.length < 4) {
      return NextResponse.json(
        { error: 'パスワードは4文字以上で入力してください' },
        { status: 400 },
      );
    }

    const rows = await prisma.$queryRawUnsafe<UserRow[]>(
      'SELECT id, password_hash FROM users WHERE id = ? LIMIT 1',
      user_id,
    );
    const user = rows[0] ?? null;

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 },
      );
    }

    const valid = await verifyPassword(current_password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: '現在のパスワードが正しくありません' },
        { status: 401 },
      );
    }

    const newHash = await hashPassword(new_password);
    const now = BigInt(Date.now());
    await prisma.$executeRawUnsafe(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
      newHash,
      now,
      user_id,
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/auth/change-password error:', e);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 },
    );
  }
}
