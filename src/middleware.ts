import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = ['/login', '/signup', '/api/auth', '/_next', '/favicon.ico', '/public', '/marketing', '/pricing'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow root marketing page
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Inject tenant headers for downstream use
  const res = NextResponse.next();
  res.headers.set('x-tenant-id', (token.tenantId as string) ?? '');
  res.headers.set('x-user-id', (token.id as string) ?? '');
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
