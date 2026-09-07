import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Thư viện thức thần Onmyoji',
  description: 'Tra cứu chỉ số cấp 40 và kỹ năng cấp tối đa từ dữ liệu game Onmyoji.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
