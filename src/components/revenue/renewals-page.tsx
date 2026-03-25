'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, Filter, Plus, Calendar, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { RenewalStatusBadge } from '@/components/crm/renewal-status-badge';
import { RiskScoreBadge } from '@/components/crm/risk-score-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AiGenerateDialog } from '@/components/revenue/ai-generate-dialog';
import { cn } from '@/lib/utils';

interface Renewal {
  id: string;
  renewalDate: string;
  renewalStatus: string;
  contractValue?: number;
  currency?: string;
  entityType: string;
  organization?: { id: string; name: string; riskScore?: number };
  contact?: { id: string; firstName: string; lastName: string };
}

export function RenewalsPage() {
  const [items, setItems] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [daysAhead, setDaysAhead] = useState('90');
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTarget, setAiTarget] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', daysAhead });
    if (status) params.set('status', status);
    if (search) params.set('search', search);

    const res = await fetch(`/api/revenue/renewals?${params}`);
    const json = await res.json();
    setItems(json.data?.data ?? []);
    setTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [page, status, search, daysAhead]);

  useEffect(() => { load(); }, [load]);

  const openAi = (item: Renewal) => {
    const name = item.organization?.name ?? (item.contact ? `${item.contact.firstName} ${item.contact.lastName}` : 'Client');
    const id = item.organization?.id ?? item.contact?.id ?? item.id;
    setAiTarget({ id, name });
    setAiOpen(true);
  };

  const daysLabel = (date: string) => {
    const d = differenceInDays(new Date(date), new Date());
    if (d < 0) return { label: `${Math.abs(d)}d overdue`, cls: 'text-red-500 font-semibold' };
    if (d === 0) return { label: 'Today', cls: 'text-orange-500 font-semibold' };
    if (d <= 7) return { label: `${d}d`, cls: 'text-amber-500' };
    if (d <= 30) return { label: `${d}d`, cls: 'text-yellow-500' };
    return { label: `${d}d`, cls: 'text-muted-foreground' };
  };

  const totalRevenue = items.reduce((sum, i) => sum + (i.contractValue ?? 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-emerald-400" />
            Renewals
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track and manage contract renewals
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Renewal
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Renewals</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">At Stake</p>
          <p className="text-2xl font-bold text-emerald-400">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground">Window</p>
          <p className="text-2xl font-bold">{daysAhead}d</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search renewals…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44">
            <Filter className="h-3.5 w-3.5 mr-1 opacity-60" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
            <SelectItem value="DUE">Due</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="RENEWED">Renewed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={daysAhead} onValueChange={setDaysAhead}>
          <SelectTrigger className="w-36">
            <Calendar className="h-3.5 w-3.5 mr-1 opacity-60" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Next 7 days</SelectItem>
            <SelectItem value="30">Next 30 days</SelectItem>
            <SelectItem value="60">Next 60 days</SelectItem>
            <SelectItem value="90">Next 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Renewal Date</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Contract Value</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Risk</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Days</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No renewals found</p>
                  </td>
                </tr>
              ) : items.map((item) => {
                const { label, cls } = daysLabel(item.renewalDate);
                const name = item.organization?.name ?? (item.contact ? `${item.contact.firstName} ${item.contact.lastName}` : '—');
                return (
                  <tr key={item.id} className={cn('border-b hover:bg-muted/20 transition-colors', differenceInDays(new Date(item.renewalDate), new Date()) < 0 && 'bg-red-500/5')}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.entityType.toLowerCase()}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">
                      {format(new Date(item.renewalDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {item.contractValue
                        ? <span className="text-sm font-semibold">{item.currency ?? '$'}{item.contractValue.toLocaleString()}</span>
                        : <span className="text-muted-foreground text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3"><RenewalStatusBadge status={item.renewalStatus} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {item.organization?.riskScore != null
                        ? <RiskScoreBadge score={item.organization.riskScore} />
                        : <span className="text-muted-foreground text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={cn('text-xs font-semibold', cls)}>{label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => openAi(item)} className="gap-1.5 text-xs">
                        AI Remind
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
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

      {aiTarget && (
        <AiGenerateDialog
          open={aiOpen}
          onOpenChange={setAiOpen}
          type="renewal_reminder"
          entityId={aiTarget.id}
          entityName={aiTarget.name}
        />
      )}
    </div>
  );
}
