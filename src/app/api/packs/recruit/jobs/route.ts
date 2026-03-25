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
        { title: { contains: search, mode: 'insensitive' as const } },
        { department: { contains: search, mode: 'insensitive' as const } },
        { location: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.job.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.job.count({ where }),
  ]);

  return NextResponse.json({ data: { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } } });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const job = await prisma.job.create({
    data: {
      tenantId: session.user.tenantId,
      title: body.title,
      department: body.department,
      location: body.location,
      type: body.type ?? 'FULL_TIME',
      status: body.status ?? 'OPEN',
      description: body.description,
      closingDate: body.closingDate ? new Date(body.closingDate) : undefined,
    },
  });

  return NextResponse.json({ data: job }, { status: 201 });
}
