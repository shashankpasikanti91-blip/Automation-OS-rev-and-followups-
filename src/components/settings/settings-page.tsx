'use client';

import { useCallback, useEffect, useState } from 'react';
import { Settings, Globe, Clock, DollarSign, Flag, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

interface TenantSettings {
  name: string;
  timezone: string;
  defaultLanguage: string;
  defaultCurrency: string;
  defaultCountry: string;
  dateFormat: string;
}

const TIMEZONES = ['UTC', 'Asia/Kuala_Lumpur', 'Asia/Singapore', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Manila', 'Asia/Jakarta', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney'];
const CURRENCIES = ['USD', 'MYR', 'SGD', 'AED', 'INR', 'PHP', 'IDR', 'GBP', 'EUR', 'AUD', 'CAD'];
const LANGUAGES = ['en', 'ms', 'ar', 'hi', 'zh', 'id', 'tl', 'fr', 'es', 'ru'];
const DATE_FORMATS = ['MMM d, yyyy', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TenantSettings>({
    name: '',
    timezone: 'UTC',
    defaultLanguage: 'en',
    defaultCurrency: 'USD',
    defaultCountry: '',
    dateFormat: 'MMM d, yyyy',
  });

  const load = useCallback(async () => {
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

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast({ title: 'Settings saved', variant: 'success' });
    } else {
      toast({ title: 'Save failed', variant: 'destructive' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Workspace Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your tenant preferences</p>
      </div>

      {/* Workspace name */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Workspace</h2>
        <div className="space-y-1.5">
          <Label htmlFor="name">Workspace Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
      </div>

      {/* Localisation */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4" /> Localisation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="timezone" className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Timezone</Label>
            <Select value={form.timezone} onValueChange={(v) => setForm((f) => ({ ...f, timezone: v }))}>
              <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Default Currency</Label>
            <Select value={form.defaultCurrency} onValueChange={(v) => setForm((f) => ({ ...f, defaultCurrency: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> Default Language</Label>
            <Select value={form.defaultLanguage} onValueChange={(v) => setForm((f) => ({ ...f, defaultLanguage: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><Flag className="h-3.5 w-3.5" /> Default Country</Label>
            <Input
              placeholder="e.g. MY, SG, IN…"
              value={form.defaultCountry}
              onChange={(e) => setForm((f) => ({ ...f, defaultCountry: e.target.value.toUpperCase().slice(0, 2) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Date Format</Label>
            <Select value={form.dateFormat} onValueChange={(v) => setForm((f) => ({ ...f, dateFormat: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((df) => <SelectItem key={df} value={df}>{df}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-2 min-w-32">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
