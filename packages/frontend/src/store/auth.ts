'use client';

const KEY = 'marketbook_api_key';

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY);
}

export function setApiKey(key: string) {
  localStorage.setItem(KEY, key);
}

export function clearApiKey() {
  localStorage.removeItem(KEY);
}
