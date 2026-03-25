import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext, assertTenantOwnership } from '@/lib/tenant';
import { apiSuccess, apiError } from '@/lib/api';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireTenantContext();
    const org = await prisma.organization.findFirst({
      where: { id: params.id, tenantId: ctx.tenantId, isDeleted: false },
      include: {
        contacts: { where: { isDeleted: false }, take: 20 },
        leads: { where: { isDeleted: false }, take: 10 },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        followUps: { where: { isDeleted: false }, orderBy: { dueAt: 'asc' }, take: 10 },
        renewalEvents: { orderBy: { renewalDate: 'asc' }, take: 5 },
        contractRecords: { take: 5 },
        documents: { where: { isDeleted: false }, take: 10 },
      },
    });
    if (!org) return apiError('Not found', 404);
    return apiSuccess(org);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to fetch organization', 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireTenantContext();
    await assertTenantOwnership('organization', params.id, ctx.tenantId);
    const body = await req.json();

    const org = await prisma.organization.update({
      where: { id: params.id },
      data: { ...body, updatedBy: ctx.userId },
    });

    return apiSuccess(org);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    if (err.message === 'NOT_FOUND') return apiError('Not found', 404);
    return apiError('Failed to update organization', 500);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireTenantContext();
    await assertTenantOwnership('organization', params.id, ctx.tenantId);

    await prisma.organization.update({
      where: { id: params.id },
      data: { isDeleted: true, updatedBy: ctx.userId },
    });

    return apiSuccess({ deleted: true });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    if (err.message === 'NOT_FOUND') return apiError('Not found', 404);
    return apiError('Failed to delete organization', 500);
  }
}
