'use client';

const KEY = 'marketbook_api_key';

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY);
}

export function setApiKey(key: string) {
  localStorage.setItem(KEY, key);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('authchange'));
  }
}

export function clearApiKey() {
  localStorage.removeItem(KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('authchange'));
  }
}
