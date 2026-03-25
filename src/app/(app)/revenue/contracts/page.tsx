import { Metadata } from 'next';
import { ContractsPage } from '@/components/revenue/contracts-page';

export const metadata: Metadata = { title: 'Contracts | Revenue Engine' };

export default function Page() {
  return <ContractsPage />;
}
