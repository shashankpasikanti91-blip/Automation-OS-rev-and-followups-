import { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/coming-soon';
import { DollarSign } from 'lucide-react';

export const metadata: Metadata = { title: 'Revenue Pulse | Reports' };

export default function Page() {
  return (
    <ComingSoon
      title="Revenue Pulse"
      description="Deep-dive analytics on revenue trends, contract values, and growth metrics across your organization."
      icon={DollarSign}
      backHref="/reports"
      backLabel="Back to Reports"
      roadmapItems={[
        'Monthly recurring revenue (MRR) tracking',
        'Revenue by client segment',
        'Contract renewal projections',
        'Growth rate analysis',
      ]}
    />
  );
}
