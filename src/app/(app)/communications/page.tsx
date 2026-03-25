import { Metadata } from 'next';
import { CommunicationsPage } from '@/components/communications/communications-page';

export const metadata: Metadata = { title: 'Communications | SRP AI OS' };

export default function Page() {
  return <CommunicationsPage />;
}
