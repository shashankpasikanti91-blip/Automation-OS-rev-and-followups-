import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') ?? '30', 10));

    const runs = await prisma.workflowRun.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        workflow: { select: { name: true } },
      },
    });

    return apiSuccess(runs);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to fetch workflow logs', 500);
  }
}
