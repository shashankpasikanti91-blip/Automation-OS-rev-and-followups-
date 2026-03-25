'use client';

import { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface AiGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'follow_up' | 'renewal_reminder' | 'risk_explanation';
  entityId: string;
  entityName: string;
  context?: Record<string, unknown>;
}

const TYPE_LABELS: Record<string, { label: string; desc: string; icon: React.ReactNode }> = {
  follow_up: {
    label: 'Follow-Up Message',
    desc: 'Generate a personalised follow-up message for this client',
    icon: <Sparkles className="h-4 w-4 text-cyan-400" />,
  },
  renewal_reminder: {
    label: 'Renewal Reminder',
    desc: 'Generate a renewal reminder message to send before the renewal date',
    icon: <RefreshCw className="h-4 w-4 text-emerald-400" />,
  },
  risk_explanation: {
    label: 'Risk Analysis',
    desc: 'Generate a risk explanation and recommended actions',
    icon: <Wand2 className="h-4 w-4 text-amber-400" />,
  },
};

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'consultative', label: 'Consultative' },
];

export function AiGenerateDialog({ open, onOpenChange, type, entityId, entityName, context = {} }: AiGenerateDialogProps) {
  const [tone, setTone] = useState('professional');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const meta = TYPE_LABELS[type];

  const generate = async () => {
    setGenerating(true);
    setResult('');

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, entityId, entityType: 'organization', tone, context }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? 'AI generation failed');
      setResult(json.data?.content ?? '');
      toast({ title: 'AI message generated', variant: 'success' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to clipboard', variant: 'success' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {meta.icon}
            <span>AI Generate — {meta.label}</span>
          </DialogTitle>
          <DialogDescription>
            {meta.desc} for <strong>{entityName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tone selector */}
          <div className="space-y-1.5">
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate button */}
          <Button onClick={generate} disabled={generating} className="gap-2 w-full sm:w-auto">
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated message</Label>
                <Button size="icon-sm" variant="ghost" onClick={copy}>
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <Textarea
                value={result}
                onChange={(e) => setResult(e.target.value)}
                rows={10}
                className={cn('font-mono text-xs leading-relaxed transition-all', result && 'border-cyan-500/40 bg-cyan-500/5')}
              />
              <p className="text-xs text-muted-foreground">You can edit the message above before copying or sending.</p>
            </div>
          )}

          {/* Empty state */}
          {!result && !generating && (
            <div className="rounded-xl border border-dashed border-muted p-8 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Click &ldquo;Generate with AI&rdquo; to create a message</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
