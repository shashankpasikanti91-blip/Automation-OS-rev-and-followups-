'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, Search, Plus, Mail, Phone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useDebounce } from '@/hooks/use-debounce';
import { initials } from '@/lib/utils';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  organization?: { id: string; name: string };
}

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (debouncedSearch) params.set('search', debouncedSearch);

    const res = await fetch(`/api/crm/contacts?${params}`);
    const json = await res.json();
    setContacts(json.data?.data ?? []);
    setTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-400" />
            Contacts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} contacts</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Contact
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contacts…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Title</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Organisation</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Phone</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No contacts found</p>
                  </td>
                </tr>
              ) : contacts.map((c) => (
                <tr key={c.id} className="border-b hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs">{initials(`${c.firstName} ${c.lastName}`)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{c.firstName} {c.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">{c.jobTitle ?? '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm">{c.organization?.name ?? '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {c.email ? (
                      <a href={`mailto:${c.email}`} className="text-xs text-primary flex items-center gap-1 hover:underline">
                        <Mail className="h-3 w-3" />{c.email}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
                        <Phone className="h-3 w-3" />{c.phone}
                      </a>
                    ) : '—'}
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
    </div>
  );
}
