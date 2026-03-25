'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Mail, Phone, MessageCircle, Plus, Search, Filter, AlertCircle, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
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
};

const STATUS_VARIANTS: Record<string, string> = {
  DRAFT: 'ghost', SENT: 'info', DELIVERED: 'info', OPENED: 'success',
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

  const send = async () => {
    setComposing(true);
    const res = await fetch('/api/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, status: 'SENT', direction: 'OUTBOUND' }),
    });
    const json = await res.json();

    if (!res.ok) {
      toast({ title: 'Failed', description: json.error, variant: 'destructive' });
    } else {
      toast({ title: 'Communication saved', variant: 'success' });
      setComposeOpen(false);
      setForm({ channel: 'EMAIL', subject: '', body: '' });
      load();
    }
    setComposing(false);
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
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="w-40">
            <Filter className="h-3.5 w-3.5 mr-1 opacity-60" />
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All channels</SelectItem>
            <SelectItem value="EMAIL">Email</SelectItem>
            <SelectItem value="SMS">SMS</SelectItem>
            <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
            <SelectItem value="CALL">Call</SelectItem>
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No communications found</p>
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
                    <p className="text-xs text-muted-foreground capitalize">{c.direction.toLowerCase()}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm">
                    {c.organization?.name ?? (c.contact ? `${c.contact.firstName} ${c.contact.lastName}` : '—')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[c.status] as 'ghost' | 'success' | 'danger' | 'info' | undefined}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                    {format(new Date(c.createdAt), 'MMM d, HH:mm')}
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
              <Send className="h-4 w-4" /> New Communication
            </DialogTitle>
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
                  <SelectItem value="CALL">Call Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.channel === 'EMAIL' && (
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
            <Button onClick={send} disabled={composing || !form.body} className="gap-2">
              {composing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
