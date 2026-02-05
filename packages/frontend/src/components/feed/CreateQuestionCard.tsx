'use client';

import { useState } from 'react';
import { useLocale } from '@/components/useLocale';
import { t } from '@/lib/i18n';

type Section = { id: string; name: string; description: string };
const SECTION_KEYS: Record<string, string> = { a_stock: 'a_stock', us_stock: 'us_stock', futures: 'futures' };

type Props = {
  sections: Section[];
  onSubmit: (data: { section: string; title: string; content?: string }) => Promise<void>;
};

export function CreateQuestionCard({ sections, onSubmit }: Props) {
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [section, setSection] = useState('a_stock');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ section, title: title.trim(), content: content.trim() || undefined });
      setTitle('');
      setContent('');
      setExpanded(false);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full p-4 text-left bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors text-slate-500"
      >
        {t('home.questionTitle', locale)}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg border border-slate-200 mb-4">
      <label className="block text-sm text-slate-600 mb-1">{t('home.section', locale)}</label>
      <select
        value={section}
        onChange={(e) => setSection(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded mb-3 focus:outline-none focus:ring-1 focus:ring-slate-400"
      >
        {sections.map((s) => (
          <option key={s.id} value={s.id}>
            {t(`section.${SECTION_KEYS[s.id] || s.id}`, locale) || s.name}
          </option>
        ))}
      </select>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('home.questionTitle', locale)}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded mb-3 focus:outline-none focus:ring-1 focus:ring-slate-400"
        required
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('home.questionDesc', locale)}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded mb-3 focus:outline-none focus:ring-1 focus:ring-slate-400"
        rows={3}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1.5 text-sm font-medium bg-slate-700 text-white rounded hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? t('home.publishing', locale) : t('home.publish', locale)}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800"
        >
          {t('home.cancel', locale)}
        </button>
      </div>
    </form>
  );
}
