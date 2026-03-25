import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantSlug: z.string().optional(),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/login', error: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantSlug: { label: 'Workspace', type: 'text' },
      },
      async authorize(credentials: any) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password, tenantSlug } = parsed.data;

        const user = await prisma.user.findFirst({
          where: {
            email,
            status: 'ACTIVE',
            tenant: tenantSlug ? { slug: tenantSlug, status: { not: 'CANCELLED' } } : { status: { not: 'CANCELLED' } },
          },
          include: {
            tenant: { include: { settings: true } },
            userRoles: { include: { role: true } },
          },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl ?? null,
          tenantId: user.tenantId,
          tenantSlug: user.tenant.slug,
          tenantName: user.tenant.name,
          language: user.language,
          timezone: user.timezone ?? user.tenant.settings?.timezone ?? 'UTC',
          currency: user.tenant.settings?.currency ?? 'USD',
          country: user.tenant.settings?.country ?? 'US',
          roles: user.userRoles.map((ur: any) => ur.role.name),
          permissions: user.userRoles.flatMap((ur: any) => ur.role.permissions as string[]),
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }: { user: any; account: any }) {
      if (account?.provider === 'google') {
        const email = user.email;
        if (!email) return false;

        let existing = await prisma.user.findFirst({
          where: { email, status: 'ACTIVE' },
          include: {
            tenant: { include: { settings: true } },
            userRoles: { include: { role: true } },
          },
        });

        if (!existing) {
          // Auto-create tenant + user for new Google sign-ups
          const slug = email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();
          const tenant = await prisma.tenant.create({
            data: {
              name: user.name ?? slug,
              slug: `${slug}-${Date.now().toString(36)}`,
              settings: { create: {} },
            },
          });
          const defaultRole = await prisma.role.findFirst({ where: { name: 'ADMIN', tenantId: null as any } })
            ?? await prisma.role.create({ data: { name: 'ADMIN', description: 'Administrator', permissions: ['*'], tenantId: tenant.id } });

          existing = await prisma.user.create({
            data: {
              email,
              name: user.name ?? email.split('@')[0],
              passwordHash: '',
              tenantId: tenant.id,
              avatarUrl: user.image,
              userRoles: { create: { roleId: defaultRole.id } },
            },
            include: {
              tenant: { include: { settings: true } },
              userRoles: { include: { role: true } },
            },
          });
        }

        // Attach tenant data to user object for JWT callback
        (user as any).id = existing.id;
        (user as any).tenantId = existing.tenantId;
        (user as any).tenantSlug = existing.tenant.slug;
        (user as any).tenantName = existing.tenant.name;
        (user as any).language = existing.language;
        (user as any).timezone = existing.timezone ?? existing.tenant.settings?.timezone ?? 'UTC';
        (user as any).currency = existing.tenant.settings?.currency ?? 'USD';
        (user as any).country = existing.tenant.settings?.country ?? 'US';
        (user as any).roles = existing.userRoles.map((ur: any) => ur.role.name);
        (user as any).permissions = existing.userRoles.flatMap((ur: any) => ur.role.permissions as string[]);
        return true;
      }
      return true;
    },
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.tenantId = (user as any).tenantId;
        token.tenantSlug = (user as any).tenantSlug;
        token.tenantName = (user as any).tenantName;
        token.language = (user as any).language;
        token.timezone = (user as any).timezone;
        token.currency = (user as any).currency;
        token.country = (user as any).country;
        token.roles = (user as any).roles;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.user.id = token.id as string;
      session.user.tenantId = token.tenantId as string;
      session.user.tenantSlug = token.tenantSlug as string;
      session.user.tenantName = token.tenantName as string;
      session.user.language = token.language as string;
      session.user.timezone = token.timezone as string;
      session.user.currency = token.currency as string;
      session.user.country = token.country as string;
      session.user.roles = token.roles as string[];
      session.user.permissions = token.permissions as string[];
      return session;
    },
  },
};

export default NextAuth(authOptions);
