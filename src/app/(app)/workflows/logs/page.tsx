import { Metadata } from 'next';
import { WorkflowLogsPage } from '@/components/workflows/workflow-logs-page';

export const metadata: Metadata = { title: 'Logs | Workflows' };

export default function Page() {
  return <WorkflowLogsPage />;
}
