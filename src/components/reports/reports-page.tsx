'use client';

import { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, Users, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Overview {
  totalOrgs: number;
  atRiskCount: number;
  totalContractValue: number;
  followUpsDueToday: number;
  overdueFollowUps: number;
  renewalsDueSoon: number;
  totalLeads: number;
  wonLeads: number;
  conversionRate: number;
}

interface MonthBucket { month: string; value: number; }
interface StatusCount { status: string; _count: number; }
interface ActivityItem { id: string; type: string; description?: string; createdAt: string; organization?: { name: string } }

interface ReportData {
  overview: Overview;
  followUpsByStatus: StatusCount[];
  recentActivity: ActivityItem[];
  revenueByMonth: MonthBucket[];
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-500', IN_PROGRESS: 'bg-blue-500', COMPLETED: 'bg-emerald-500', CANCELLED: 'bg-red-500', SKIPPED: 'bg-gray-500',
};

export function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then((r) => r.json())
      .then((json) => { setData(json.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="h-8 w-48 skeleton-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 skeleton-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  const ov = data?.overview;
  const maxRevenue = Math.max(...(data?.revenueByMonth.map((m) => m.value) ?? [1]), 1);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-blue-400" />
          Reports & Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Business intelligence overview</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<Users className="h-4 w-4 text-blue-400" />} label="Total Clients" value={ov?.totalOrgs ?? 0} />
        <KpiCard icon={<AlertTriangle className="h-4 w-4 text-red-400" />} label="At-Risk" value={ov?.atRiskCount ?? 0} className="border-red-500/20" />
        <KpiCard icon={<TrendingUp className="h-4 w-4 text-emerald-400" />} label="Contract Value" value={formatCurrency(ov?.totalContractValue ?? 0)} />
        <KpiCard icon={<Clock className="h-4 w-4 text-amber-400" />} label="Overdue Follow-ups" value={ov?.overdueFollowUps ?? 0} className="border-amber-500/20" />
        <KpiCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} label="Due Today" value={ov?.followUpsDueToday ?? 0} />
        <KpiCard icon={<BarChart2 className="h-4 w-4 text-violet-400" />} label="Renewals Due (30d)" value={ov?.renewalsDueSoon ?? 0} />
        <KpiCard icon={<Users className="h-4 w-4 text-sky-400" />} label="Total Leads" value={ov?.totalLeads ?? 0} />
        <KpiCard icon={<TrendingUp className="h-4 w-4 text-green-400" />} label="Conversion Rate" value={`${ov?.conversionRate ?? 0}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Bar Chart */}
        <div className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold mb-4">Contract Value by Month (this year)</h2>
          <div className="flex items-end gap-1.5 h-36">
            {data?.revenueByMonth.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-blue-500/70 hover:bg-blue-400 transition-colors"
                  style={{ height: `${Math.round((m.value / maxRevenue) * 100)}%`, minHeight: m.value > 0 ? '4px' : '0' }}
                  title={`${m.month}: ${formatCurrency(m.value)}`}
                />
                <span className="text-[10px] text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Follow-ups by Status */}
        <div className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold mb-4">Follow-ups by Status</h2>
          <div className="space-y-3">
            {(data?.followUpsByStatus ?? []).map((s) => {
              const total = data?.followUpsByStatus.reduce((sum, x) => sum + x._count, 0) ?? 1;
              const pct = Math.round((s._count / total) * 100);
              return (
                <div key={s.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{s.status}</span>
                    <span className="text-muted-foreground">{s._count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${STATUS_COLOR[s.status] ?? 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(data?.followUpsByStatus ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold mb-4">Recent Activity (30 days)</h2>
        {(data?.recentActivity ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {data?.recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{a.description ?? a.type}</p>
                  {a.organization && <p className="text-xs text-muted-foreground">{a.organization.name}</p>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, className = '' }: { icon: React.ReactNode; label: string; value: string | number; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card p-4 ${className}`}>
      <div className="flex items-center gap-1.5 mb-1">{icon}<p className="text-xs text-muted-foreground">{label}</p></div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
