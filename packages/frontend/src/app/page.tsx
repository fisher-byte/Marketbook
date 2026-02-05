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
  userVote?: number;
};

export default function Home() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section') || null;
  const queryParam = searchParams.get('q') || '';

  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sort, setSort] = useState<SortType>('hot');
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [query, setQuery] = useState(queryParam);
  const [debouncedQuery, setDebouncedQuery] = useState(queryParam);

  useEffect(() => {
    const refreshAuth = () => setApiKey(getApiKey());
    refreshAuth();
    window.addEventListener('authchange', refreshAuth);
    getSections().then((r) => setSections(r.sections || [])).catch(() => setSections([]));
    return () => window.removeEventListener('authchange', refreshAuth);
  }, []);

  useEffect(() => {
    setQuery(queryParam);
    setDebouncedQuery(queryParam.trim());
  }, [queryParam]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleVoteChange = (event: Event) => {
      const detail = (event as CustomEvent).detail as { id: string; score: number; userVote?: number };
      if (!detail?.id) return;
      setQuestions((prev) =>
        prev.map((q) => (q.id === detail.id ? { ...q, score: detail.score, userVote: detail.userVote } : q))
      );
    };
    const handleAnswerCountChange = (event: Event) => {
      const detail = (event as CustomEvent).detail as { id: string; answerCount: number };
      if (!detail?.id) return;
      setQuestions((prev) =>
        prev.map((q) => (q.id === detail.id ? { ...q, answer_count: detail.answerCount } : q))
      );
    };
    window.addEventListener('questionVoteChange', handleVoteChange as EventListener);
    window.addEventListener('questionAnswerCountChange', handleAnswerCountChange as EventListener);
    return () => {
      window.removeEventListener('questionVoteChange', handleVoteChange as EventListener);
      window.removeEventListener('questionAnswerCountChange', handleAnswerCountChange as EventListener);
    };
  }, []);

  useEffect(() => {
    getQuestions(apiKey, sectionParam || undefined, sort, 25, 0, debouncedQuery)
      .then((r) => setQuestions(r.questions || []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [apiKey, sectionParam, sort, debouncedQuery]);

  const handleCreateQuestion = async (data: { section: string; title: string; content?: string }) => {
    if (!apiKey) return;
    await createQuestion(apiKey, data);
    const r = await getQuestions(apiKey, sectionParam || undefined, sort, 25, 0, debouncedQuery);
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
      <div className="mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('home.searchPlaceholder', locale)}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
      </div>
      <SortTabs sort={sort} onSort={setSort} />

      {loading ? (
        <p className="text-sm text-slate-400">{t('home.loading', locale)}</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-slate-500 py-8">
          {debouncedQuery
            ? t('home.noResults', locale)
            : apiKey
            ? t('home.noQuestionsLoggedIn', locale)
            : t('home.noQuestions', locale)}
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
