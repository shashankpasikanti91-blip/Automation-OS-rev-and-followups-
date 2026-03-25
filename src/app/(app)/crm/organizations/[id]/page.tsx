import { Metadata } from 'next';
import { OrgDetailPage } from '@/components/crm/org-detail-page';

export const metadata: Metadata = { title: 'Organisation | CRM' };

export default function Page({ params }: { params: { id: string } }) {
  return <OrgDetailPage id={params.id} />;
}
