import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError } from '@/lib/api';
import { z } from 'zod';

const upsertSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  enabled: z.boolean(),
  config: z.record(z.any()).optional(),
});

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    const integrations = await prisma.integration.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { name: 'asc' },
    });
    return apiSuccess(integrations);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to fetch integrations', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const body = await req.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(apiError('Validation failed', 400, parsed.error.flatten()), { status: 400 });
    }

    const integration = await prisma.integration.upsert({
      where: {
        tenantId_key: { tenantId: ctx.tenantId, key: parsed.data.key },
      },
      create: {
        tenantId: ctx.tenantId,
        ...parsed.data,
      },
      update: {
        name: parsed.data.name,
        enabled: parsed.data.enabled,
        config: parsed.data.config ?? undefined,
      },
    });

    return apiSuccess(integration);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to save integration', 500);
  }
}
