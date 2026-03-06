import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import { hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    let isAdmin = false;

    if (userId) {
      const rows = await prisma.$queryRawUnsafe<{ role: string }[]>(
        'SELECT role FROM users WHERE id = ? AND is_active = 1 LIMIT 1',
        userId,
      );
      isAdmin = rows[0]?.role === 'admin';
    }

    if (isAdmin) {
      const records = await prisma.user.findMany({
        orderBy: { created_at: 'asc' },
        select: {
          id: true, email: true, display_name: true, role: true,
          is_active: true, created_at: true, updated_at: true,
        },
      });
      return NextResponse.json(records.map(r => ({
        ...r,
        created_at: r.created_at.toString(),
        updated_at: r.updated_at.toString(),
      })));
    }

    const records = await prisma.user.findMany({
      where: { is_active: true },
      orderBy: { display_name: 'asc' },
      select: { id: true, email: true, display_name: true, role: true },
    });
    return NextResponse.json(records);
  } catch (e) {
    console.error('GET /api/users error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { email, display_name, role, password } = body;

    if (!email || !display_name || !role || !password) {
      return NextResponse.json({ error: '全ての項目を入力してください' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '有効なメールアドレスを入力してください' }, { status: 400 });
    }
    if (!['admin', 'manager', 'user'].includes(role)) {
      return NextResponse.json({ error: '不正なロールです' }, { status: 400 });
    }
    if (password.length < 4) {
      return NextResponse.json({ error: 'パスワードは4文字以上で入力してください' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'このメールアドレスは既に使用されています' }, { status: 409 });
    }

    const password_hash = await hashPassword(password);
    const now = BigInt(Date.now());

    const user = await prisma.user.create({
      data: {
        email,
        display_name,
        role,
        password_hash,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      select: {
        id: true, email: true, display_name: true, role: true,
        is_active: true, created_at: true, updated_at: true,
      },
    });

    return NextResponse.json({
      ...user,
      created_at: user.created_at.toString(),
      updated_at: user.updated_at.toString(),
    }, { status: 201 });
  } catch (e) {
    console.error('POST /api/users error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
