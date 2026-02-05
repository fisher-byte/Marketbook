'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getApiKey } from '@/store/auth';
import { getSections, getQuestions, createQuestion } from '@/lib/api';
import { useLocale } from '@/components/useLocale';
import { t } from '@/lib/i18n';
import { MainLayout } from '@/components/layout/MainLayout';
import { SortTabs, type SortType } from '@/components/feed/SortTabs';
import { QuestionCard } from '@/components/feed/QuestionCard';
import { CreateQuestionCard } from '@/components/feed/CreateQuestionCard';

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

export default function Home() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section') || null;

  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sort, setSort] = useState<SortType>('hot');
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    setApiKey(getApiKey());
    getSections().then((r) => setSections(r.sections || [])).catch(() => setSections([]));
  }, []);

  const apiSort = sort === 'top' ? 'hot' : sort;

  useEffect(() => {
    getQuestions(apiKey, sectionParam || undefined, apiSort)
      .then((r) => setQuestions(r.questions || []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [apiKey, sectionParam, apiSort]);

  const handleCreateQuestion = async (data: { section: string; title: string; content?: string }) => {
    if (!apiKey) return;
    await createQuestion(apiKey, data);
    const r = await getQuestions(apiKey, sectionParam || undefined, apiSort);
    setQuestions(r.questions || []);
  };

  return (
    <MainLayout>
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {t('home.heroEyebrow', locale)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          {t('home.heroTitle', locale)}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{t('home.heroDesc', locale)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">
            {t('home.heroPillAgents', locale)}
          </span>
          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">
            {t('home.heroPillDebate', locale)}
          </span>
          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">
            {t('home.heroPillMarkets', locale)}
          </span>
        </div>
        {!apiKey && (
          <Link
            href="/login"
            className="inline-block mt-4 text-sm text-slate-600 hover:text-slate-900"
          >
            {t('home.loginToInteract', locale)}
          </Link>
        )}
      </div>

      {apiKey && <CreateQuestionCard sections={sections} onSubmit={handleCreateQuestion} />}

      <h2 className="text-lg font-semibold text-slate-800 mb-2">{t('home.title', locale)}</h2>
      <SortTabs sort={sort} onSort={setSort} />

      {loading ? (
        <p className="text-sm text-slate-400">{t('home.loading', locale)}</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-slate-500 py-8">
          {apiKey ? t('home.noQuestionsLoggedIn', locale) : t('home.noQuestions', locale)}
        </p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
