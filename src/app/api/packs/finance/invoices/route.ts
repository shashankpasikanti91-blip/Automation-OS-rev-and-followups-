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
        { invoiceNumber: { contains: search, mode: 'insensitive' as const } },
        { organization: { name: { contains: search, mode: 'insensitive' as const } } },
      ],
    } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.serviceInvoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { organization: { select: { name: true } } },
    }),
    prisma.serviceInvoice.count({ where }),
  ]);

  return NextResponse.json({ data: { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } } });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const invoice = await prisma.serviceInvoice.create({
    data: {
      tenantId: session.user.tenantId,
      invoiceNumber: body.invoiceNumber,
      amount: body.amount,
      total: body.total ?? body.amount,
      currency: body.currency ?? 'USD',
      status: body.status ?? 'draft',
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      organizationId: body.organizationId,
      notes: body.notes,
    },
  });

  return NextResponse.json({ data: invoice }, { status: 201 });
}
