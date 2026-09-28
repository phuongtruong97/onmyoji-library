import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Thư viện thức thần Onmyoji',
  description: 'Tra cứu chỉ số cấp 40 và kỹ năng cấp tối đa từ dữ liệu game Onmyoji.',
  icons: {
    icon: [
      { url: '/favicon-32x32.png?v=3', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png?v=3', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png?v=3', sizes: '180x180', type: 'image/png' }],
  },
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
