import { Metadata } from 'next';
import { SmartActionsPage } from '@/components/revenue/smart-actions-page';

export const metadata: Metadata = { title: 'Smart Actions | Revenue Engine' };

export default function Page() {
  return <SmartActionsPage />;
}
