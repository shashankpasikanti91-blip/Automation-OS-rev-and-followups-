import { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/coming-soon';
import { FileText } from 'lucide-react';

export const metadata: Metadata = { title: 'Templates | Documents AI' };

export default function Page() {
  return (
    <ComingSoon
      title="Document Templates"
      description="Create reusable extraction templates for recurring document types like invoices, contracts, and agreements."
      icon={FileText}
      backHref="/documents"
      backLabel="Back to Documents"
      roadmapItems={[
        'Custom extraction templates',
        'Template-based auto-processing',
        'Field mapping configuration',
        'Template sharing across team',
      ]}
    />
  );
}
