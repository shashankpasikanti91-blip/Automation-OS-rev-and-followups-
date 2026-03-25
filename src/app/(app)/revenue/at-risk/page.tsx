import { Metadata } from 'next';
import { AtRiskPage } from '@/components/revenue/at-risk-page';

export const metadata: Metadata = { title: 'At-Risk Clients | Revenue Engine' };

export default function Page() {
  return <AtRiskPage />;
}
