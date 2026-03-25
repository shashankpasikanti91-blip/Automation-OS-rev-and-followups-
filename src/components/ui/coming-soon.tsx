'use client';

import Link from 'next/link';
import { Construction, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  backHref?: string;
  backLabel?: string;
  roadmapItems?: string[];
}

export function ComingSoon({
  title,
  description,
  icon: Icon = Construction,
  backHref = '/dashboard',
  backLabel = 'Back to Dashboard',
  roadmapItems,
}: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-medium text-amber-500 mb-4">
        <Sparkles className="h-3 w-3" />
        Coming Soon
      </div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {roadmapItems && roadmapItems.length > 0 && (
        <div className="rounded-xl border bg-card p-4 mb-6 max-w-sm w-full text-left">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Planned Features</p>
          <ul className="space-y-2">
            {roadmapItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Button variant="outline" asChild>
        <Link href={backHref} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </Button>
    </div>
  );
}
