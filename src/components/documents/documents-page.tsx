'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Upload, Search, Loader2, CheckCircle2, Clock, AlertCircle, FileScan, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Document {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  documentType: string;
  aiStatus: string;
  createdAt: string;
  uploadedBy: { firstName: string; lastName: string };
  organization?: { name: string };
  extractedData?: Record<string, unknown>;
}

const AI_STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: string }> = {
  PENDING: { label: 'Queued', icon: <Clock className="h-3 w-3" />, variant: 'ghost' },
  PROCESSING: { label: 'Extracting…', icon: <Loader2 className="h-3 w-3 animate-spin" />, variant: 'info' },
  COMPLETED: { label: 'Extracted', icon: <CheckCircle2 className="h-3 w-3" />, variant: 'success' },
  FAILED: { label: 'Failed', icon: <AlertCircle className="h-3 w-3" />, variant: 'danger' },
  SKIPPED: { label: 'Skipped', icon: <X className="h-3 w-3" />, variant: 'ghost' },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/documents?page=${page}&limit=20`);
    const json = await res.json();
    setDocs(json.data?.data ?? []);
    setTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const upload = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('name', file.name);

    const res = await fetch('/api/documents', { method: 'POST', body: form });
    const json = await res.json();

    if (!res.ok) {
      toast({ title: 'Upload failed', description: json.error, variant: 'destructive' });
    } else {
      toast({ title: 'Document uploaded', description: 'AI extraction queued', variant: 'success' });
      load();
    }
    setUploading(false);
  };

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(upload);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    onFiles(e.dataTransfer.files);
  };

  const filteredDocs = search
    ? docs.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : docs;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileScan className="h-5 w-5 text-violet-400" />
            Documents AI
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Upload documents for AI-powered data extraction</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Upload Document
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.xlsx,.xls,.csv,.doc,.docx"
          multiple
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          'rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          dragging ? 'border-primary bg-primary/10' : 'border-muted hover:border-muted-foreground/50'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className={cn('h-8 w-8 mx-auto mb-2', dragging ? 'text-primary' : 'text-muted-foreground/50')} />
        <p className="text-sm font-medium">{dragging ? 'Drop to upload' : 'Drag & drop files here'}</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, Excel, CSV, Images, TXT — max 10MB each</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search documents…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Size</th>
                <th className="text-left px-4 py-3 font-medium">AI Status</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Uploaded</th>
                <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Organisation</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No documents yet — upload one above</p>
                  </td>
                </tr>
              ) : filteredDocs.map((doc) => {
                const status = AI_STATUS_CONFIG[doc.aiStatus] ?? AI_STATUS_CONFIG.PENDING;
                return (
                  <tr key={doc.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate max-w-[200px]">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="ghost">{doc.documentType.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">
                      {formatBytes(doc.fileSize)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={status.variant as 'ghost' | 'success' | 'danger' | 'info' | undefined} className="gap-1">
                        {status.icon}{status.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                      {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-sm text-muted-foreground">
                      {doc.organization?.name ?? '—'}
                    </td>
                  </tr>
                );
              })}
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
