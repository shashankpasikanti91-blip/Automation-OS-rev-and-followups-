import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError, buildPagination, buildPaginatedResponse } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const { skip, limit, page } = buildPagination(req.nextUrl.searchParams);
    const status = req.nextUrl.searchParams.get('status');
    const daysAhead = parseInt(req.nextUrl.searchParams.get('days') ?? '90', 10);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const where: any = { tenantId: ctx.tenantId };
    if (status) where.renewalStatus = status;
    else where.renewalDate = { lte: futureDate };

    const [renewals, total] = await Promise.all([
      prisma.renewalEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { renewalDate: 'asc' },
        include: {
          organization: { select: { id: true, name: true, riskScore: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.renewalEvent.count({ where }),
    ]);

    return apiSuccess(buildPaginatedResponse(renewals, total, page, limit));
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to fetch renewals', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const body = await req.json();

    const renewal = await prisma.renewalEvent.create({
      data: { ...body, tenantId: ctx.tenantId },
    });

    return apiSuccess(renewal, 201);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to create renewal', 500);
  }
}
