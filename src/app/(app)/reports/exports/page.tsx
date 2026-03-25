import { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/coming-soon';
import { Download } from 'lucide-react';

export const metadata: Metadata = { title: 'Exports | Reports' };

export default function Page() {
  return (
    <ComingSoon
      title="Report Exports"
      description="Export your reports and data as PDF, Excel, or CSV. Schedule automatic report delivery."
      icon={Download}
      backHref="/reports"
      backLabel="Back to Reports"
      roadmapItems={[
        'CSV/Excel export',
        'PDF report generation',
        'Scheduled email reports',
        'Custom date range exports',
      ]}
    />
  );
}
