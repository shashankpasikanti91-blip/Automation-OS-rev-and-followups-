'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, TrendingUp, FileText, MessageSquare,
  GitBranch, BarChart2, Layers, CreditCard, Settings,
  ChevronDown, ChevronRight, Menu, X, Zap,
} from 'lucide-react';

interface NavChild {
  label: string;
  href: string;
  soon?: boolean;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavChild[];
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'CRM Hub', icon: Users,
    children: [
      { label: 'Leads', href: '/crm/leads' },
      { label: 'Contacts', href: '/crm/contacts' },
      { label: 'Companies', href: '/crm/organizations' },
      { label: 'Pipelines', href: '/crm/pipelines', soon: true },
      { label: 'Activities', href: '/crm/activities', soon: true },
    ],
  },
  {
    label: 'Revenue Engine', icon: TrendingUp,
    children: [
      { label: 'Overview', href: '/revenue' },
      { label: 'Renewals', href: '/revenue/renewals' },
      { label: 'Follow-Ups', href: '/revenue/follow-ups' },
      { label: 'At Risk', href: '/revenue/at-risk' },
      { label: 'Contracts', href: '/revenue/contracts' },
      { label: 'Smart Actions', href: '/revenue/actions', soon: true },
    ],
  },
  {
    label: 'Documents AI', icon: FileText,
    children: [
      { label: 'Uploads', href: '/documents' },
      { label: 'Extraction Queue', href: '/documents/queue', soon: true },
      { label: 'Structured Data', href: '/documents/data', soon: true },
      { label: 'Templates', href: '/documents/templates', soon: true },
    ],
  },
  {
    label: 'Communications', icon: MessageSquare,
    children: [
      { label: 'Outreach', href: '/communications' },
      { label: 'Templates', href: '/communications/templates', soon: true },
      { label: 'Campaigns', href: '/communications/campaigns', soon: true },
      { label: 'AI Composer', href: '/communications/composer', soon: true },
      { label: 'Logs', href: '/communications/logs', soon: true },
    ],
  },
  {
    label: 'Workflows', icon: GitBranch,
    children: [
      { label: 'Workflow Studio', href: '/workflows' },
      { label: 'Triggers', href: '/workflows/triggers', soon: true },
      { label: 'Schedules', href: '/workflows/schedules', soon: true },
      { label: 'Integrations', href: '/workflows/integrations', soon: true },
      { label: 'Logs', href: '/workflows/logs', soon: true },
    ],
  },
  {
    label: 'Reports', icon: BarChart2,
    children: [
      { label: 'Performance Hub', href: '/reports' },
      { label: 'Revenue Pulse', href: '/reports/revenue', soon: true },
      { label: 'Pipeline Insights', href: '/reports/pipeline', soon: true },
      { label: 'Team Metrics', href: '/reports/team', soon: true },
      { label: 'Exports', href: '/reports/exports', soon: true },
    ],
  },
  {
    label: 'Industry Packs', icon: Layers,
    children: [
      { label: 'RecruitFlow', href: '/packs/recruit' },
      { label: 'MediFlow', href: '/packs/medi' },
      { label: 'InsureFlow', href: '/packs/insure' },
      { label: 'FinanceFlow', href: '/packs/finance' },
      { label: 'AgencyFlow', href: '/packs/agency' },
    ],
  },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = (label: string) => setOpen((prev) => (prev === label ? null : label));

  const isActive = (href?: string, children?: { href: string }[]) => {
    if (href) return pathname === href || pathname.startsWith(href + '/');
    return children?.some((c) => pathname.startsWith(c.href)) ?? false;
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <span className="text-sm font-bold text-sidebar-foreground">Revenue OS</span>
          <p className="text-2xs text-sidebar-foreground/40">by SRP AI Labs</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navigation.map((item) => {
          const active = isActive(item.href, item.children);
          const expanded = open === item.label || active;

          if (!item.children) {
            return (
              <Link
                key={item.label}
                href={item.href!}
                className={cn('nav-item', active && 'active')}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <div key={item.label}>
              <button
                className={cn('nav-item w-full', active && 'text-sidebar-accent-foreground')}
                onClick={() => toggle(item.label)}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/40" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/40" />
                )}
              </button>
              {expanded && (
                <div className="mt-0.5 ml-4 pl-3 border-l border-sidebar-border space-y-0.5">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'flex items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        'text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent',
                        pathname === child.href && 'text-sidebar-accent-foreground bg-sidebar-accent',
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span>{child.label}</span>
                      {child.soon && (
                        <span className="ml-2 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-500 leading-none">
                          SOON
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <p className="text-2xs text-sidebar-foreground/30 text-center">Revenue OS v1.0 · SRP AI Labs</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex w-56 lg:w-60 shrink-0">{sidebar}</div>

      {/* Mobile toggle */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden rounded-lg bg-sidebar p-2 border border-sidebar-border"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-4 w-4 text-sidebar-foreground" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">
            <button
              className="absolute top-3 right-3 z-50 rounded-lg bg-sidebar-accent p-1"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4 text-sidebar-foreground" />
            </button>
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}
