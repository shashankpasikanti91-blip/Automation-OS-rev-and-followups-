import { Metadata } from 'next';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';

export const metadata: Metadata = { title: 'Revenue Engine Dashboard | Revenue OS' };

export default function DashboardPage() {
  return <DashboardOverview />;
}
