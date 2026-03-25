import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface TenantContext {
  tenantId: string;
  userId: string;
  roles: string[];
  permissions: string[];
}

/**
 * Extracts the authenticated tenant context from the current request.
 * Returns null if the user is not authenticated.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return null;

  return {
    tenantId: session.user.tenantId,
    userId: session.user.id,
    roles: session.user.roles ?? [],
    permissions: session.user.permissions ?? [],
  };
}

/**
 * Enforces tenant context — use inside API route handlers.
 * Returns context or throws a 401/403 response.
 */
export async function requireTenantContext(session?: any): Promise<TenantContext> {
  if (session?.user?.tenantId) {
    return {
      tenantId: session.user.tenantId,
      userId: session.user.id,
      roles: session.user.roles ?? [],
      permissions: session.user.permissions ?? [],
    };
  }
  const ctx = await getTenantContext();
  if (!ctx) throw new Error('UNAUTHENTICATED');
  return ctx;
}

/**
 * Builds a standard tenant-scoped WHERE clause for Prisma queries.
 * CRITICAL: Always use this to prevent cross-tenant data leaks.
 */
export function tenantWhere(tenantId: string) {
  return { tenantId };
}

/**
 * Verify that an entity belongs to the tenant before returning / mutating.
 * Throws if the entity doesn't exist or belongs to a different tenant.
 */
export async function assertTenantOwnership(
  model: keyof typeof prisma,
  id: string,
  tenantId: string,
) {
  const record = await (prisma[model] as any).findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!record) throw new Error('NOT_FOUND');
  return record;
}

export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes('*') || permissions.includes(required);
}
