import { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/coming-soon';
import { ListOrdered } from 'lucide-react';

export const metadata: Metadata = { title: 'Extraction Queue | Documents AI' };

export default function Page() {
  return (
    <ComingSoon
      title="Extraction Queue"
      description="Monitor AI document extraction jobs in real-time. View processing status, retries, and extracted data previews."
      icon={ListOrdered}
      backHref="/documents"
      backLabel="Back to Documents"
      roadmapItems={[
        'Real-time extraction status tracking',
        'Retry failed extractions',
        'Bulk extraction management',
        'Priority queue for urgent documents',
      ]}
    />
  );
}
