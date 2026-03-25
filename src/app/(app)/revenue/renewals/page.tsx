import { Metadata } from 'next';
import { RenewalsPage } from '@/components/revenue/renewals-page';

export const metadata: Metadata = { title: 'Renewals | Revenue Engine' };

export default function Page() {
  return <RenewalsPage />;
}
