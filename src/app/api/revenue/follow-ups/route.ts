import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError, buildPagination, buildPaginatedResponse } from '@/lib/api';

// GET /api/revenue/follow-ups
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const { skip, limit, page } = buildPagination(req.nextUrl.searchParams);
    const status = req.nextUrl.searchParams.get('status');
    const priority = req.nextUrl.searchParams.get('priority');
    const overdue = req.nextUrl.searchParams.get('overdue') === 'true';

    const where: any = { tenantId: ctx.tenantId, isDeleted: false };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (overdue) where.dueAt = { lt: new Date() };

    const [followUps, total] = await Promise.all([
      prisma.followUp.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
        include: {
          organization: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          lead: { select: { id: true, title: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.followUp.count({ where }),
    ]);

    return apiSuccess(buildPaginatedResponse(followUps, total, page, limit));
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to fetch follow-ups', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const body = await req.json();

    const followUp = await prisma.followUp.create({
      data: { ...body, tenantId: ctx.tenantId, createdBy: ctx.userId },
    });

    await prisma.activity.create({
      data: {
        tenantId: ctx.tenantId,
        type: 'follow_up_created',
        description: `Follow-up scheduled: ${followUp.title}`,
        organizationId: followUp.organizationId ?? undefined,
        contactId: followUp.contactId ?? undefined,
        leadId: followUp.leadId ?? undefined,
        userId: ctx.userId,
      },
    });

    return apiSuccess(followUp, 201);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to create follow-up', 500);
  }
}
