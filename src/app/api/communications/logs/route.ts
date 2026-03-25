import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') ?? '30', 10));

    // Get webhook IDs for this tenant
    const webhooks = await prisma.webhook.findMany({
      where: { tenantId: ctx.tenantId },
      select: { id: true },
    });

    const webhookIds = webhooks.map((w: { id: string }) => w.id);

    if (webhookIds.length === 0) {
      return apiSuccess([]);
    }

    const logs = await prisma.webhookLog.findMany({
      where: { webhookId: { in: webhookIds } },
      orderBy: { sentAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        webhook: { select: { name: true, url: true } },
      },
    });

    return apiSuccess(logs);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to fetch logs', 500);
  }
}
