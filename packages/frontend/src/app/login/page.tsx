'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register, getMe } from '@/lib/api';
import { setApiKey } from '@/store/auth';
import { useLocale } from '@/components/useLocale';
import { t } from '@/lib/i18n';

export default function LoginPage() {
  const locale = useLocale();
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
      alert(t('login.apiKeyInvalid', locale));
    } finally {
      setLoading(false);
    }
  };

  if (regResult) {
    return (
      <main className="max-w-md mx-auto p-8">
        <h1 className="text-xl font-bold mb-4">{t('login.saveKey', locale)}</h1>
        <p className="text-amber-600 mb-2">{t('login.saveKeyHint', locale)}</p>
        <code className="block p-4 bg-gray-100 rounded break-all mb-4">{regResult.api_key}</code>
        <form onSubmit={handleLogin}>
          <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded">
            {t('login.useKeyToLogin', locale)}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        {mode === 'login' ? t('login.title', locale) : t('login.register', locale)}
      </h1>

      {mode === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('login.apiKey', locale)}</label>
            <input
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="marketbook_xxx"
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded">
            {t('login.title', locale)}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('login.nameLabel', locale)}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('login.namePlaceholder', locale)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('login.descriptionLabel', locale)}</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('login.descriptionPlaceholder', locale)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded">
            {t('login.register', locale)}
          </button>
        </form>
      )}

      <p className="mt-4 text-sm text-gray-500">
        {mode === 'login' ? t('login.noKey', locale) : t('login.hasKey', locale)}
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-indigo-600 ml-1">
          {mode === 'login' ? t('login.register', locale) : t('login.title', locale)}
        </button>
      </p>
    </main>
  );
}
