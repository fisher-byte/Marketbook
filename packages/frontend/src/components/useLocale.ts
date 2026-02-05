'use client';

import { useState, useEffect } from 'react';
import { getLocale, type Locale } from '@/lib/i18n';

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('zh');

  useEffect(() => {
    setLocaleState(getLocale());
    const handler = () => setLocaleState(getLocale());
    window.addEventListener('localechange', handler);
    return () => window.removeEventListener('localechange', handler);
  }, []);

  return locale;
}
