'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Copy, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

export function AiComposerPage() {
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    type: 'follow_up_email',
    context: '',
    tone: 'professional',
    channel: 'EMAIL',
  });

  const generate = async () => {
    setGenerating(true);
    setError('');
    setResult('');

    const res = await fetch('/api/ai/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? 'Generation failed');
    } else {
      setResult(json.data?.content ?? '');
    }
    setGenerating(false);
  };

  const saveAsTemplate = async () => {
    if (!result) return;
    setSaving(true);

    const res = await fetch('/api/communications/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `AI Generated — ${form.type.replace(/_/g, ' ')}`,
        channel: form.channel,
        body: result,
        category: 'ai-generated',
      }),
    });

    if (res.ok) {
      toast({ title: 'Saved as template', variant: 'success' });
    } else {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
    setSaving(false);
  };

  const saveAsDraft = async () => {
    if (!result) return;
    setSaving(true);

    const res = await fetch('/api/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: form.channel,
        body: result,
        direction: 'OUTBOUND',
      }),
    });

    if (res.ok) {
      toast({ title: 'Saved as draft', description: 'Go to Communications → Outreach to view.', variant: 'success' });
    } else {
      toast({ title: 'Failed to save draft', variant: 'destructive' });
    }
    setSaving(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({ title: 'Copied to clipboard', variant: 'success' });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-400" />
          AI Composer
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate professional outreach messages using AI. Requires an OpenAI API key configured in settings.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Message Parameters</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Message Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="follow_up_email">Follow-Up Email</SelectItem>
                <SelectItem value="renewal_reminder">Renewal Reminder</SelectItem>
                <SelectItem value="re_engagement">Re-Engagement</SelectItem>
                <SelectItem value="introduction">Introduction</SelectItem>
                <SelectItem value="thank_you">Thank You</SelectItem>
                <SelectItem value="proposal">Proposal Follow-Up</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select value={form.tone} onValueChange={(v) => setForm((f) => ({ ...f, tone: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Channel</Label>
            <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Context (optional)</Label>
          <Textarea
            placeholder="Add context like company name, product discussed, last meeting date, etc."
            rows={3}
            value={form.context}
            onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
          />
        </div>

        <Button onClick={generate} disabled={generating} className="gap-2">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate Message
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Generation Failed</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              Generated Message
              <Badge variant="info" className="text-[10px]">AI</Badge>
            </h2>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={copyToClipboard}>
                <Copy className="h-3 w-3" /> Copy
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={saveAsTemplate} disabled={saving}>
                <Save className="h-3 w-3" /> Save Template
              </Button>
              <Button size="sm" className="gap-1 text-xs" onClick={saveAsDraft} disabled={saving}>
                <Save className="h-3 w-3" /> Save Draft
              </Button>
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <pre className="text-sm whitespace-pre-wrap font-sans">{result}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
