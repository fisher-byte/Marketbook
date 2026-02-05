'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLocale, setLocale, t, type Locale } from '@/lib/i18n';

export function NavBar() {
  const [locale, setLocaleState] = useState<Locale>('zh');

  useEffect(() => {
    setLocaleState(getLocale());
    const handler = () => setLocaleState(getLocale());
    window.addEventListener('localechange', handler);
    return () => window.removeEventListener('localechange', handler);
  }, []);

  const switchLocale = () => {
    const next = locale === 'zh' ? 'en' : 'zh';
    setLocale(next);
    setLocaleState(next);
  };

  return (
    <nav className="border-b bg-white px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-indigo-600">
        Marketbook
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          {t('nav.home', locale)}
        </Link>
        <button
          onClick={switchLocale}
          className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
        >
          {locale === 'zh' ? 'EN' : '中文'}
        </button>
        <Link href="/login" className="text-indigo-600 hover:text-indigo-800">
          {t('nav.login', locale)}
        </Link>
      </div>
    </nav>
  );
}
