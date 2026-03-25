'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Mail, Phone, MessageCircle, Plus, Search, Filter, Loader2, Send, FileEdit, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Comm {
  id: string;
  channel: string;
  direction: string;
  subject?: string;
  body?: string;
  status: string;
  createdAt: string;
  organization?: { name: string };
  contact?: { firstName: string; lastName: string };
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-3.5 w-3.5" />,
  SMS: <MessageCircle className="h-3.5 w-3.5" />,
  WHATSAPP: <MessageSquare className="h-3.5 w-3.5" />,
  CALL: <Phone className="h-3.5 w-3.5" />,
  PHONE: <Phone className="h-3.5 w-3.5" />,
};

const STATUS_VARIANTS: Record<string, string> = {
  DRAFT: 'ghost', QUEUED: 'warning', SENT: 'info', DELIVERED: 'info', OPENED: 'success',
  REPLIED: 'success', FAILED: 'danger', BOUNCED: 'danger',
};

export function CommunicationsPage() {
  const [items, setItems] = useState<Comm[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [form, setForm] = useState({ channel: 'EMAIL', subject: '', body: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (channel) params.set('channel', channel);

    const res = await fetch(`/api/communications?${params}`);
    const json = await res.json();
    setItems(json.data?.data ?? []);
    setTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [page, channel]);

  useEffect(() => { load(); }, [load]);

  const saveDraft = async () => {
    setComposing(true);
    const res = await fetch('/api/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, direction: 'OUTBOUND' }),
    });
    const json = await res.json();

    if (!res.ok) {
      toast({ title: 'Failed to save draft', description: json.error, variant: 'destructive' });
    } else {
      toast({ title: 'Draft saved', description: 'Your message has been saved as a draft. You can send it when your integration is connected.', variant: 'success' });
      setComposeOpen(false);
      setForm({ channel: 'EMAIL', subject: '', body: '' });
      load();
    }
    setComposing(false);
  };

  const requestSend = async (commId: string) => {
    setSending(commId);
    const res = await fetch('/api/communications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: commId, action: 'send' }),
    });
    const json = await res.json();

    if (!res.ok) {
      toast({ title: 'Cannot send', description: json.error, variant: 'destructive' });
    } else {
      toast({ title: 'Queued for sending', description: 'Message has been queued. It will be sent via your connected integration.', variant: 'success' });
      load();
    }
    setSending(null);
  };

  const filtered = search ? items.filter((c) => (c.subject ?? c.body ?? '').toLowerCase().includes(search.toLowerCase())) : items;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-sky-400" />
            Communications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Outreach history across all channels</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setComposeOpen(true)}>
          <Plus className="h-4 w-4" />
          Compose
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={channel || 'all'} onValueChange={(v) => setChannel(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40">
            <Filter className="h-3.5 w-3.5 mr-1 opacity-60" />
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="EMAIL">Email</SelectItem>
            <SelectItem value="SMS">SMS</SelectItem>
            <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
            <SelectItem value="PHONE">Call</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Channel</th>
                <th className="text-left px-4 py-3 font-medium">Subject / Message</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Recipient</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Date</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-0">
                    <EmptyState
                      icon={MessageSquare}
                      title="No communications yet"
                      description="Create your first draft or connect an email integration to start outreach."
                      actionLabel="Compose Message"
                      onAction={() => setComposeOpen(true)}
                    />
                  </td>
                </tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <Badge variant="ghost" className="gap-1">
                      {CHANNEL_ICONS[c.channel] ?? <MessageSquare className="h-3.5 w-3.5" />}
                      {c.channel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium truncate max-w-[240px]">{c.subject ?? c.body ?? '—'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.direction?.toLowerCase()}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm">
                    {c.organization?.name ?? (c.contact ? `${c.contact.firstName} ${c.contact.lastName}` : '—')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[c.status] as 'ghost' | 'success' | 'danger' | 'info' | 'warning' | undefined}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                    {format(new Date(c.createdAt), 'MMM d, HH:mm')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs"
                        disabled={sending === c.id}
                        onClick={() => requestSend(c.id)}
                      >
                        {sending === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        Send
                      </Button>
                    )}
                    {c.status === 'QUEUED' && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Loader2 className="h-3 w-3 animate-spin" /> Queued
                      </span>
                    )}
                    {c.status === 'FAILED' && (
                      <span className="text-xs text-destructive flex items-center gap-1 justify-end">
                        <AlertTriangle className="h-3 w-3" /> Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
            <span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileEdit className="h-4 w-4" /> Compose Message
            </DialogTitle>
            <DialogDescription>
              Messages are saved as drafts first. Connect an integration in Settings to enable sending.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="PHONE">Call Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(form.channel === 'EMAIL') && (
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                placeholder="Message body…"
                rows={6}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={saveDraft} disabled={composing || !form.body.trim()} className="gap-2">
              {composing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileEdit className="h-4 w-4" />}
              Save Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
