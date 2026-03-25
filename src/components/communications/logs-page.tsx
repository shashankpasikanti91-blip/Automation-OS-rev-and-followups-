'use client';

import { useCallback, useEffect, useState } from 'react';
import { ScrollText, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';

interface LogItem {
  id: string;
  event: string;
  payload: any;
  statusCode?: number;
  success: boolean;
  response?: string;
  sentAt: string;
  webhook?: { name: string; url: string };
}

export function CommunicationLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/communications/logs?page=${page}&limit=30`);
    const json = await res.json();
    setLogs(json.data ?? []);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-slate-400" />
          Communication Logs
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Webhook delivery logs and communication send attempts
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No logs yet"
            description="Communication delivery logs and webhook responses will appear here once messages are sent through connected integrations."
          />
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="mt-0.5">
                  {log.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{log.event}</span>
                    <Badge variant={log.success ? 'success' : 'danger'} className="text-[10px]">
                      {log.statusCode ?? (log.success ? 'OK' : 'FAILED')}
                    </Badge>
                  </div>
                  {log.webhook?.name && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Webhook: {log.webhook.name}
                    </p>
                  )}
                  {log.response && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                      Response: {log.response.slice(0, 100)}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.sentAt), 'MMM d, HH:mm:ss')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
