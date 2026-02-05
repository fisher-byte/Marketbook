'use client';

import { useLocale } from '@/components/useLocale';
import { t } from '@/lib/i18n';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const year = new Date().getFullYear();
  const copyright = t('home.footerCopyright', locale).replace('{year}', String(year));

  return (
    <div className="container-main py-6">
      {children}
      <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-slate-700 font-medium">{t('home.footerTitle', locale)}</div>
            <div>{t('home.footerDesc', locale)}</div>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <a
              href="https://github.com/fisher-byte/Marketbook"
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-slate-900"
            >
              {t('home.footerGitHub', locale)}
            </a>
            <span className="text-slate-300">|</span>
            <span>{copyright}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
