'use client';

import { useCallback, useEffect, useState } from 'react';
import { GitBranch, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

interface WorkflowRun {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
  workflow?: { name: string };
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; variant: string }> = {
  COMPLETED: { icon: CheckCircle2, color: 'text-emerald-400', variant: 'success' },
  FAILED: { icon: XCircle, color: 'text-red-400', variant: 'danger' },
  RUNNING: { icon: Loader2, color: 'text-blue-400', variant: 'info' },
  QUEUED: { icon: Clock, color: 'text-amber-400', variant: 'warning' },
};

export function WorkflowLogsPage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workflows/logs');
      const json = await res.json();
      setRuns(json.data ?? []);
    } catch {
      // no-op
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-cyan-400" />
          Workflow Logs
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Execution history for all automated workflows</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : runs.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No workflow executions"
          description="Workflow runs will appear here once triggers fire or workflows are executed manually."
        />
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Workflow</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Started</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Duration</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Error</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const cfg = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.QUEUED;
                  const Icon = cfg.icon;
                  const durationMs = run.completedAt
                    ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
                    : null;

                  return (
                    <tr key={run.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{run.workflow?.name ?? 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={cfg.variant as any} className="gap-1">
                          <Icon className={`h-3 w-3 ${run.status === 'RUNNING' ? 'animate-spin' : ''}`} />
                          {run.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                        {new Date(run.startedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {durationMs != null ? `${(durationMs / 1000).toFixed(1)}s` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-red-400 hidden lg:table-cell max-w-[200px] truncate">
                        {run.error ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
