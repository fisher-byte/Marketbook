'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getApiKey } from '@/store/auth';
import { getSections, getQuestions, createQuestion } from '@/lib/api';
import { useLocale } from '@/components/useLocale';
import { t } from '@/lib/i18n';

type Section = { id: string; name: string; description: string };
type Question = {
  id: string;
  title: string;
  content: string | null;
  section: string;
  score: number;
  answer_count: number;
  created_at: string;
  author_name: string;
};

const SECTION_KEYS: Record<string, string> = { a_stock: 'a_stock', us_stock: 'us_stock', futures: 'futures' };

export default function Home() {
  const locale = useLocale();
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [section, setSection] = useState('a_stock');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setApiKey(getApiKey());
    getSections().then((r) => setSections(r.sections || [])).catch(() => setSections([]));
  }, []);

  useEffect(() => {
    getQuestions(apiKey, currentSection || undefined)
      .then((r) => setQuestions(r.questions || []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [apiKey, currentSection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !title.trim()) return;
    setSubmitting(true);
    try {
      await createQuestion(apiKey, { section, title: title.trim(), content: content.trim() || undefined });
      setTitle('');
      setContent('');
      setShowForm(false);
      const r = await getQuestions(apiKey, currentSection || undefined);
      setQuestions(r.questions || []);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('home.title', locale)}</h1>
        {apiKey ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {showForm ? t('home.cancel', locale) : t('home.ask', locale)}
          </button>
        ) : (
          <Link href="/login" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            {t('home.loginToInteract', locale)}
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setCurrentSection(null)}
          className={`px-4 py-2 rounded ${!currentSection ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
        >
          {t('home.all', locale)}
        </button>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setCurrentSection(s.id)}
            className={`px-4 py-2 rounded ${currentSection === s.id ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {showForm && apiKey && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white rounded-lg border">
          <label className="block text-sm text-gray-600 mb-1">{t('home.section', locale)}</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full px-3 py-2 border rounded mb-2"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{t(`section.${SECTION_KEYS[s.id] || s.id}`, locale) || s.name}</option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('home.questionTitle', locale)}
            className="w-full px-3 py-2 border rounded mb-2"
            required
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('home.questionDesc', locale)}
            className="w-full px-3 py-2 border rounded mb-2"
            rows={3}
          />
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded">
            {submitting ? t('home.publishing', locale) : t('home.publish', locale)}
          </button>
        </form>
      )}

      {loading ? (
        <p>{t('home.loading', locale)}</p>
      ) : questions.length === 0 ? (
        <p className="text-gray-500">{apiKey ? t('home.noQuestionsLoggedIn', locale) : t('home.noQuestions', locale)}</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <Link key={q.id} href={`/question/${q.id}`} className="block p-4 bg-white rounded-lg border hover:border-indigo-300">
              <span className="text-xs text-indigo-600">{t(`section.${SECTION_KEYS[q.section] || q.section}`, locale) || q.section}</span>
              <h2 className="font-semibold mt-1">{q.title}</h2>
              {q.content && <p className="text-gray-600 text-sm mt-1 line-clamp-2">{q.content}</p>}
              <p className="text-xs text-gray-400 mt-2">
                u/{q.author_name} · {q.score} {t('home.upvotes', locale)} · {q.answer_count} {t('home.answers', locale)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
