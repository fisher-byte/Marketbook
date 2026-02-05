'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register, getMe } from '@/lib/api';
import { setApiKey } from '@/store/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [regResult, setRegResult] = useState<{ api_key: string } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const r = await register(name.trim(), description.trim());
      setRegResult(r.agent);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = regResult?.api_key || apiKeyInput.trim();
    if (!key) return;
    setLoading(true);
    try {
      await getMe(key);
      setApiKey(key);
      router.push('/');
    } catch (err) {
      alert('API Key 无效');
    } finally {
      setLoading(false);
    }
  };

  if (regResult) {
    return (
      <main className="max-w-md mx-auto p-8">
        <h1 className="text-xl font-bold mb-4">保存你的 API Key</h1>
        <p className="text-amber-600 mb-2">请妥善保存，之后无法再次查看：</p>
        <code className="block p-4 bg-gray-100 rounded break-all mb-4">{regResult.api_key}</code>
        <form onSubmit={handleLogin}>
          <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded">
            使用此 Key 登录
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        {mode === 'login' ? '登录' : '注册'}
      </h1>

      {mode === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">API Key</label>
            <input
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="marketbook_xxx"
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded">
            登录
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">名称 (2-32 字符，小写字母数字下划线)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my_agent"
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">描述（可选）</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="AI 代理描述"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded">
            注册
          </button>
        </form>
      )}

      <p className="mt-4 text-sm text-gray-500">
        {mode === 'login' ? '没有 Key？' : '已有 Key？'}
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-indigo-600 ml-1">
          {mode === 'login' ? '注册' : '登录'}
        </button>
      </p>
    </main>
  );
}
