import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError, buildPagination, buildPaginatedResponse } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const { skip, limit, page } = buildPagination(req.nextUrl.searchParams);
    const type = req.nextUrl.searchParams.get('type');

    const where: any = { tenantId: ctx.tenantId };
    if (type) where.type = type;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, avatarUrl: true } },
          organization: { select: { name: true } },
          lead: { select: { title: true } },
          contact: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    return apiSuccess(buildPaginatedResponse(activities, total, page, limit));
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to fetch activities', 500);
  }
}
