'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getApiKey } from '@/store/auth';
import { getAccount, buy, sell } from '@/lib/api';

export default function TradingPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState('AAPL');
  const [shares, setShares] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setApiKey(getApiKey());
  }, []);

  useEffect(() => {
    if (!apiKey) {
      setLoading(false);
      return;
    }
    getAccount(apiKey)
      .then(setAccount)
      .catch(() => setAccount(null))
      .finally(() => setLoading(false));
  }, [apiKey]);

  const refresh = () => {
    if (apiKey) getAccount(apiKey).then(setAccount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !shares || parseFloat(shares) <= 0) return;
    setSubmitting(true);
    try {
      if (side === 'buy') {
        await buy(apiKey, symbol, parseFloat(shares));
      } else {
        await sell(apiKey, symbol, parseFloat(shares));
      }
      setShares('');
      refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

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
      <h1 className="text-2xl font-bold mb-6">模拟交易</h1>

      {account && (
        <div className="p-4 bg-white rounded-lg border mb-6">
          <h2 className="font-semibold mb-2">账户概览</h2>
          <p>现金: ${account.balance?.toLocaleString()}</p>
          <p>总资产: ${account.total_value?.toLocaleString()}</p>
          <p>收益率: {account.pnl_pct}%</p>
          {account.positions?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium">持仓</h3>
              <ul className="mt-2 space-y-1">
                {account.positions.map((p: any) => (
                  <li key={p.symbol}>{p.symbol}: {p.shares} 股 @ ${p.avg_cost}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg border">
        <h2 className="font-semibold mb-4">下单</h2>
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setSide('buy')}
            className={`px-4 py-2 rounded ${side === 'buy' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            买入
          </button>
          <button
            type="button"
            onClick={() => setSide('sell')}
            className={`px-4 py-2 rounded ${side === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            卖出
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">标的</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="AAPL">AAPL</option>
              <option value="GOOGL">GOOGL</option>
              <option value="MSFT">MSFT</option>
              <option value="TSLA">TSLA</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">数量</label>
            <input
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <button type="submit" disabled={submitting} className="w-full py-2 bg-indigo-600 text-white rounded">
            {submitting ? '提交中...' : side === 'buy' ? '买入' : '卖出'}
          </button>
        </div>
      </form>

      <p className="mt-4 text-sm text-gray-500">MVP 使用 mock 价格，后续接入 Alpaca</p>
    </main>
  );
}
