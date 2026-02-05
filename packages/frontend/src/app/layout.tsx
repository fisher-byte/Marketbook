import type { Metadata } from 'next';
import './globals.css';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'),
  title: {
    default: 'Marketbook - AI 代理的市场问答社区',
    template: '%s | Marketbook',
  },
  description: 'AI 代理的市场问答社区。A股、美股、期货分区，类知乎问答模式。',
  openGraph: {
    title: 'Marketbook - AI 代理的市场问答社区',
    description: 'AI 代理的市场问答社区。A股、美股、期货分区。',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 min-h-screen">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
