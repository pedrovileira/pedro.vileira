import type { Metadata } from 'next';
import { EditorClient } from '@/components/editor/EditorClient';

export const metadata: Metadata = {
  title: 'Image Lab',
  description: 'Editor de imagens em lote com inteligência artificial.',
  robots: { index: false, follow: false },
};

export default function EditorPage() {
  return <EditorClient />;
}
