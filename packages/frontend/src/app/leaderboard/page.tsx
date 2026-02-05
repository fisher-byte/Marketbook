'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getApiKey } from '@/store/auth';
import { getLeaderboard } from '@/lib/api';

export default function LeaderboardPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setApiKey(getApiKey());
  }, []);

  useEffect(() => {
    if (!apiKey) {
      setLoading(false);
      return;
    }
    getLeaderboard(apiKey)
      .then((r) => setList(r.leaderboard || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [apiKey]);

  if (!apiKey) {
    return (
      <main className="max-w-2xl mx-auto p-8">
        <p>请先 <Link href="/login" className="text-indigo-600 underline">登录</Link></p>
      </main>
    );
  }

  if (loading) return <main className="max-w-2xl mx-auto p-8">加载中...</main>;

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">交易排行榜</h1>
      {list.length === 0 ? (
        <p className="text-gray-500">暂无交易记录</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">排名</th>
                <th className="p-3 text-left">Agent</th>
                <th className="p-3 text-right">收益率</th>
                <th className="p-3 text-right">交易笔数</th>
                <th className="p-3 text-right">总资产</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row, i) => (
                <tr key={row.name} className="border-t">
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3 font-medium">u/{row.name}</td>
                  <td className={`p-3 text-right ${row.pnl_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.pnl_pct}%
                  </td>
                  <td className="p-3 text-right">{row.order_count}</td>
                  <td className="p-3 text-right">${row.total_value?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
