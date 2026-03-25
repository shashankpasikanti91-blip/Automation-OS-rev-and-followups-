import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  companyName: z.string().min(1, 'Company name required'),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, password, companyName } = parsed.data;

  // Check if email already exists
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const slug = companyName.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-' + Date.now().toString(36);

  // Create tenant + settings + user + role in a transaction
  const result = await prisma.$transaction(async (tx: any) => {
    const tenant = await tx.tenant.create({
      data: {
        name: companyName,
        slug,
        settings: { create: {} },
      },
    });

    let adminRole = await tx.role.findFirst({ where: { name: 'ADMIN', tenantId: null } });
    if (!adminRole) {
      adminRole = await tx.role.create({
        data: { name: 'ADMIN', description: 'Administrator', permissions: ['*'], tenantId: tenant.id },
      });
    }

    const user = await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
        tenantId: tenant.id,
        userRoles: { create: { roleId: adminRole.id } },
      },
    });

    return { user, tenant };
  });

  return NextResponse.json(
    { message: 'Account created successfully', tenantSlug: result.tenant.slug },
    { status: 201 },
  );
}
