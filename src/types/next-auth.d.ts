/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── next-auth core ─────────────────────────────────────────────────────────
declare module 'next-auth' {
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    language: string;
    timezone: string;
    currency: string;
    country: string;
    roles: string[];
    permissions: string[];
  }

  interface Session {
    user: User & {
      email: string;
      name?: string | null;
      image?: string | null;
    };
    expires: string;
  }

  interface Account {
    provider: string;
    type: string;
    providerAccountId: string;
    access_token?: string;
    token_type?: string;
    id_token?: string;
    refresh_token?: string;
    scope?: string;
    expires_at?: number;
    session_state?: string;
  }

  interface Profile {
    sub?: string;
    name?: string;
    email?: string;
    image?: string;
  }

  type AuthOptions = NextAuthOptions;

  interface NextAuthOptions {
    providers: any[];
    session?: any;
    pages?: any;
    callbacks?: any;
    events?: any;
    adapter?: any;
    debug?: boolean;
    secret?: string;
    theme?: any;
    jwt?: any;
  }

  function getServerSession(...args: any[]): Promise<Session | null>;
  export default function NextAuth(options: NextAuthOptions): any;
  export { getServerSession, NextAuthOptions, Session, User, Account, Profile };
}

// ─── next-auth/react ────────────────────────────────────────────────────────
declare module 'next-auth/react' {
  import { Session } from 'next-auth';

  interface SessionProviderProps {
    children: React.ReactNode;
    session?: Session | null;
    basePath?: string;
    refetchInterval?: number;
    refetchOnWindowFocus?: boolean;
    refetchWhenOffline?: false;
  }

  function SessionProvider(props: SessionProviderProps): JSX.Element;
  function signIn(provider?: string, options?: Record<string, any>): Promise<any>;
  function signOut(options?: Record<string, any>): Promise<any>;
  function useSession(): { data: Session | null; status: 'loading' | 'authenticated' | 'unauthenticated'; update: (data?: any) => Promise<Session | null> };
  function getSession(params?: { broadcast?: boolean }): Promise<Session | null>;
  function getCsrfToken(): Promise<string>;

  export { SessionProvider, SessionProviderProps, signIn, signOut, useSession, getSession, getCsrfToken };
}

// ─── next-auth/jwt ──────────────────────────────────────────────────────────
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    language: string;
    timezone: string;
    currency: string;
    country: string;
    roles: string[];
    permissions: string[];
    [key: string]: any;
  }

  function getToken(params: { req: any; secret?: string; secureCookie?: boolean }): Promise<JWT | null>;
  export { JWT, getToken };
}

// ─── next-auth providers ────────────────────────────────────────────────────
declare module 'next-auth/providers/credentials' {
  interface CredentialInput {
    label?: string;
    type?: string;
    value?: string;
    placeholder?: string;
  }
  interface CredentialsConfig {
    name?: string;
    credentials: Record<string, CredentialInput>;
    authorize(credentials: any, req?: any): Promise<any>;
  }
  export default function CredentialsProvider(options: CredentialsConfig): any;
}

declare module 'next-auth/providers/google' {
  interface GoogleProviderConfig {
    clientId: string;
    clientSecret: string;
    authorization?: any;
    profile?: (profile: any) => any;
  }
  export default function GoogleProvider(options: GoogleProviderConfig): any;
}
