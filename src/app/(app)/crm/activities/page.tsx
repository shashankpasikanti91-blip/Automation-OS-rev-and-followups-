import { Metadata } from 'next';
import { ActivitiesPage } from '@/components/crm/activities-page';

export const metadata: Metadata = { title: 'Activities | CRM' };

export default function Page() {
  return <ActivitiesPage />;
}
