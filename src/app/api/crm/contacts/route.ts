import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError, buildPagination, buildPaginatedResponse } from '@/lib/api';
import { z } from 'zod';

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  organizationId: z.string().optional(),
  language: z.string().optional(),
  country: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);
  const { searchParams } = new URL(req.url);

  const { skip, take, page, limit } = buildPagination(searchParams);
  const search = searchParams.get('search') ?? '';
  const orgId = searchParams.get('organizationId');

  const where = {
    tenantId: ctx.tenantId,
    isDeleted: false,
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(orgId && { organizationId: orgId }),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true } },
      },
    }),
    prisma.contact.count({ where }),
  ]);

  return apiSuccess(buildPaginatedResponse(contacts, total, page, limit));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(apiError('Unauthorized', 401), { status: 401 });

  const ctx = await requireTenantContext(session);
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(apiError('Validation failed', 400, parsed.error.flatten()), { status: 400 });

  const contact = await prisma.contact.create({
    data: { tenantId: ctx.tenantId, ...parsed.data },
  });

  await prisma.activity.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      type: 'contact_created',
      description: `Contact ${parsed.data.firstName} ${parsed.data.lastName} created`,
      contactId: contact.id,
    },
  });

  return NextResponse.json(apiSuccess(contact), { status: 201 });
}
