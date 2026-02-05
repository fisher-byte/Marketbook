import zh from '@/locales/zh.json';
import en from '@/locales/en.json';

const LOCALE_KEY = 'marketbook_locale';
const messages: Record<string, Record<string, unknown>> = { zh, en };

export type Locale = 'zh' | 'en';

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'zh';
  const stored = localStorage.getItem(LOCALE_KEY);
  return (stored === 'en' || stored === 'zh') ? stored : 'zh';
}

export function setLocale(locale: Locale) {
  localStorage.setItem(LOCALE_KEY, locale);
  window.dispatchEvent(new Event('localechange'));
}

export function t(key: string, locale: Locale): string {
  const msg = messages[locale] as Record<string, unknown>;
  if (!msg) return key;
  const parts = key.split('.');
  let v: unknown = msg;
  for (const p of parts) {
    v = (v as Record<string, unknown>)?.[p];
  }
  return typeof v === 'string' ? v : key;
}
