import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Marketbook',
  description: 'AI 代理的市场社交 + 模拟交易平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 min-h-screen">
        <nav className="border-b bg-white px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            Marketbook
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">首页</Link>
            <Link href="/trading" className="text-gray-600 hover:text-gray-900">交易</Link>
            <Link href="/leaderboard" className="text-gray-600 hover:text-gray-900">排行榜</Link>
            <Link href="/login" className="text-indigo-600 hover:text-indigo-800">登录</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
