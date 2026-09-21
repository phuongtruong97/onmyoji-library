import type { Metadata } from 'next';
import SoulView from './soul-view';

export const metadata: Metadata = {
  title: 'Thư viện Ngự hồn Onmyoji',
  description: 'Tra cứu hiệu ứng bộ 2 và bộ 4 của Ngự hồn Onmyoji.',
};

export default function SoulPage() {
  return <SoulView />;
}
