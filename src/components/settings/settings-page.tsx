'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Settings, Globe, Clock, DollarSign, Flag, Loader2, Check,
  Plug, Webhook, ToggleLeft, ToggleRight, Plus, Trash2, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

/* ────────────── types ────────────── */
interface TenantSettings {
  name: string;
  timezone: string;
  defaultLanguage: string;
  defaultCurrency: string;
  defaultCountry: string;
  dateFormat: string;
}

interface IntegrationRow {
  id?: string;
  key: string;
  name: string;
  enabled: boolean;
  config?: Record<string, any>;
}

interface WebhookRow {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
}

/* ────────────── consts ────────────── */
const TIMEZONES = ['UTC', 'Asia/Kuala_Lumpur', 'Asia/Singapore', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Manila', 'Asia/Jakarta', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney'];
const CURRENCIES = ['USD', 'MYR', 'SGD', 'AED', 'INR', 'PHP', 'IDR', 'GBP', 'EUR', 'AUD', 'CAD'];
const LANGUAGES = ['en', 'ms', 'ar', 'hi', 'zh', 'id', 'tl', 'fr', 'es', 'ru'];
const DATE_FORMATS = ['MMM d, yyyy', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

const DEFAULT_INTEGRATIONS: IntegrationRow[] = [
  { key: 'smtp', name: 'Email (SMTP)', enabled: false },
  { key: 'twilio_whatsapp', name: 'WhatsApp via Twilio', enabled: false },
  { key: 'openai', name: 'OpenAI', enabled: false },
  { key: 'n8n', name: 'n8n Automation', enabled: false },
];

const WEBHOOK_EVENTS = [
  'lead.created', 'lead.updated', 'lead.won', 'lead.lost',
  'followup.created', 'followup.completed', 'followup.overdue',
  'renewal.upcoming', 'renewal.due', 'renewal.overdue',
  'communication.send_requested', 'communication.sent', 'communication.failed',
];

const TABS = ['General', 'Integrations', 'Webhooks'] as const;
type Tab = typeof TABS[number];

/* ════════════════════════════════════════════ */

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('General');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* General */
  const [form, setForm] = useState<TenantSettings>({
    name: '', timezone: 'UTC', defaultLanguage: 'en', defaultCurrency: 'USD', defaultCountry: '', dateFormat: 'MMM d, yyyy',
  });

  /* Integrations */
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [intLoading, setIntLoading] = useState(false);

  /* Webhooks */
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [whLoading, setWhLoading] = useState(false);
  const [whDialogOpen, setWhDialogOpen] = useState(false);
  const [whForm, setWhForm] = useState({ name: '', url: '', events: [] as string[], secret: '' });
  const [whSaving, setWhSaving] = useState(false);

  /* ── load general ── */
  const loadGeneral = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/settings');
    const json = await res.json();
    if (json.data) {
      setForm({
        name: json.data.name ?? '',
        timezone: json.data.settings?.timezone ?? 'UTC',
        defaultLanguage: json.data.settings?.defaultLanguage ?? 'en',
        defaultCurrency: json.data.settings?.defaultCurrency ?? 'USD',
        defaultCountry: json.data.settings?.defaultCountry ?? '',
        dateFormat: json.data.settings?.dateFormat ?? 'MMM d, yyyy',
      });
    }
    setLoading(false);
  }, []);

  /* ── load integrations ── */
  const loadIntegrations = useCallback(async () => {
    setIntLoading(true);
    const res = await fetch('/api/settings/integrations');
    const json = await res.json();
    const saved: IntegrationRow[] = json.data ?? [];
    // Merge defaults with saved
    const merged = DEFAULT_INTEGRATIONS.map((def) => {
      const found = saved.find((s) => s.key === def.key);
      return found ?? def;
    });
    // Also add any custom integrations not in defaults
    saved.forEach((s) => {
      if (!merged.find((m) => m.key === s.key)) merged.push(s);
    });
    setIntegrations(merged);
    setIntLoading(false);
  }, []);

  /* ── load webhooks ── */
  const loadWebhooks = useCallback(async () => {
    setWhLoading(true);
    const res = await fetch('/api/settings/webhooks');
    const json = await res.json();
    setWebhooks(json.data ?? []);
    setWhLoading(false);
  }, []);

  useEffect(() => { loadGeneral(); }, [loadGeneral]);
  useEffect(() => { if (tab === 'Integrations') loadIntegrations(); }, [tab, loadIntegrations]);
  useEffect(() => { if (tab === 'Webhooks') loadWebhooks(); }, [tab, loadWebhooks]);

  /* ── save general ── */
  const saveGeneral = async () => {
    setSaving(true);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    toast({ title: res.ok ? 'Settings saved' : 'Save failed', variant: res.ok ? 'success' : 'destructive' });
    setSaving(false);
  };

  /* ── toggle integration ── */
  const toggleIntegration = async (row: IntegrationRow) => {
    const updated = { ...row, enabled: !row.enabled };
    await fetch('/api/settings/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: row.key, name: row.name, enabled: updated.enabled, config: row.config }),
    });
    setIntegrations((prev) => prev.map((i) => (i.key === row.key ? updated : i)));
    toast({ title: `${row.name} ${updated.enabled ? 'enabled' : 'disabled'}`, variant: 'success' });
  };

  /* ── create webhook ── */
  const createWebhook = async () => {
    if (!whForm.name || !whForm.url || whForm.events.length === 0) return;
    setWhSaving(true);
    const res = await fetch('/api/settings/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(whForm),
    });
    if (res.ok) {
      toast({ title: 'Webhook created', variant: 'success' });
      setWhForm({ name: '', url: '', events: [], secret: '' });
      setWhDialogOpen(false);
      loadWebhooks();
    } else {
      toast({ title: 'Failed to create webhook', variant: 'destructive' });
    }
    setWhSaving(false);
  };

  /* ── delete webhook ── */
  const deleteWebhook = async (id: string) => {
    await fetch('/api/settings/webhooks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    toast({ title: 'Webhook deleted', variant: 'success' });
  };

  /* ── toggle webhook event selection ── */
  const toggleEvent = (evt: string) => {
    setWhForm((f) => ({
      ...f,
      events: f.events.includes(evt) ? f.events.filter((e) => e !== evt) : [...f.events, evt],
    }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Workspace configuration, integrations, and webhooks</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ───── General Tab ───── */}
      {tab === 'General' && (
        <>
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Workspace</h2>
            <div className="space-y-1.5">
              <Label htmlFor="name">Workspace Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Globe className="h-4 w-4" /> Localisation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Timezone</Label>
                <Select value={form.timezone} onValueChange={(v) => setForm((f) => ({ ...f, timezone: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Default Currency</Label>
                <Select value={form.defaultCurrency} onValueChange={(v) => setForm((f) => ({ ...f, defaultCurrency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> Default Language</Label>
                <Select value={form.defaultLanguage} onValueChange={(v) => setForm((f) => ({ ...f, defaultLanguage: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Flag className="h-3.5 w-3.5" /> Default Country</Label>
                <Input placeholder="e.g. MY, SG, IN…" value={form.defaultCountry} onChange={(e) => setForm((f) => ({ ...f, defaultCountry: e.target.value.toUpperCase().slice(0, 2) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Date Format</Label>
                <Select value={form.dateFormat} onValueChange={(v) => setForm((f) => ({ ...f, dateFormat: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DATE_FORMATS.map((df) => <SelectItem key={df} value={df}>{df}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveGeneral} disabled={saving} className="gap-2 min-w-32">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </>
      )}

      {/* ───── Integrations Tab ───── */}
      {tab === 'Integrations' && (
        <div className="space-y-3">
          {intLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : integrations.map((row) => (
            <div key={row.key} className="rounded-xl border bg-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Plug className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">Key: {row.key}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={row.enabled ? 'success' : 'ghost'}>{row.enabled ? 'Active' : 'Inactive'}</Badge>
                <button onClick={() => toggleIntegration(row)} className="p-1 rounded hover:bg-muted transition-colors">
                  {row.enabled
                    ? <ToggleRight className="h-6 w-6 text-emerald-400" />
                    : <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ───── Webhooks Tab ───── */}
      {tab === 'Webhooks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => setWhDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Add Webhook
            </Button>
          </div>

          {whLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : webhooks.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center">
              <Webhook className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No webhooks configured</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Add a webhook to receive real-time event notifications (e.g. n8n, Zapier)</p>
            </div>
          ) : webhooks.map((wh) => (
            <div key={wh.id} className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    {wh.name}
                    <Badge variant={wh.isActive ? 'success' : 'ghost'} className="text-[10px]">{wh.isActive ? 'Active' : 'Paused'}</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <ExternalLink className="h-3 w-3" /> {wh.url}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteWebhook(wh.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {wh.events.map((e) => (
                  <Badge key={e} variant="ghost" className="text-[10px]">{e}</Badge>
                ))}
              </div>
            </div>
          ))}

          {/* Create Webhook Dialog */}
          <Dialog open={whDialogOpen} onOpenChange={setWhDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Webhook</DialogTitle>
                <DialogDescription>Send real-time event notifications to an external URL</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="e.g. n8n Production" value={whForm.name} onChange={(e) => setWhForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>URL</Label>
                  <Input placeholder="https://n8n.example.com/webhook/..." value={whForm.url} onChange={(e) => setWhForm((f) => ({ ...f, url: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Secret (optional, for HMAC signing)</Label>
                  <Input placeholder="webhook-secret" value={whForm.secret} onChange={(e) => setWhForm((f) => ({ ...f, secret: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Events</Label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                    {WEBHOOK_EVENTS.map((evt) => (
                      <label key={evt} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={whForm.events.includes(evt)}
                          onChange={() => toggleEvent(evt)}
                          className="rounded border-border"
                        />
                        {evt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setWhDialogOpen(false)}>Cancel</Button>
                <Button onClick={createWebhook} disabled={whSaving || !whForm.name || !whForm.url || whForm.events.length === 0} className="gap-1.5">
                  {whSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create Webhook
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
