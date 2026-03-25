import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError, buildPagination, buildPaginatedResponse } from '@/lib/api';
import { fireWebhook } from '@/lib/webhook';
import { z } from 'zod';

const createSchema = z.object({
  channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'PHONE', 'IN_APP']),
  direction: z.enum(['OUTBOUND', 'INBOUND']).default('OUTBOUND'),
  subject: z.string().optional(),
  body: z.string().min(1, 'Message body is required'),
  organizationId: z.string().optional(),
  contactId: z.string().optional(),
  leadId: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);
  const { searchParams } = new URL(req.url);
  const { skip, take, page, limit } = buildPagination(searchParams);
  const channel = searchParams.get('channel');
  const status = searchParams.get('status');

  const where: any = {
    tenantId: ctx.tenantId,
    ...(channel && { channel }),
    ...(status && { status }),
  };

  const [comms, total] = await Promise.all([
    prisma.communication.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.communication.count({ where }),
  ]);

  return apiSuccess(buildPaginatedResponse(comms, total, page, limit));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(apiError('Validation failed', 400, parsed.error.flatten()), { status: 400 });

  const { channel, direction, subject, body: messageBody, organizationId, contactId, leadId } = parsed.data;

  // Always create as DRAFT — status must be advanced through explicit actions
  const comm = await prisma.communication.create({
    data: {
      tenantId: ctx.tenantId,
      channel,
      direction,
      subject,
      body: messageBody,
      status: 'DRAFT',
      organizationId: organizationId ?? undefined,
      contactId: contactId ?? undefined,
      leadId: leadId ?? undefined,
    },
  });

  await prisma.activity.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      type: 'communication_drafted',
      description: `${channel} draft created: ${subject ?? messageBody.slice(0, 50)}`,
      organizationId: organizationId ?? undefined,
      contactId: contactId ?? undefined,
      leadId: leadId ?? undefined,
    },
  });

  return NextResponse.json(apiSuccess(comm), { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);
  const body = await req.json();

  if (!body.id) return NextResponse.json(apiError('Communication id required', 400), { status: 400 });

  const comm = await prisma.communication.findFirst({
    where: { id: body.id, tenantId: ctx.tenantId },
  });

  if (!comm) return NextResponse.json(apiError('Not found', 404), { status: 404 });

  // Handle send request
  if (body.action === 'send') {
    // Check if an integration exists for this channel
    const channelKey = comm.channel === 'EMAIL' ? 'smtp' : comm.channel === 'WHATSAPP' ? 'whatsapp' : comm.channel === 'SMS' ? 'twilio' : null;

    if (channelKey) {
      const integration = await prisma.integration.findFirst({
        where: { tenantId: ctx.tenantId, key: channelKey, enabled: true },
      });

      if (!integration) {
        return NextResponse.json(
          apiError(`No ${comm.channel.toLowerCase()} integration connected. Go to Settings → Integrations to set up.`, 422),
          { status: 422 }
        );
      }
    }

    // Mark as QUEUED — actual sending would be handled by a worker/webhook
    const updated = await prisma.communication.update({
      where: { id: body.id },
      data: { status: 'QUEUED' },
    });

    // Fire webhook so n8n or external service can handle actual delivery
    fireWebhook(ctx.tenantId, 'communication.send_requested', {
      communicationId: updated.id,
      channel: updated.channel,
      subject: updated.subject,
      body: updated.body,
    }).catch(() => {});

    return NextResponse.json(apiSuccess(updated));
  }

  // Generic update (edit draft)
  if (comm.status !== 'DRAFT') {
    return NextResponse.json(apiError('Only drafts can be edited', 422), { status: 422 });
  }

  const updated = await prisma.communication.update({
    where: { id: body.id },
    data: {
      ...(body.subject !== undefined && { subject: body.subject }),
      ...(body.body !== undefined && { body: body.body }),
      ...(body.channel !== undefined && { channel: body.channel }),
    },
  });

  return NextResponse.json(apiSuccess(updated));
}
