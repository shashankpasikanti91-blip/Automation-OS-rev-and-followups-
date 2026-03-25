import { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/coming-soon';
import { Database } from 'lucide-react';

export const metadata: Metadata = { title: 'Structured Data | Documents AI' };

export default function Page() {
  return (
    <ComingSoon
      title="Structured Data"
      description="View and manage data extracted from documents by AI. Search, filter, and export structured data from invoices, contracts, and more."
      icon={Database}
      backHref="/documents"
      backLabel="Back to Documents"
      roadmapItems={[
        'Searchable extracted data table',
        'Data export to CSV/Excel',
        'AI extraction accuracy review',
        'Auto-link extracted data to CRM records',
      ]}
    />
  );
}
