import { Metadata } from 'next';
import { FollowUpsPage } from '@/components/revenue/follow-ups-page';

export const metadata: Metadata = { title: 'Follow-Ups | Revenue Engine' };

export default function Page() {
  return <FollowUpsPage />;
}
