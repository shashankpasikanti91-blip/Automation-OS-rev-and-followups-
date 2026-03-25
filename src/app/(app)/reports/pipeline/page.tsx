import { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/coming-soon';
import { TrendingUp } from 'lucide-react';

export const metadata: Metadata = { title: 'Pipeline Insights | Reports' };

export default function Page() {
  return (
    <ComingSoon
      title="Pipeline Insights"
      description="Visualize deal flow, stage conversion rates, and bottlenecks in your sales pipeline."
      icon={TrendingUp}
      backHref="/reports"
      backLabel="Back to Reports"
      roadmapItems={[
        'Pipeline stage conversion funnel',
        'Average deal cycle time',
        'Stage-by-stage analytics',
        'Deal velocity tracking',
      ]}
    />
  );
}
