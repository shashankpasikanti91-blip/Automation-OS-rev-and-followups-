'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Building2, Mail, Phone, Globe, MapPin, RefreshCw, PhoneCall, AlertTriangle, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { RenewalStatusBadge } from '@/components/crm/renewal-status-badge';
import { RiskScoreBadge } from '@/components/crm/risk-score-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AiGenerateDialog } from '@/components/revenue/ai-generate-dialog';
import { cn } from '@/lib/utils';

interface OrgDetail {
  id: string;
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  industry?: string;
  city?: string;
  country?: string;
  contractValue?: number;
  currency?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  renewalDate?: string;
  renewalStatus?: string;
  riskScore?: number;
  followUpStatus?: string;
  lastFollowUpAt?: string;
  nextFollowUpAt?: string;
  contacts?: Array<{ id: string; firstName: string; lastName: string; jobTitle?: string; email?: string }>;
  followUps?: Array<{ id: string; type: string; status: string; scheduledAt?: string; priority: string }>;
  activities?: Array<{ id: string; type: string; subject: string; createdAt: string }>;
}

export function OrgDetailPage({ id }: { id: string }) {
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiType, setAiType] = useState<'follow_up' | 'renewal_reminder' | 'risk_explanation'>('follow_up');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/crm/organizations/${id}`);
    const json = await res.json();
    setOrg(json.data ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-7 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Organisation not found</p>
        <Link href="/crm/organizations" className="text-primary text-sm mt-2 block hover:underline">← Back to organisations</Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/crm/organizations">
          <Button variant="ghost" size="icon-sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {org.name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {org.industry && <Badge variant="ghost">{org.industry}</Badge>}
            {org.city && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{org.city}{org.country ? `, ${org.country}` : ''}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setAiType('follow_up'); setAiOpen(true); }} className="gap-1.5">
            <PhoneCall className="h-3.5 w-3.5" />
            Follow-Up
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setAiType('renewal_reminder'); setAiOpen(true); }} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Renewal
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setAiType('risk_explanation'); setAiOpen(true); }} className="gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Risk
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Contract Value</p>
          <p className="text-xl font-bold text-emerald-400">
            {org.contractValue ? `${org.currency ?? '$'}${org.contractValue.toLocaleString()}` : '—'}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Renewal</p>
          {org.renewalStatus ? <RenewalStatusBadge status={org.renewalStatus} /> : <p className="text-muted-foreground text-sm">—</p>}
          {org.renewalDate && <p className="text-xs text-muted-foreground mt-1">{format(new Date(org.renewalDate), 'MMM d, yyyy')}</p>}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Risk Score</p>
          {org.riskScore != null ? <RiskScoreBadge score={org.riskScore} /> : <p className="text-muted-foreground text-sm">—</p>}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Last Follow-Up</p>
          <p className="text-sm font-medium">{org.lastFollowUpAt ? format(new Date(org.lastFollowUpAt), 'MMM d, yyyy') : 'Never'}</p>
        </div>
      </div>

      {/* Contact info + Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Info */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Contact Info</h3>
          {org.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${org.email}`} className="text-primary hover:underline">{org.email}</a>
            </div>
          )}
          {org.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${org.phone}`} className="hover:underline">{org.phone}</a>
            </div>
          )}
          {org.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a href={org.website} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">{org.website}</a>
            </div>
          )}
          {org.contractStartDate && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Contract: {format(new Date(org.contractStartDate), 'MMM d, yyyy')}
                {org.contractEndDate && ` → ${format(new Date(org.contractEndDate), 'MMM d, yyyy')}`}
              </span>
            </div>
          )}
        </div>

        {/* Contacts */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" /> Contacts ({org.contacts?.length ?? 0})
          </h3>
          {(org.contacts ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No contacts linked</p>
          ) : (
            <div className="space-y-2">
              {org.contacts!.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                    {c.jobTitle && <p className="text-xs text-muted-foreground">{c.jobTitle}</p>}
                  </div>
                  {c.email && <a href={`mailto:${c.email}`} className="text-xs text-primary hover:underline">{c.email}</a>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activities */}
      {(org.activities ?? []).length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Recent Activity</h3>
          <div className="space-y-2">
            {org.activities!.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm">{a.subject}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(a.createdAt), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-ups */}
      {(org.followUps ?? []).length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <PhoneCall className="h-4 w-4" /> Follow-Ups
          </h3>
          <div className="space-y-2">
            {org.followUps!.map((f) => (
              <div key={f.id} className={cn('flex items-center justify-between p-2 rounded-lg', f.status === 'OVERDUE' && 'bg-red-500/10')}>
                <div>
                  <p className="text-sm">{f.type.replace('_', ' ')}</p>
                  {f.scheduledAt && <p className="text-xs text-muted-foreground">{format(new Date(f.scheduledAt), 'MMM d, yyyy')}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={f.status === 'OVERDUE' ? 'danger' : f.status === 'COMPLETED' ? 'success' : 'ghost'}>{f.status}</Badge>
                  <Badge variant={f.priority === 'CRITICAL' ? 'danger' : f.priority === 'HIGH' ? 'warning' : 'ghost'}>{f.priority}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AiGenerateDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        type={aiType}
        entityId={org.id}
        entityName={org.name}
      />
    </div>
  );
}
