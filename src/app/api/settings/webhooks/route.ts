import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError } from '@/lib/api';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    const webhooks = await prisma.webhook.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return apiSuccess(webhooks);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to fetch webhooks', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(apiError('Validation failed', 400, parsed.error.flatten()), { status: 400 });
    }

    const webhook = await prisma.webhook.create({
      data: {
        tenantId: ctx.tenantId,
        ...parsed.data,
      },
    });

    return NextResponse.json(apiSuccess(webhook), { status: 201 });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to create webhook', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(apiError('Validation failed', 400, parsed.error.flatten()), { status: 400 });
    }

    const { id, ...data } = parsed.data;
    const webhook = await prisma.webhook.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data,
    });

    return apiSuccess({ updated: webhook.count > 0 });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to update webhook', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const { id } = await req.json();
    if (!id) return NextResponse.json(apiError('Missing id', 400), { status: 400 });

    await prisma.webhook.deleteMany({
      where: { id, tenantId: ctx.tenantId },
    });

    return apiSuccess({ deleted: true });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to delete webhook', 500);
  }
}
