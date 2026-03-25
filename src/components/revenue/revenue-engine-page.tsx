'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Clock, RefreshCw, AlertCircle, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { FollowUpTable } from '@/components/revenue/follow-up-table';
import { RenewalTable } from '@/components/revenue/renewal-table';

export function RevenueEnginePage() {
  const [tab, setTab] = useState<'follow-ups' | 'renewals'>('follow-ups');

  const tabs = [
    { key: 'follow-ups', label: 'Follow-Ups' },
    { key: 'renewals', label: 'Renewals' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Revenue Engine</h1>
          <p className="text-sm text-muted-foreground">Follow-ups, renewals, and at-risk intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/revenue/at-risk">
              <AlertCircle className="h-4 w-4 mr-1.5" /> At Risk
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/revenue/follow-ups/new">
              <Zap className="h-4 w-4 mr-1.5" /> New Follow-Up
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { label: 'Overview', href: '/revenue', icon: TrendingUp },
          { label: 'Renewals', href: '/revenue/renewals', icon: RefreshCw },
          { label: 'Follow-Ups', href: '/revenue/follow-ups', icon: Clock },
          { label: 'At Risk', href: '/revenue/at-risk', icon: AlertCircle },
          { label: 'Contracts', href: '/revenue/contracts', icon: CheckCircle2 },
          { label: 'Smart Actions', href: '/revenue/actions', icon: Zap },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm font-medium
                       hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <item.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b gap-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === 'follow-ups' ? <FollowUpTable /> : <RenewalTable />}
        </div>
      </div>
    </div>
  );
}
