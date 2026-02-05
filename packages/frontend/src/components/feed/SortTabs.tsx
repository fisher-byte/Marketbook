'use client';

import { useLocale } from '@/components/useLocale';
import { t } from '@/lib/i18n';

export type SortType = 'hot' | 'new' | 'top';

type Props = {
  sort: SortType;
  onSort: (s: SortType) => void;
};

export function SortTabs({ sort, onSort }: Props) {
  const locale = useLocale();
  const tabs: { key: SortType; label: string }[] = [
    { key: 'hot', label: t('home.sortHot', locale) },
    { key: 'new', label: t('home.sortNew', locale) },
    { key: 'top', label: t('home.sortTop', locale) },
  ];
  return (
    <div className="flex gap-1 border-b border-slate-200 mb-4">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onSort(key)}
          className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
            sort === key
              ? 'border-slate-700 text-slate-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
