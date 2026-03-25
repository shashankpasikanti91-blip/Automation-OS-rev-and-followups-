import { Metadata } from 'next';
import { OrganizationsPage } from '@/components/crm/organizations-page';

export const metadata: Metadata = { title: 'Companies — CRM Hub' };

export default function OrganizationsRoute() {
  return <OrganizationsPage />;
}
