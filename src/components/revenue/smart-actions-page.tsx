'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Zap, Clock, AlertTriangle, RefreshCw, Mail, Loader2, Plug,
  ArrowRight, CheckCircle2, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

interface SmartAction {
  id: string;
  type: 'overdue_followups' | 'upcoming_renewals' | 'at_risk' | 'no_integration' | 'no_followups' | 'draft_messages';
  title: string;
  description: string;
  count?: number;
  severity: 'danger' | 'warning' | 'info' | 'success';
  href?: string;
  actionLabel?: string;
}

const ICONS: Record<string, React.ElementType> = {
  overdue_followups: Clock,
  upcoming_renewals: RefreshCw,
  at_risk: AlertTriangle,
  no_integration: Plug,
  no_followups: CheckCircle2,
  draft_messages: Mail,
};

const SEVERITY_STYLES: Record<string, string> = {
  danger: 'border-red-500/20 bg-red-500/5',
  warning: 'border-amber-500/20 bg-amber-500/5',
  info: 'border-blue-500/20 bg-blue-500/5',
  success: 'border-emerald-500/20 bg-emerald-500/5',
};

export function SmartActionsPage() {
  const [actions, setActions] = useState<SmartAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/revenue/smart-actions')
      .then((r) => r.json())
      .then((json) => {
        setActions(json.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-400" />
          Smart Actions
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          AI-powered suggestions based on your current CRM data. Actions are generated from real records only.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : actions.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up!"
          description="No urgent actions right now. Smart actions will appear here when there are overdue follow-ups, upcoming renewals, or other items needing attention."
        />
      ) : (
        <div className="grid gap-3">
          {actions.map((action) => {
            const Icon = ICONS[action.type] ?? Zap;
            return (
              <div
                key={action.id}
                className={`rounded-xl border p-4 flex items-start gap-4 transition-colors ${SEVERITY_STYLES[action.severity]}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background/80 border">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{action.title}</h3>
                    {action.count !== undefined && action.count > 0 && (
                      <Badge variant={action.severity as any}>{action.count}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{action.description}</p>
                </div>
                {action.href && (
                  <Button size="sm" variant="outline" asChild className="shrink-0 gap-1">
                    <Link href={action.href}>
                      {action.actionLabel ?? 'View'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
