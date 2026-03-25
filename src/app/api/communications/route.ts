import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError, buildPagination, buildPaginatedResponse } from '@/lib/api';
import { z } from 'zod';

const createSchema = z.object({
  channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'PHONE', 'IN_APP']),
  direction: z.enum(['OUTBOUND', 'INBOUND']).default('OUTBOUND'),
  subject: z.string().optional(),
  body: z.string(),
  status: z.string().optional(),
  organizationId: z.string().optional(),
  contactId: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);
  const { searchParams } = new URL(req.url);
  const { skip, take, page, limit } = buildPagination(searchParams);
  const channel = searchParams.get('channel');

  const where: any = {
    tenantId: ctx.tenantId,
    ...(channel && { channel }),
  };

  const [comms, total] = await Promise.all([
    prisma.communication.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.communication.count({ where }),
  ]);

  return NextResponse.json(apiSuccess(buildPaginatedResponse(comms, total, page, limit)));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(apiError('Validation failed', 400, parsed.error.flatten()), { status: 400 });

  const comm = await prisma.communication.create({
    data: {
      tenantId: ctx.tenantId,
      status: 'draft',
      ...parsed.data,
    },
  });

  return NextResponse.json(apiSuccess(comm), { status: 201 });
}
