import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status');
  const skip = (page - 1) * limit;

  const where = {
    tenantId: session.user.tenantId,
    ...(status ? { status } : {}),
    ...(search ? {
      OR: [
        { policyNumber: { contains: search, mode: 'insensitive' as const } },
        { insurer: { name: { contains: search, mode: 'insensitive' as const } } },
        { type: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  } as any;

  const [data, total] = await Promise.all([
    prisma.policy.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { organization: { select: { name: true } }, insurer: { select: { name: true } } },
    }),
    prisma.policy.count({ where }),
  ]);

  return NextResponse.json({ data: { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } } });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const policy = await prisma.policy.create({
    data: {
      tenantId: session.user.tenantId,
      policyNumber: body.policyNumber,
      insurerId: body.insurerId,
      type: body.type,
      status: body.status ?? 'ACTIVE',
      premium: body.premium,
      currency: body.currency ?? 'USD',
      ...(body.startDate && { startDate: new Date(body.startDate) }),
      ...(body.endDate && { endDate: new Date(body.endDate) }),
      organizationId: body.organizationId,
    },
  });

  return NextResponse.json({ data: policy }, { status: 201 });
}
