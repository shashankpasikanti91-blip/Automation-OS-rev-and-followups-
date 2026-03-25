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
  const skip = (page - 1) * limit;

  const where = {
    tenantId: session.user.tenantId,
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.workflow.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        workflowRuns: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { workflowRuns: true } },
      },
    }),
    prisma.workflow.count({ where }),
  ]);

  return NextResponse.json({ data: { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } } });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const workflow = await prisma.workflow.create({
    data: {
      tenantId: session.user.tenantId,
      name: body.name,
      description: body.description,
      trigger: body.trigger ?? 'MANUAL',
      steps: body.steps ?? [],
      status: body.status ?? 'ACTIVE',
      createdBy: session.user.id,
    },
  });

  return NextResponse.json({ data: workflow }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.workflow.findFirst({ where: { id: body.id, tenantId: session.user.tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.workflow.update({
    where: { id: body.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.steps !== undefined ? { steps: body.steps } : {}),
    },
  });

  return NextResponse.json({ data: updated });
}
