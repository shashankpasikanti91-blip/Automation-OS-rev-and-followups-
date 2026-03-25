'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { RenewalStatusBadge } from '@/components/crm/renewal-status-badge';
import { cn } from '@/lib/utils';

interface Renewal {
  id: string;
  renewalDate: string;
  renewalStatus: string;
  contractValue?: number;
  currency?: string;
  entityType: string;
  organization?: { name: string; riskScore?: number };
  contact?: { firstName: string; lastName: string };
}

export function RenewalTable() {
  const [items, setItems] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/revenue/renewals?limit=20');
    const json = await res.json();
    setItems(json.data?.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const daysLabel = (date: string) => {
    const d = differenceInDays(new Date(date), new Date());
    if (d < 0) return { label: `${Math.abs(d)}d overdue`, cls: 'text-red-500' };
    if (d === 0) return { label: 'Today', cls: 'text-orange-500' };
    if (d <= 7) return { label: `${d}d`, cls: 'text-amber-500' };
    return { label: `${d}d`, cls: 'text-muted-foreground' };
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Upcoming Renewals</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-3">Client</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Renewal Date</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Value</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Days</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <RefreshCw className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No renewals found</p>
                </td>
              </tr>
            ) : items.map((item) => {
              const { label, cls } = daysLabel(item.renewalDate);
              return (
                <tr key={item.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">
                      {item.organization?.name ?? (item.contact ? `${item.contact.firstName} ${item.contact.lastName}` : '—')}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-sm text-muted-foreground">{format(new Date(item.renewalDate), 'MMM d, yyyy')}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {item.contractValue ? (
                      <p className="text-sm font-medium">{item.currency ?? '$'}{item.contractValue.toLocaleString()}</p>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <RenewalStatusBadge status={item.renewalStatus} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={cn('text-xs font-semibold', cls)}>{label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
