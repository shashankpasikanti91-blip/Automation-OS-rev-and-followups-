'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, Plus, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AiGenerateDialog } from '@/components/revenue/ai-generate-dialog';

interface FollowUp {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt: string;
  channel?: string;
  aiGenerated: boolean;
  organization?: { name: string };
  contact?: { firstName: string; lastName: string };
  assignee?: { name: string };
}

const priorityClass: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-600 dark:text-red-400',
  HIGH:     'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  MEDIUM:   'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  LOW:      'bg-muted text-muted-foreground',
};

const statusClass: Record<string, string> = {
  PENDING:   'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  COMPLETED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  MISSED:    'bg-red-500/10 text-red-600 dark:text-red-400',
  SNOOZED:   'bg-muted text-muted-foreground',
};

interface FollowUpTableProps {
  externalStatus?: string;
  externalPriority?: string;
  externalSearch?: string;
}

export function FollowUpTable({ externalStatus, externalPriority, externalSearch }: FollowUpTableProps) {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiDialog, setAiDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FollowUp | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '20' });
    if (externalStatus) params.set('status', externalStatus);
    if (externalPriority) params.set('priority', externalPriority);
    if (externalSearch) params.set('search', externalSearch);
    const res = await fetch(`/api/revenue/follow-ups?${params}`);
    const json = await res.json();
    setItems(json.data?.data ?? []);
    setLoading(false);
  }, [externalStatus, externalPriority, externalSearch]);

  useEffect(() => { load(); }, [load]);

  const markComplete = async (id: string) => {
    await fetch(`/api/revenue/follow-ups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED', completedAt: new Date().toISOString() }),
    });
    load();
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Pending Follow-Ups</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setAiDialog(true)}>
            <Zap className="h-3.5 w-3.5 mr-1.5" /> AI Generate
          </Button>
          <Button size="sm" asChild>
            <Link href="/revenue/follow-ups/new">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add
            </Link>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Entity</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Priority</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Status</th>
              <th className="text-left px-4 py-3">Due</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No follow-ups</p>
                </td>
              </tr>
            ) : items.map((item) => {
              const isOverdue = item.status === 'PENDING' && new Date(item.dueAt) < new Date();
              return (
                <tr key={item.id} className={cn('border-b transition-colors hover:bg-muted/20', isOverdue && 'bg-red-500/5')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.aiGenerated && <Zap className="h-3 w-3 text-primary shrink-0" />}
                    </div>
                    {item.channel && <p className="text-xs text-muted-foreground capitalize">{item.channel}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-sm text-muted-foreground">
                      {item.organization?.name ?? (item.contact ? `${item.contact.firstName} ${item.contact.lastName}` : '—')}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', priorityClass[item.priority])}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusClass[item.status])}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className={cn('text-xs font-medium', isOverdue ? 'text-red-500' : 'text-muted-foreground')}>
                      {format(new Date(item.dueAt), 'MMM d, yyyy')}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {item.status === 'PENDING' && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => markComplete(item.id)}>
                        Done
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AiGenerateDialog open={aiDialog} onOpenChange={setAiDialog} type="follow_up" entityId="" entityName="" />
    </div>
  );
}
