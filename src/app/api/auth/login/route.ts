import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  role: string;
  is_active: number;
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'ユーザー名とパスワードを入力してください' },
        { status: 400 },
      );
    }

    const rows = await prisma.$queryRawUnsafe<UserRow[]>(
      'SELECT id, username, password_hash, display_name, role, is_active FROM users WHERE username = ? LIMIT 1',
      username,
    );
    const user = rows[0] ?? null;

    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 },
      );
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role: user.role,
    });
  } catch (e) {
    console.error('POST /api/auth/login error:', e);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 },
    );
  }
}
