'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Building2, RefreshCw, AlertCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RenewalStatusBadge } from '@/components/crm/renewal-status-badge';
import { RiskScoreBadge } from '@/components/crm/risk-score-badge';
import { useDebounce } from '@/hooks/use-debounce';
import { format } from 'date-fns';

interface Organization {
  id: string;
  name: string;
  industry?: string;
  country?: string;
  email?: string;
  phone?: string;
  contractValue?: number;
  renewalDate?: string;
  renewalStatus: string;
  nextFollowUpAt?: string;
  followUpStatus: string;
  followUpPriority: string;
  riskScore?: number;
  _count: { contacts: number; leads: number };
}

interface PaginatedResponse {
  data: Organization[];
  meta: { total: number; page: number; pages: number };
}

export function OrganizationsPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    const res = await fetch(`/api/crm/organizations?${params}`);
    const json = await res.json();
    setData(json.data);
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="text-sm text-muted-foreground">{data?.meta.total ?? 0} organizations</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/crm/organizations/new">
            <Plus className="h-4 w-4 mr-1.5" /> Add Company
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3">Company</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Industry</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Renewal</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Next Follow-Up</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Risk</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">People</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton-pulse h-4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No companies found</p>
                    <Button size="sm" variant="outline" className="mt-3" asChild>
                      <Link href="/crm/organizations/new">Add your first company</Link>
                    </Button>
                  </td>
                </tr>
              ) : (
                data?.data.map((org) => (
                  <tr key={org.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/crm/organizations/${org.id}`} className="group">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{org.name}</p>
                        {org.email && <p className="text-xs text-muted-foreground">{org.email}</p>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">{org.industry ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-1">
                        {org.renewalDate && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(org.renewalDate), 'MMM d, yyyy')}
                          </p>
                        )}
                        <RenewalStatusBadge status={org.renewalStatus} />
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {org.nextFollowUpAt ? (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(org.nextFollowUpAt), 'MMM d')}
                        </p>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <RiskScoreBadge score={org.riskScore ?? 0} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {org._count.contacts}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              Page {data.meta.page} of {data.meta.pages}
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page >= data.meta.pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
