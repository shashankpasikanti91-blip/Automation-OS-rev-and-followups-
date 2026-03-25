import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError } from '@/lib/api';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1),
  channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP']),
  subject: z.string().optional(),
  body: z.string().min(1),
  category: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const templates = await prisma.communicationTemplate.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return apiSuccess(templates);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to fetch templates', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(apiError('Validation failed', 400, parsed.error.flatten()), { status: 400 });

    const template = await prisma.communicationTemplate.create({
      data: {
        tenantId: ctx.tenantId,
        createdBy: ctx.userId,
        name: parsed.data.name,
        channel: parsed.data.channel,
        subject: parsed.data.subject,
        body: parsed.data.body,
        category: parsed.data.category ?? 'general',
      },
    });
    return apiSuccess(template, 201);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to create template', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const body = await req.json();
    if (!body.id) return NextResponse.json(apiError('Template id required', 400), { status: 400 });

    const existing = await prisma.communicationTemplate.findFirst({
      where: { id: body.id, tenantId: ctx.tenantId },
    });
    if (!existing) return NextResponse.json(apiError('Not found', 404), { status: 404 });

    const updated = await prisma.communicationTemplate.update({
      where: { id: body.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.channel !== undefined && { channel: body.channel }),
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(body.body !== undefined && { body: body.body }),
        ...(body.category !== undefined && { category: body.category }),
      },
    });

    return apiSuccess(updated);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to update template', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const body = await req.json();
    if (!body.id) return NextResponse.json(apiError('Template id required', 400), { status: 400 });

    const existing = await prisma.communicationTemplate.findFirst({
      where: { id: body.id, tenantId: ctx.tenantId },
    });
    if (!existing) return NextResponse.json(apiError('Not found', 404), { status: 404 });

    await prisma.communicationTemplate.delete({ where: { id: body.id } });
    return apiSuccess({ deleted: true });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to delete template', 500);
  }
}
