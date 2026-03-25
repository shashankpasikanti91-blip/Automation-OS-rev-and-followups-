import Link from 'next/link';
import { Construction, ArrowLeft, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
        <Construction className="h-8 w-8 text-primary" />
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-medium text-amber-500 mb-4">
        <Sparkles className="h-3 w-3" />
        Coming Soon
      </div>
      <h1 className="text-2xl font-bold mb-2">This feature is under construction</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        We&apos;re building this out right now. Check back soon — it will be ready in the next update.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
