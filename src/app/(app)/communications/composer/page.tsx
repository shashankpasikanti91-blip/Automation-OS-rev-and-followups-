import { Metadata } from 'next';
import { AiComposerPage } from '@/components/communications/ai-composer-page';

export const metadata: Metadata = { title: 'AI Composer | Communications' };

export default function Page() {
  return <AiComposerPage />;
}
