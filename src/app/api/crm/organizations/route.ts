import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError, buildPagination, buildPaginatedResponse } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const { skip, limit, page } = buildPagination(req.nextUrl.searchParams);
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const status = req.nextUrl.searchParams.get('status');
    const minRisk = req.nextUrl.searchParams.get('minRisk');
    const hasContract = req.nextUrl.searchParams.get('hasContract');
    const sortBy = req.nextUrl.searchParams.get('sortBy');
    const sortOrder = (req.nextUrl.searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';

    const where = {
      tenantId: ctx.tenantId,
      isDeleted: false,
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(status ? { renewalStatus: status as any } : {}),
      ...(minRisk ? { riskScore: { gte: parseInt(minRisk, 10) } } : {}),
      ...(hasContract === 'true' ? { contractValue: { not: null, gt: 0 } } : {}),
    };

    const orderBy = sortBy === 'riskScore' ? { riskScore: sortOrder } : { updatedAt: 'desc' as const };

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { _count: { select: { contacts: true, leads: true } } },
      }),
      prisma.organization.count({ where }),
    ]);

    return apiSuccess(buildPaginatedResponse(organizations, total, page, limit));
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to fetch organizations', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const body = await req.json();

    const org = await prisma.organization.create({
      data: {
        ...body,
        tenantId: ctx.tenantId,
        createdBy: ctx.userId,
      },
    });

    await prisma.activity.create({
      data: {
        tenantId: ctx.tenantId,
        type: 'organization_created',
        description: `Created organization: ${org.name}`,
        organizationId: org.id,
        userId: ctx.userId,
      },
    });

    return apiSuccess(org, 201);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to create organization', 500);
  }
}
