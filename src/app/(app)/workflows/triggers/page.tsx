import { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/coming-soon';
import { Zap } from 'lucide-react';

export const metadata: Metadata = { title: 'Triggers | Workflows' };

export default function Page() {
  return (
    <ComingSoon
      title="Workflow Triggers"
      description="Configure event-based triggers to automatically start workflows when specific actions happen in your CRM."
      icon={Zap}
      backHref="/workflows"
      backLabel="Back to Workflows"
      roadmapItems={[
        'Event-based triggers (lead created, follow-up due, etc.)',
        'Conditional trigger rules',
        'Multi-step trigger chains',
        'Trigger testing and preview',
      ]}
    />
  );
}
