import { Metadata } from 'next';
import { CommunicationLogsPage } from '@/components/communications/logs-page';

export const metadata: Metadata = { title: 'Logs | Communications' };

export default function Page() {
  return <CommunicationLogsPage />;
}
