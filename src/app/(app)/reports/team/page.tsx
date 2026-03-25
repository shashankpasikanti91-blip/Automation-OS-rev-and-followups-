import { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/coming-soon';
import { Users } from 'lucide-react';

export const metadata: Metadata = { title: 'Team Metrics | Reports' };

export default function Page() {
  return (
    <ComingSoon
      title="Team Metrics"
      description="Track team performance across follow-ups completed, leads managed, and response times."
      icon={Users}
      backHref="/reports"
      backLabel="Back to Reports"
      roadmapItems={[
        'Per-user performance scorecards',
        'Follow-up completion rates by team member',
        'Activity leaderboard',
        'Response time tracking',
      ]}
    />
  );
}
