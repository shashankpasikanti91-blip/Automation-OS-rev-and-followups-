import { Metadata } from 'next';
import { RevenueEnginePage } from '@/components/revenue/revenue-engine-page';

export const metadata: Metadata = { title: 'Revenue Engine' };

export default function RevenueRoute() {
  return <RevenueEnginePage />;
}
