import { Metadata } from 'next';
import { TemplatesPage } from '@/components/communications/templates-page';

export const metadata: Metadata = { title: 'Templates | Communications' };

export default function Page() {
  return <TemplatesPage />;
}
