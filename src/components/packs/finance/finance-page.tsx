'use client';

import { useCallback, useEffect, useState } from 'react';
import { Receipt, Search, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface ServiceInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate?: string;
  status: string;
  organization?: { name: string };
}

const STATUS_VARIANTS: Record<string, string> = {
  DRAFT: 'ghost', SENT: 'info', PAID: 'success', OVERDUE: 'danger', VOID: 'warning', PARTIALLY_PAID: 'warning',
};

export function FinanceFlowPage() {
  const [invoices, setInvoices] = useState<ServiceInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    const res = await fetch(`/api/packs/finance/invoices?${params}`);
    if (!res.ok) { setLoading(false); return; }
    const json = await res.json();
    setInvoices(json.data?.data ?? []);
    setTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const outstanding = invoices
    .filter((i) => ['SENT', 'OVERDUE', 'PARTIALLY_PAID'].includes(i.status))
    .reduce((sum, i) => sum + (i.amount ?? 0), 0);
  const paidCount = invoices.filter((i) => i.status === 'PAID').length;
  const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-400" />
            FinanceFlow
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Service invoices & payments</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Invoice</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-amber-400">{formatCurrency(outstanding)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-red-400">{overdueCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 col-span-2 lg:col-span-1">
          <p className="text-xs text-muted-foreground">Paid (loaded)</p>
          <p className="text-2xl font-bold text-emerald-400">{paidCount}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search invoices…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Client</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Due Date</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>)}
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center"><AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No invoices found</p></td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className={`border-b hover:bg-muted/20 ${inv.status === 'OVERDUE' ? 'bg-red-500/5' : ''}`}>
                  <td className="px-4 py-3 text-sm font-mono font-medium">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">{inv.organization?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-right">{formatCurrency(inv.amount, inv.currency)}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">{inv.dueDate ? format(new Date(inv.dueDate), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[inv.status] as 'ghost' | 'success' | 'danger' | 'warning' | 'info' | undefined}>{inv.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Showing {invoices.length} of {total}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <Button variant="outline" size="sm" disabled={invoices.length < 20} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
