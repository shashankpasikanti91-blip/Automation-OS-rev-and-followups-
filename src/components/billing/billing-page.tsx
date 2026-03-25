'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, Zap, Building2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BillingData {
  name: string;
  subscription?: {
    status: string;
    trialEndsAt?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    plan?: {
      name: string;
      price: number;
      currency: string;
      interval: string;
      features: Record<string, unknown>;
    };
  };
}

const PLAN_CONFIGS = [
  {
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    description: 'For individuals and small teams',
    features: ['Up to 3 users', '100 contacts', 'Basic CRM', 'Email support'],
    icon: <Zap className="h-5 w-5" />,
    highlight: false,
  },
  {
    name: 'Starter',
    price: 49,
    currency: 'USD',
    interval: 'month',
    description: 'For growing businesses',
    features: ['Up to 10 users', '1,000 contacts', 'Revenue Engine', 'AI features (100/mo)', 'Priority support'],
    icon: <CheckCircle2 className="h-5 w-5" />,
    highlight: false,
  },
  {
    name: 'Growth',
    price: 149,
    currency: 'USD',
    interval: 'month',
    description: 'Most popular for scaling teams',
    features: ['Up to 50 users', '10,000 contacts', 'All modules', 'AI features (1,000/mo)', 'Industry packs', '24/7 support'],
    icon: <Building2 className="h-5 w-5 text-cyan-400" />,
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 0,
    currency: 'USD',
    interval: 'month',
    description: 'Custom pricing for large orgs',
    features: ['Unlimited users', 'Unlimited contacts', 'White-label', 'Custom AI', 'Dedicated CSM', 'SLA'],
    icon: <Building2 className="h-5 w-5" />,
    highlight: false,
  },
];

export function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/settings');
    const json = await res.json();
    setData(json.data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const currentPlan = data?.subscription?.plan?.name ?? 'Free';

  if (loading) {
    return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Billing & Plans
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your subscription and plan</p>
      </div>

      {/* Current subscription */}
      {data?.subscription && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3">Current Subscription</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Plan</p>
              <Badge variant="success" className="mt-1">{currentPlan}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium capitalize mt-1">{data.subscription.status}</p>
            </div>
            {data.subscription.trialEndsAt && (
              <div>
                <p className="text-xs text-muted-foreground">Trial Ends</p>
                <p className="text-sm font-medium mt-1">{format(new Date(data.subscription.trialEndsAt), 'MMM d, yyyy')}</p>
              </div>
            )}
            {data.subscription.currentPeriodEnd && (
              <div>
                <p className="text-xs text-muted-foreground">Renews</p>
                <p className="text-sm font-medium mt-1">{format(new Date(data.subscription.currentPeriodEnd), 'MMM d, yyyy')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLAN_CONFIGS.map((plan) => {
          const isCurrent = plan.name === currentPlan;
          return (
            <div
              key={plan.name}
              className={cn(
                'rounded-xl border bg-card p-5 space-y-4 transition-all',
                plan.highlight && 'border-primary/60 shadow-lg shadow-primary/10',
                isCurrent && 'ring-2 ring-primary/40'
              )}
            >
              {plan.highlight && (
                <Badge variant="success" className="text-xs">Most Popular</Badge>
              )}
              <div className="flex items-center gap-2">
                {plan.icon}
                <h3 className="font-semibold">{plan.name}</h3>
              </div>
              <div>
                {plan.price > 0 ? (
                  <p className="text-2xl font-bold">${plan.price}<span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span></p>
                ) : plan.name === 'Free' ? (
                  <p className="text-2xl font-bold">Free</p>
                ) : (
                  <p className="text-2xl font-bold">Custom</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <Button variant="outline" size="sm" className="w-full" disabled>Current Plan</Button>
              ) : plan.name === 'Enterprise' ? (
                <Button variant="outline" size="sm" className="w-full">Contact Sales</Button>
              ) : (
                <Button size="sm" className="w-full">Upgrade</Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
