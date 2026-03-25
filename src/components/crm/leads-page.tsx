'use client';

import { useCallback, useEffect, useState } from 'react';
import { TrendingUp, Search, Plus, Filter, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimatedValue?: number;
  currency?: string;
  organization?: { name: string };
  contact?: { firstName: string; lastName: string };
  assignedUser?: { firstName: string; lastName: string };
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'info',
  CONTACTED: 'ghost',
  QUALIFIED: 'warning',
  PROPOSAL_SENT: 'warning',
  NEGOTIATING: 'warning',
  WON: 'success',
  LOST: 'danger',
  DISQUALIFIED: 'ghost',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'ghost',
};

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    source: '',
    status: 'NEW',
    value: '',
    currency: 'USD',
    expectedCloseDate: '',
  });

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (status) params.set('status', status);

    const res = await fetch(`/api/crm/leads?${params}`);
    const json = await res.json();
    setLeads(json.data?.data ?? []);
    setTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [page, debouncedSearch, status]);

  useEffect(() => { load(); }, [load]);

  const createLead = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const body: Record<string, any> = {
        title: form.title.trim(),
        status: form.status,
        currency: form.currency,
      };
      if (form.description.trim()) body.description = form.description.trim();
      if (form.source.trim()) body.source = form.source.trim();
      if (form.value && !isNaN(Number(form.value))) body.value = Number(form.value);
      if (form.expectedCloseDate) body.expectedCloseDate = new Date(form.expectedCloseDate).toISOString();

      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({ title: 'Lead created', variant: 'success' });
        setForm({ title: '', description: '', source: '', status: 'NEW', value: '', currency: 'USD', expectedCloseDate: '' });
        setDialogOpen(false);
        load();
      } else {
        const json = await res.json();
        toast({ title: json.error ?? 'Failed to create lead', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    }
    setCreating(false);
  };

  const totalPipeline = leads.filter((l) => !['WON', 'LOST', 'DISQUALIFIED'].includes(l.status))
    .reduce((s, l) => s + (l.estimatedValue ?? 0), 0);
  const wonValue = leads.filter((l) => l.status === 'WON').reduce((s, l) => s + (l.estimatedValue ?? 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} leads in pipeline</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>Add a new lead to your pipeline</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="lead-title">Title *</Label>
                <Input id="lead-title" placeholder="e.g. Acme Corp — Annual Renewal" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-desc">Description</Label>
                <Textarea id="lead-desc" placeholder="Brief description…" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="CONTACTED">Contacted</SelectItem>
                      <SelectItem value="QUALIFIED">Qualified</SelectItem>
                      <SelectItem value="PROPOSAL">Proposal</SelectItem>
                      <SelectItem value="NURTURING">Nurturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Input placeholder="e.g. Referral, Website" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Estimated Value</Label>
                  <Input type="number" placeholder="0" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['USD', 'MYR', 'SGD', 'AED', 'INR', 'PHP', 'IDR', 'GBP', 'EUR', 'AUD'].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Expected Close Date</Label>
                <Input type="date" value={form.expectedCloseDate} onChange={(e) => setForm((f) => ({ ...f, expectedCloseDate: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createLead} disabled={creating || !form.title.trim()} className="gap-1.5">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pipeline Value</p>
          <p className="text-2xl font-bold text-violet-400">${totalPipeline.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Won This Page</p>
          <p className="text-2xl font-bold text-emerald-400">${wonValue.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44">
            <Filter className="h-3.5 w-3.5 mr-1 opacity-60" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="CONTACTED">Contacted</SelectItem>
            <SelectItem value="QUALIFIED">Qualified</SelectItem>
            <SelectItem value="PROPOSAL">Proposal</SelectItem>
            <SelectItem value="WON">Won</SelectItem>
            <SelectItem value="LOST">Lost</SelectItem>
            <SelectItem value="NURTURING">Nurturing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Lead</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Priority</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Value</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No leads found</p>
                  </td>
                </tr>
              ) : leads.map((lead) => (
                <tr key={lead.id} className={cn('border-b hover:bg-muted/20 transition-colors cursor-pointer', lead.status === 'WON' && 'bg-emerald-500/5', lead.status === 'LOST' && 'bg-red-500/5')}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{lead.title}</p>
                    <p className="text-xs text-muted-foreground">{lead.organization?.name ?? lead.contact ? `${lead.contact?.firstName} ${lead.contact?.lastName}` : '—'}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant={STATUS_COLORS[lead.status] as 'ghost' | 'success' | 'warning' | 'danger' | 'info' | undefined}>{lead.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant={PRIORITY_COLORS[lead.priority] as 'ghost' | 'success' | 'warning' | 'danger' | 'info' | undefined}>{lead.priority}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm">
                    {lead.estimatedValue ? `${lead.currency ?? '$'}${lead.estimatedValue.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                    {lead.assignedUser ? `${lead.assignedUser.firstName} ${lead.assignedUser.lastName}` : 'Unassigned'}
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
