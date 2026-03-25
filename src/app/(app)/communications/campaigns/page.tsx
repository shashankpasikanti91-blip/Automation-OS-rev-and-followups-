import { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/coming-soon';
import { Megaphone } from 'lucide-react';

export const metadata: Metadata = { title: 'Campaigns | Communications' };

export default function Page() {
  return (
    <ComingSoon
      title="Campaign Management"
      description="Run targeted outreach campaigns across email, SMS, and WhatsApp. Segment audiences, schedule sends, and track engagement."
      icon={Megaphone}
      backHref="/communications"
      backLabel="Back to Communications"
      roadmapItems={[
        'Audience segmentation by CRM data',
        'Multi-channel campaign builder',
        'Scheduled campaign sends',
        'A/B testing for subject lines',
        'Campaign analytics and open rates',
      ]}
    />
  );
}
