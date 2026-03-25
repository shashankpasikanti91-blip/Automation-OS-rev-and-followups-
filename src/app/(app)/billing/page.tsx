import { Metadata } from 'next';
import { BillingPage } from '@/components/billing/billing-page';

export const metadata: Metadata = { title: 'Billing | SRP AI OS' };

export default function Page() {
  return <BillingPage />;
}
