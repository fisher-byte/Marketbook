import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Source_Sans_3 } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

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
    <html lang="zh-CN" className={sourceSans.variable}>
      <body className="font-sans bg-slate-50 min-h-screen text-slate-800">
        <Suspense fallback={<header className="border-b border-slate-200 bg-white h-12" />}>
          <Header />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
