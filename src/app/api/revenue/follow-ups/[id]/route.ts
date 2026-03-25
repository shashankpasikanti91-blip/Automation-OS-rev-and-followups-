import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError } from '@/lib/api';
import { fireWebhook } from '@/lib/webhook';
import { z } from 'zod';

const patchSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'MISSED', 'SNOOZED', 'CANCELLED']).optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  notes: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(apiError('Validation failed', 400, parsed.error.flatten()), { status: 400 });

  const existing = await prisma.followUp.findFirst({ where: { id: params.id, tenantId: ctx.tenantId } });
  if (!existing) return NextResponse.json(apiError('Not found', 404), { status: 404 });

  const data: Record<string, unknown> = { ...parsed.data };

  // Auto-set completedAt when marking COMPLETED
  if (parsed.data.status === 'COMPLETED' && !parsed.data.completedAt) {
    data.completedAt = new Date().toISOString();
  }

  const updated = await prisma.followUp.update({ where: { id: params.id }, data });

  // If related to an org / contact, update the follow-up tracking fields
  if (updated.organizationId && parsed.data.status === 'COMPLETED') {
    await prisma.organization.update({
      where: { id: updated.organizationId },
      data: { lastFollowUpAt: new Date(), followUpStatus: 'COMPLETED' },
    });
  }

  // Log activity
  await prisma.activity.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      type: 'follow_up_updated',
      description: `Follow-up marked ${parsed.data.status ?? 'updated'}`,
      organizationId: updated.organizationId ?? undefined,
      contactId: updated.contactId ?? undefined,
    },
  });

  // Fire webhook for completed follow-ups
  if (parsed.data.status === 'COMPLETED') {
    fireWebhook(ctx.tenantId, 'followup.completed', { followUp: updated }).catch(() => {});
  }

  return NextResponse.json(apiSuccess(updated));
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);

  const item = await prisma.followUp.findFirst({
    where: { id: params.id, tenantId: ctx.tenantId },
    include: {
      organization: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      assignee: { select: { id: true, name: true } },
    },
  });

  if (!item) return NextResponse.json(apiError('Not found', 404), { status: 404 });

  return NextResponse.json(apiSuccess(item));
}
