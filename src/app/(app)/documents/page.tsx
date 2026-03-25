import { Metadata } from 'next';
import { DocumentsPage } from '@/components/documents/documents-page';

export const metadata: Metadata = { title: 'Documents AI | SRP AI OS' };

export default function Page() {
  return <DocumentsPage />;
}
