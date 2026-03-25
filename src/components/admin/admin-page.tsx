'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldAlert, Search, Users, FileText, AlertCircle, CheckCircle2, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  name?: string;
  email: string;
  status: string;
  userRoles: { role: { name: string } }[];
  lastLoginAt?: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  createdAt: string;
  user?: { name?: string; email: string };
}

const ROLE_VARIANTS: Record<string, string> = {
  SUPER_ADMIN: 'danger', ADMIN: 'warning', MANAGER: 'info', USER: 'ghost', VIEWER: 'ghost',
};

type Tab = 'users' | 'audit';

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [usersTotal, setUsersTotal] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: '1', limit: '50' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    const res = await fetch(`/api/admin/users?${params}`);
    if (!res.ok) { setLoading(false); return; }
    const json = await res.json();
    setUsers(json.data?.data ?? []);
    setUsersTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [debouncedSearch]);

  const loadAudit = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/audit?limit=50');
    if (!res.ok) { setLoading(false); return; }
    const json = await res.json();
    setAudit(json.data?.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'users') loadUsers();
    else loadAudit();
  }, [tab, loadUsers, loadAudit]);

  const toggleUser = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, status: newStatus }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: newStatus } : u));
      toast({ title: `User ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`, variant: 'success' });
    }
  };

  const changeRole = async (user: User, role: string) => {
    // Role changes would require a separate endpoint for UserRole management
    toast({ title: `Role change to ${role} — coming soon`, variant: 'default' });
  };

  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-400" />
          Admin Console
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">User management & audit logs</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold">{usersTotal}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-emerald-400">{activeUsers}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Inactive</p>
          <p className="text-2xl font-bold text-red-400">{usersTotal - activeUsers}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['users', 'audit'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(''); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize flex items-center gap-1.5
              ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t === 'users' ? <Users className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
            {t === 'users' ? 'Users' : 'Audit Log'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Role</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Last Login</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b">
                        {[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>)}
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center"><AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No users found</p></td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{u.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <select
                          value={u.userRoles?.[0]?.role?.name ?? 'USER'}
                          onChange={(e) => changeRole(u, e.target.value)}
                          className="text-xs border rounded px-2 py-1 bg-background"
                        >
                          {['VIEWER', 'USER', 'MANAGER', 'ADMIN'].map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                        {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        {u.status === 'ACTIVE'
                          ? <Badge variant="success" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
                          : <Badge variant="ghost" className="text-xs"><Ban className="h-3 w-3 mr-1" />{u.status}</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUser(u)}
                          className={u.status === 'ACTIVE' ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'}
                        >
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'audit' && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">User</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Resource</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">IP</th>
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b">
                      {[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>)}
                    </tr>
                  ))
                ) : audit.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center"><p className="text-sm text-muted-foreground">No audit logs</p></td></tr>
                ) : audit.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 text-sm font-medium">{log.action}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">{log.user?.name ?? log.user?.email ?? '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">{log.resource ?? '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground font-mono">{log.ipAddress ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
