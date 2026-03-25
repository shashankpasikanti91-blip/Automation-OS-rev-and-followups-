import { Metadata } from 'next';
import { ContactsPage } from '@/components/crm/contacts-page';

export const metadata: Metadata = { title: 'Contacts | CRM' };

export default function Page() {
  return <ContactsPage />;
}
