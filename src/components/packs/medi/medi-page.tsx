'use client';

import { useCallback, useEffect, useState } from 'react';
import { Heart, Calendar, Search, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  type: string;
  status: string;
  scheduledAt: string;
  patient?: { firstName: string; lastName: string };
  practitioner?: { firstName: string; lastName: string };
  notes?: string;
}

const STATUS_VARIANTS: Record<string, string> = {
  SCHEDULED: 'info', CONFIRMED: 'success', COMPLETED: 'success',
  CANCELLED: 'danger', NO_SHOW: 'danger', RESCHEDULED: 'warning',
};

export function MediFlowPage() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    const res = await fetch(`/api/packs/medi/appointments?${params}`);
    if (!res.ok) { setLoading(false); return; }
    const json = await res.json();
    setAppts(json.data?.data ?? []);
    setTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-400" />
            MediFlow
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Patient management & appointments</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Appointment</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Total Appointments</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Confirmed</p>
          <p className="text-2xl font-bold text-emerald-400">{appts.filter((a) => a.status === 'CONFIRMED').length}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search appointments…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Patient</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium">Scheduled</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(4)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>)}
                  </tr>
                ))
              ) : appts.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center"><AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No appointments</p></td></tr>
              ) : appts.map((a) => (
                <tr key={a.id} className="border-b hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm font-medium">{a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : '—'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">{a.type}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(a.scheduledAt), 'MMM d, HH:mm')}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[a.status] as 'ghost' | 'success' | 'danger' | 'warning' | 'info' | undefined}>{a.status}</Badge>
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
