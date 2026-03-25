import { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/coming-soon';
import { Calendar } from 'lucide-react';

export const metadata: Metadata = { title: 'Schedules | Workflows' };

export default function Page() {
  return (
    <ComingSoon
      title="Scheduled Workflows"
      description="Set up time-based workflow execution. Run reports, send reminders, or trigger follow-ups on a schedule."
      icon={Calendar}
      backHref="/workflows"
      backLabel="Back to Workflows"
      roadmapItems={[
        'Cron-based scheduling',
        'Recurring workflow execution',
        'Schedule management dashboard',
        'Timezone-aware scheduling',
      ]}
    />
  );
}
