'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Rocket, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SetupStep {
  key: string;
  label: string;
  done: boolean;
  href: string;
}

interface SetupData {
  steps: SetupStep[];
  completed: number;
  total: number;
}

export function SetupChecklist() {
  const [data, setData] = useState<SetupData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/setup')
      .then((r) => r.json())
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  if (!data || data.completed === data.total) return null;

  const pct = Math.round((data.completed / data.total) * 100);

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Rocket className="h-4 w-4 text-violet-400" />
          Setup Checklist
        </h2>
        <span className="text-xs text-muted-foreground">{data.completed}/{data.total} complete</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {data.steps.map((step) => (
          <Link
            key={step.key}
            href={step.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              step.done
                ? 'text-muted-foreground/50'
                : 'text-foreground hover:bg-muted/50',
            )}
          >
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            )}
            <span className={cn(step.done && 'line-through')}>{step.label}</span>
            {!step.done && <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground/40" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
