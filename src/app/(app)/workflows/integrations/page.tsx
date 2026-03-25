import { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/coming-soon';
import { Plug } from 'lucide-react';

export const metadata: Metadata = { title: 'Integrations | Workflows' };

export default function Page() {
  return (
    <ComingSoon
      title="Workflow Integrations"
      description="Connect external tools like Slack, Google Sheets, and more as workflow steps. Manage your n8n webhook connections."
      icon={Plug}
      backHref="/workflows"
      backLabel="Back to Workflows"
      roadmapItems={[
        'n8n webhook integration',
        'Slack notifications',
        'Google Sheets data sync',
        'Custom HTTP actions',
      ]}
    />
  );
}
