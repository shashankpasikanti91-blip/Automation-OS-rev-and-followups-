import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError } from '@/lib/api';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  timezone: z.string().optional(),
  defaultLanguage: z.string().optional(),
  currency: z.string().optional(),
  country: z.string().optional(),
  dateFormat: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);

  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    include: { settings: true, subscriptions: { include: { plan: true } } },
  });

  if (!tenant) return NextResponse.json(apiError('Tenant not found', 404), { status: 404 });

  return NextResponse.json(apiSuccess(tenant));
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(apiError('Validation failed', 400, parsed.error.flatten()), { status: 400 });

  const { name, ...settingsData } = parsed.data;

  const updates = await Promise.all([
    ...(name ? [prisma.tenant.update({ where: { id: ctx.tenantId }, data: { name } })] : []),
    ...(Object.keys(settingsData).length > 0
      ? [prisma.tenantSettings.upsert({
          where: { tenantId: ctx.tenantId },
          create: { tenantId: ctx.tenantId, ...settingsData },
          update: settingsData,
        })]
      : []),
  ]);

  return NextResponse.json(apiSuccess({ updated: true }));
}
