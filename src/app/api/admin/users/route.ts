import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const roles = session.user.roles ?? [];
  if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
  const search = searchParams.get('search') ?? '';
  const skip = (page - 1) * limit;

  const where = {
    tenantId: session.user.tenantId,
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, status: true, lastLoginAt: true, createdAt: true, userRoles: { include: { role: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ data: { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } } });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const patchRoles = session.user.roles ?? [];
  if (!patchRoles.includes('ADMIN') && !patchRoles.includes('SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (body.id === session.user.id) return NextResponse.json({ error: 'Cannot modify own account' }, { status: 400 });

  const target = await prisma.user.findFirst({ where: { id: body.id, tenantId: session.user.tenantId } });
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id: body.id },
    data: {
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
    select: { id: true, name: true, email: true, status: true },
  });

  return NextResponse.json({ data: updated });
}
