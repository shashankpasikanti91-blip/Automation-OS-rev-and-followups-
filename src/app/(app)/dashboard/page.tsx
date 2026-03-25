import { Metadata } from 'next';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';

export const metadata: Metadata = { title: 'Command Center' };

export default function DashboardPage() {
  return <DashboardOverview />;
}
