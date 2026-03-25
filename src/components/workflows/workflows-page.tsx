'use client';

import { useCallback, useEffect, useState } from 'react';
import { Zap, Search, Plus, AlertCircle, ToggleLeft, ToggleRight, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface WorkflowRun {
  id: string;
  status: string;
  createdAt: string;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  status: string;
  updatedAt: string;
  workflowRuns: WorkflowRun[];
  _count: { workflowRuns: number };
}

const TRIGGER_VARIANTS: Record<string, string> = {
  MANUAL: 'ghost', SCHEDULED: 'info', EVENT: 'warning', WEBHOOK: 'success',
};

const RUN_STATUS_VARIANTS: Record<string, string> = {
  SUCCESS: 'success', FAILED: 'danger', RUNNING: 'info', PENDING: 'ghost',
};

export function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: '1', limit: '50' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    const res = await fetch(`/api/workflows?${params}`);
    if (!res.ok) { setLoading(false); return; }
    const json = await res.json();
    setWorkflows(json.data?.data ?? []);
    setTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (wf: Workflow) => {
    const res = await fetch('/api/workflows', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: wf.id, status: wf.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
    });
    if (res.ok) {
      const newStatus = wf.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      setWorkflows((prev) => prev.map((w) => w.id === wf.id ? { ...w, status: newStatus } : w));
      toast({ title: `Workflow ${wf.status === 'ACTIVE' ? 'disabled' : 'enabled'}`, variant: 'success' });
    }
  };

  const active = workflows.filter((w) => w.status === 'ACTIVE').length;
  const lastRunFailed = workflows.filter((w) => w.workflowRuns[0]?.status === 'FAILED').length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            Workflows
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Automate your business processes</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Workflow</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Workflows</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-emerald-400">{active}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Last Run Failed</p>
          <p className="text-2xl font-bold text-red-400">{lastRunFailed}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search workflows…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton-pulse h-20 rounded-xl" />)}
        </div>
      ) : workflows.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Zap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No workflows yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => (
            <div key={wf.id} className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{wf.name}</span>
                  <Badge variant={TRIGGER_VARIANTS[wf.trigger] as 'ghost' | 'success' | 'danger' | 'warning' | 'info' | undefined} className="text-xs">
                    {wf.trigger}
                  </Badge>
                  {wf.status !== 'ACTIVE' && <Badge variant="ghost" className="text-xs">Disabled</Badge>}
                </div>
                {wf.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{wf.description}</p>}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(wf.updatedAt)}</span>
                  <span className="flex items-center gap-1"><Play className="h-3 w-3" /> {wf._count.workflowRuns} runs</span>
                  {wf.workflowRuns[0] && (
                    <Badge variant={RUN_STATUS_VARIANTS[wf.workflowRuns[0].status] as 'ghost' | 'success' | 'danger' | 'warning' | 'info' | undefined} className="text-[10px] py-0">
                      Last: {wf.workflowRuns[0].status}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleActive(wf)}
                  title={wf.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                >
                  {wf.status === 'ACTIVE'
                    ? <ToggleRight className="h-5 w-5 text-emerald-400" />
                    : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                </Button>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
