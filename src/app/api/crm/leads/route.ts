import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError, buildPagination, buildPaginatedResponse } from '@/lib/api';
import { fireWebhook } from '@/lib/webhook';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'NURTURING']).optional(),
  value: z.number().optional(),
  currency: z.string().optional(),
  organizationId: z.string().optional(),
  contactId: z.string().optional(),
  assignedTo: z.string().optional(),
  expectedCloseDate: z.string().datetime().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);
  const { searchParams } = new URL(req.url);

  const { skip, take, page, limit } = buildPagination(searchParams);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status');

  const where: any = {
    tenantId: ctx.tenantId,
    isDeleted: false,
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(status && { status }),
  };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return apiSuccess(buildPaginatedResponse(leads, total, page, limit));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(apiError('Validation failed', 400, parsed.error.flatten()), { status: 400 });

  const lead = await prisma.lead.create({
    data: { tenantId: ctx.tenantId, status: 'NEW', ...parsed.data },
  });

  await prisma.activity.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      type: 'lead_created',
      description: `Lead "${parsed.data.title}" created`,
      leadId: lead.id,
    },
  });

  // Fire webhook asynchronously — don't block the response
  fireWebhook(ctx.tenantId, 'lead.created', { lead }).catch(() => {});

  return NextResponse.json(apiSuccess(lead), { status: 201 });
}
