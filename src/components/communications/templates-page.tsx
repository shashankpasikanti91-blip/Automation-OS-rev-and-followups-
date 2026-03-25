'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, Plus, Search, Loader2, Trash2, Pencil, Mail, MessageCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';

interface Template {
  id: string;
  name: string;
  channel: string;
  subject?: string;
  body: string;
  category?: string;
  isAiGenerated: boolean;
  createdAt: string;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-3.5 w-3.5" />,
  SMS: <MessageCircle className="h-3.5 w-3.5" />,
  WHATSAPP: <MessageSquare className="h-3.5 w-3.5" />,
};

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', channel: 'EMAIL', subject: '', body: '', category: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/communications/templates');
    const json = await res.json();
    setTemplates(json.data?.data ?? json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditingId(null);
    setForm({ name: '', channel: 'EMAIL', subject: '', body: '', category: '' });
    setDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditingId(t.id);
    setForm({ name: t.name, channel: t.channel, subject: t.subject ?? '', body: t.body, category: t.category ?? '' });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const method = editingId ? 'PATCH' : 'POST';
    const url = '/api/communications/templates';
    const payload = editingId ? { id: editingId, ...form } : form;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (!res.ok) {
      toast({ title: 'Failed to save', description: json.error, variant: 'destructive' });
    } else {
      toast({ title: editingId ? 'Template updated' : 'Template created', variant: 'success' });
      setDialogOpen(false);
      load();
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    const res = await fetch('/api/communications/templates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast({ title: 'Template deleted', variant: 'success' });
      load();
    } else {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-400" />
            Communication Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Reusable message templates for outreach across channels</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No templates yet"
          description="Create reusable message templates to speed up your outreach. Use them in the Compose flow or AI Composer."
          actionLabel="Create Template"
          onAction={openNew}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{t.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="ghost" className="gap-1 text-[10px]">
                      {CHANNEL_ICONS[t.channel]} {t.channel}
                    </Badge>
                    {t.isAiGenerated && <Badge variant="info" className="text-[10px]">AI Generated</Badge>}
                    {t.category && <Badge variant="ghost" className="text-[10px]">{t.category}</Badge>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(t)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => remove(t.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {t.subject && <p className="text-xs text-muted-foreground">Subject: {t.subject}</p>}
              <p className="text-xs text-muted-foreground line-clamp-3">{t.body}</p>
              <p className="text-[10px] text-muted-foreground/50">
                Created {format(new Date(t.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'New'} Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for your outreach messages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Template Name</Label>
              <Input placeholder="e.g. Follow-Up Reminder" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input placeholder="e.g. renewal, follow-up" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
              </div>
            </div>
            {form.channel === 'EMAIL' && (
              <div className="space-y-1.5">
                <Label>Subject Template</Label>
                <Input placeholder="Subject line" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Body Template</Label>
              <Textarea
                placeholder="Message template body…"
                rows={6}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name.trim() || !form.body.trim()} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
