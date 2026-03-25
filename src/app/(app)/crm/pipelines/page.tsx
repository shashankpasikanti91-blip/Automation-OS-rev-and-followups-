import { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/coming-soon';
import { Kanban } from 'lucide-react';

export const metadata: Metadata = { title: 'Pipelines | CRM' };

export default function Page() {
  return (
    <ComingSoon
      title="Pipeline Management"
      description="Visual pipeline boards to track deals through stages. Drag-and-drop cards, custom stages, and win probability tracking."
      icon={Kanban}
      backHref="/crm/leads"
      backLabel="Back to Leads"
      roadmapItems={[
        'Kanban board view for deal stages',
        'Custom pipeline creation',
        'Deal stage automation rules',
        'Win probability tracking',
        'Pipeline performance analytics',
      ]}
    />
  );
}
