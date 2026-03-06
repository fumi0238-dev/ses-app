import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface AuthResult {
  userId: string;
  role: string;
}

export async function requireAuth(req: NextRequest): Promise<AuthResult | NextResponse> {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const rows = await prisma.$queryRawUnsafe<{ id: string; role: string; is_active: number }[]>(
    'SELECT id, role, is_active FROM users WHERE id = ? AND is_active = 1 LIMIT 1',
    userId,
  );
  const user = rows[0];
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  return { userId: user.id, role: user.role };
}

export async function requireAdmin(req: NextRequest): Promise<AuthResult | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (result.role !== 'admin') {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
  }
  return result;
}
