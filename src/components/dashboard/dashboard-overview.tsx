'use client';

import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, AlertCircle, Clock, RefreshCw,
  CheckCircle2, Zap, Activity, ArrowUpRight,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { UpcomingRenewals } from '@/components/dashboard/upcoming-renewals';
import { AtRiskWidget } from '@/components/dashboard/at-risk-widget';
import { SetupChecklist } from '@/components/dashboard/setup-checklist';

interface DashboardData {
  kpis: {
    totalLeads: number;
    totalContacts: number;
    totalOrganizations: number;
    overdueFollowUps: number;
    todayFollowUps: number;
    upcomingRenewals: number;
    overdueRenewals: number;
    atRiskClients: number;
    openTasks: number;
    aiUsageLast30d: number;
  };
  revenueTrend: Array<{ month: string; value: number }>;
  recentActivities: any[];
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((res) => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const k = data?.kpis;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Revenue Engine Dashboard</h1>
          <p className="text-sm text-muted-foreground">AI-powered system to manage follow-ups, track revenue, and identify at-risk clients</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="section-label">Today</span>
          <span className="text-sm font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Overdue Follow-Ups"
          value={k?.overdueFollowUps ?? 0}
          icon={Clock}
          variant="danger"
          loading={loading}
          href="/revenue/follow-ups?status=PENDING&overdue=true"
        />
        <StatCard
          title="Upcoming Renewals"
          value={k?.upcomingRenewals ?? 0}
          icon={RefreshCw}
          variant="warning"
          loading={loading}
          href="/revenue/renewals"
        />
        <StatCard
          title="At-Risk Clients"
          value={k?.atRiskClients ?? 0}
          icon={AlertCircle}
          variant="danger"
          loading={loading}
          href="/revenue/at-risk"
        />
        <StatCard
          title="Open Tasks"
          value={k?.openTasks ?? 0}
          icon={CheckCircle2}
          variant="default"
          loading={loading}
          href="/crm/activities"
        />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Organizations"
          value={k?.totalOrganizations ?? 0}
          icon={Users}
          loading={loading}
          href="/crm/organizations"
        />
        <StatCard
          title="Total Contacts"
          value={k?.totalContacts ?? 0}
          icon={Users}
          loading={loading}
          href="/crm/contacts"
        />
        <StatCard
          title="Active Leads"
          value={k?.totalLeads ?? 0}
          icon={TrendingUp}
          variant="success"
          loading={loading}
          href="/crm/leads"
        />
        <StatCard
          title="AI Jobs (30d)"
          value={k?.aiUsageLast30d ?? 0}
          icon={Zap}
          loading={loading}
        />
      </div>

      {/* Setup checklist — auto-hides when all steps are done */}
      <SetupChecklist />

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue trend */}
        <div className="lg:col-span-2">
          <RevenueChart data={data?.revenueTrend ?? []} loading={loading} />
        </div>

        {/* Activity feed */}
        <div>
          <ActivityFeed activities={data?.recentActivities ?? []} loading={loading} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingRenewals />
        <AtRiskWidget />
      </div>
    </div>
  );
}
