import { Metadata } from 'next';
import { SettingsPage } from '@/components/settings/settings-page';

export const metadata: Metadata = { title: 'Settings | SRP AI OS' };

export default function Page() {
  return <SettingsPage />;
}
