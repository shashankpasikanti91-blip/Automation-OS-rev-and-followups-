'use client';

import { useCallback, useEffect, useState } from 'react';
import { Briefcase, Users, Search, Plus, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { format } from 'date-fns';

interface Job {
  id: string;
  title: string;
  department?: string;
  location?: string;
  status: string;
  openDate?: string;
  closeDate?: string;
  headcount?: number;
}

const STATUS_VARIANTS: Record<string, string> = {
  OPEN: 'success', CLOSED: 'danger', ON_HOLD: 'warning', DRAFT: 'ghost', FILLED: 'info',
};

export function RecruitFlowPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (debouncedSearch) params.set('search', debouncedSearch);

    const res = await fetch(`/api/packs/recruit/jobs?${params}`);
    if (!res.ok) { setLoading(false); return; }
    const json = await res.json();
    setJobs(json.data?.data ?? []);
    setTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const openJobs = jobs.filter((j) => j.status === 'OPEN').length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-violet-400" />
            RecruitFlow
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Recruitment & talent acquisition</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Open Jobs</p>
          <p className="text-2xl font-bold text-emerald-400">{openJobs}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-amber-400" /> Total Roles</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Headcount</p>
          <p className="text-2xl font-bold">{jobs.reduce((s, j) => s + (j.headcount ?? 1), 0)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search jobs…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Job Title</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Department</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Location</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Closes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No jobs found</p>
                  </td>
                </tr>
              ) : jobs.map((job) => (
                <tr key={job.id} className="border-b hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm font-medium">{job.title}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">{job.department ?? '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">{job.location ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[job.status] as 'ghost' | 'success' | 'danger' | 'warning' | 'info' | undefined}>{job.status}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                    {job.closeDate ? format(new Date(job.closeDate), 'MMM d, yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
            <span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
