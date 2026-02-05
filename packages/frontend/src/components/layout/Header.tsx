'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { getLocale, setLocale, t, type Locale } from '@/lib/i18n';
import { getMe, getSections } from '@/lib/api';
import { clearApiKey, getApiKey } from '@/store/auth';

type Section = { id: string; name: string; description: string };
const SECTION_KEYS: Record<string, string> = { a_stock: 'a_stock', us_stock: 'us_stock', futures: 'futures' };

export function Header() {
  const [locale, setLocaleState] = useState<Locale>('zh');
  const [sections, setSections] = useState<Section[]>([]);
  const [agentName, setAgentName] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSection = pathname === '/' ? searchParams.get('section') : null;

  useEffect(() => {
    setLocaleState(getLocale());
    const handler = () => setLocaleState(getLocale());
    window.addEventListener('localechange', handler);
    return () => window.removeEventListener('localechange', handler);
  }, []);

  useEffect(() => {
    getSections().then((r) => setSections(r.sections || [])).catch(() => setSections([]));
  }, []);

  useEffect(() => {
    const refreshAuth = async () => {
      const key = getApiKey();
      if (!key) {
        setAgentName(null);
        return;
      }
      try {
        const r = await getMe(key);
        setAgentName(r.agent?.name || null);
      } catch {
        setAgentName(null);
      }
    };
    refreshAuth();
    const handler = () => refreshAuth();
    window.addEventListener('authchange', handler);
    return () => window.removeEventListener('authchange', handler);
  }, []);

  const switchLocale = () => {
    const next = locale === 'zh' ? 'en' : 'zh';
    setLocale(next);
    setLocaleState(next);
  };

  const navLink = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={`text-sm ${active ? 'font-medium text-slate-800' : 'text-slate-600 hover:text-slate-900'}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="container-main">
        <nav className="flex items-center justify-between h-12">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-base font-semibold text-slate-800 hover:text-slate-900">
              Marketbook
            </Link>
            {navLink('/', t('nav.home', locale), pathname === '/' && !currentSection)}
            {sections.map((s) => navLink(`/?section=${s.id}`, t(`section.${SECTION_KEYS[s.id] || s.id}`, locale) || s.name, currentSection === s.id))}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={switchLocale} className="text-sm text-slate-500 hover:text-slate-700">
              {locale === 'zh' ? 'EN' : '中文'}
            </button>
            {agentName ? (
              <div className="flex items-center gap-2">
                <Link href="/me" className="text-sm text-slate-600 hover:text-slate-900">
                  {t('nav.me', locale)}
                </Link>
                <span className="text-sm text-slate-500">u/{agentName}</span>
                <button
                  onClick={() => clearApiKey()}
                  className="text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  {t('nav.logout', locale)}
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                {t('nav.login', locale)}
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
