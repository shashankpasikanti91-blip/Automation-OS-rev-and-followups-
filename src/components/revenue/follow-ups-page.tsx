'use client';

import { useCallback, useEffect, useState } from 'react';
import { PhoneCall, Search, Filter, Plus } from 'lucide-react';
import { FollowUpTable } from '@/components/revenue/follow-up-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export function FollowUpsPage() {
  const [stats, setStats] = useState({ total: 0, overdue: 0, dueToday: 0, completed: 0 });
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');

  const loadStats = useCallback(async () => {
    const res = await fetch('/api/revenue/follow-ups?limit=0');
    const json = await res.json();
    if (json.data?.meta) {
      setStats({
        total: json.data.meta.total ?? 0,
        overdue: json.data.meta.overdueCount ?? 0,
        dueToday: json.data.meta.dueTodayCount ?? 0,
        completed: json.data.meta.completedCount ?? 0,
      });
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-cyan-400" />
            Follow-Ups
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all client follow-up tasks</p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Follow-Up
        </Button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-400' },
          { label: 'Due Today', value: stats.dueToday, color: 'text-amber-400' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-400' },
        ].map((tile) => (
          <div key={tile.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{tile.label}</p>
            <p className={`text-2xl font-bold ${tile.color}`}>{tile.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search follow-ups…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <Filter className="h-3.5 w-3.5 mr-1 opacity-60" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="SKIPPED">Skipped</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All priorities</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        {(status || priority) && (
          <Button size="sm" variant="ghost" onClick={() => { setStatus(''); setPriority(''); }}>
            <Badge variant="ghost" className="text-xs">Clear filters</Badge>
          </Button>
        )}
      </div>

      {/* Table */}
      <FollowUpTable externalStatus={status} externalPriority={priority} externalSearch={search} />
    </div>
  );
}
