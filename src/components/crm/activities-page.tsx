'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, Search, Filter, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { useDebounce } from '@/hooks/use-debounce';
import { format } from 'date-fns';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user?: { name: string; avatarUrl?: string };
  organization?: { name: string };
  lead?: { title: string };
  contact?: { firstName: string; lastName: string };
}

const TYPE_COLORS: Record<string, string> = {
  lead_created: 'info',
  contact_created: 'info',
  organization_created: 'info',
  follow_up_created: 'warning',
  follow_up_completed: 'success',
  communication_drafted: 'ghost',
  document_uploaded: 'info',
  renewal_created: 'warning',
};

export function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '30' });
    if (type) params.set('type', type);

    const res = await fetch(`/api/crm/activities?${params}`);
    const json = await res.json();
    setActivities(json.data?.data ?? []);
    setTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [page, type]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Activity Timeline
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Recent actions and events across your CRM</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={type || 'all'} onValueChange={(v) => setType(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-52">
            <Filter className="h-3.5 w-3.5 mr-1 opacity-60" />
            <SelectValue placeholder="Activity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activities</SelectItem>
            <SelectItem value="lead_created">Lead Created</SelectItem>
            <SelectItem value="contact_created">Contact Created</SelectItem>
            <SelectItem value="organization_created">Company Created</SelectItem>
            <SelectItem value="follow_up_created">Follow-Up Created</SelectItem>
            <SelectItem value="follow_up_completed">Follow-Up Completed</SelectItem>
            <SelectItem value="communication_drafted">Communication Drafted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activities yet"
            description="Activities will appear here as you and your team interact with leads, contacts, and follow-ups."
          />
        ) : (
          <div className="divide-y">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{a.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {a.user?.name && (
                      <span className="text-xs text-muted-foreground">by {a.user.name}</span>
                    )}
                    <Badge variant={TYPE_COLORS[a.type] as any ?? 'ghost'} className="text-[10px]">
                      {a.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(a.createdAt), 'MMM d, HH:mm')}
                </span>
              </div>
            ))}
          </div>
        )}
        {total > 30 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
            <span>Page {page} of {Math.ceil(total / 30)}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page * 30 >= total}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
