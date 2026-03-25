'use client';

import { useCallback, useEffect, useState } from 'react';
import { Briefcase, Search, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency?: string;
  organization?: { name: string };
}

const STATUS_VARIANTS: Record<string, string> = {
  PROPOSAL: 'warning', ACTIVE: 'success', ON_HOLD: 'warning', COMPLETED: 'info', CANCELLED: 'danger',
};

export function AgencyFlowPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    const res = await fetch(`/api/packs/agency/projects?${params}`);
    if (!res.ok) { setLoading(false); return; }
    const json = await res.json();
    setProjects(json.data?.data ?? []);
    setTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const active = projects.filter((p) => p.status === 'ACTIVE').length;
  const proposals = projects.filter((p) => p.status === 'PROPOSAL').length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-violet-400" />
            AgencyFlow
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Projects & proposals management</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Project</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active Projects</p>
          <p className="text-2xl font-bold text-emerald-400">{active}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Open Proposals</p>
          <p className="text-2xl font-bold text-amber-400">{proposals}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 col-span-2 lg:col-span-1">
          <p className="text-xs text-muted-foreground">Total Project Value</p>
          <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Project</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Client</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Budget</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Starts</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Ends</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>)}
                  </tr>
                ))
              ) : projects.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center"><AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No projects found</p></td></tr>
              ) : projects.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">{p.organization?.name ?? p.client}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-right">{p.budget ? formatCurrency(p.budget, p.currency) : '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">{p.startDate ? format(new Date(p.startDate), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">{p.endDate ? format(new Date(p.endDate), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[p.status] as 'ghost' | 'success' | 'danger' | 'warning' | 'info' | undefined}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
