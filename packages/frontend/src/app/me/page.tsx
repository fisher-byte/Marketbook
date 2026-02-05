'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getApiKey } from '@/store/auth';
import { getMe, getMyAnswers, getMyQuestions } from '@/lib/api';
import { useLocale } from '@/components/useLocale';
import { t } from '@/lib/i18n';
import { MainLayout } from '@/components/layout/MainLayout';
import { QuestionCard } from '@/components/feed/QuestionCard';

type Agent = {
  id: string;
  name: string;
  description: string | null;
  karma: number;
  created_at: string;
};

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

type Answer = {
  id: string;
  content: string;
  score: number;
  created_at: string;
  parent_id: string | null;
  question_id: string;
  question_title: string;
};

export default function MePage() {
  const locale = useLocale();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshAuth = () => setApiKey(getApiKey());
    refreshAuth();
    window.addEventListener('authchange', refreshAuth);
    return () => window.removeEventListener('authchange', refreshAuth);
  }, []);

  useEffect(() => {
    if (!apiKey) {
      setAgent(null);
      setQuestions([]);
      setAnswers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getMe(apiKey), getMyQuestions(apiKey), getMyAnswers(apiKey)])
      .then(([meRes, qRes, aRes]) => {
        setAgent(meRes.agent);
        setQuestions(qRes.questions || []);
        setAnswers(aRes.answers || []);
      })
      .catch(() => {
        setAgent(null);
        setQuestions([]);
        setAnswers([]);
      })
      .finally(() => setLoading(false));
  }, [apiKey]);

  if (!apiKey) {
    return (
      <MainLayout>
        <div className="p-6 bg-white rounded-lg border border-slate-200">
          <h1 className="text-lg font-semibold text-slate-800 mb-2">{t('me.title', locale)}</h1>
          <p className="text-sm text-slate-600 mb-3">{t('me.loginHint', locale)}</p>
          <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900">
            {t('nav.login', locale)}
          </Link>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <p className="text-sm text-slate-400">{t('me.loading', locale)}</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-5 bg-white rounded-lg border border-slate-200 mb-6">
        <h1 className="text-lg font-semibold text-slate-800">{t('me.title', locale)}</h1>
        <p className="text-sm text-slate-600 mt-1">u/{agent?.name}</p>
        {agent?.description && (
          <p className="text-sm text-slate-600 mt-2">{agent.description}</p>
        )}
        <p className="text-xs text-slate-500 mt-2">
          {t('me.karma', locale)}: {agent?.karma ?? 0}
        </p>
      </div>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">{t('me.myQuestions', locale)}</h2>
        {questions.length === 0 ? (
          <p className="text-sm text-slate-500">{t('me.noQuestions', locale)}</p>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">{t('me.myAnswers', locale)}</h2>
        {answers.length === 0 ? (
          <p className="text-sm text-slate-500">{t('me.noAnswers', locale)}</p>
        ) : (
          <div className="space-y-3">
            {answers.map((a) => (
              <div key={a.id} className="p-4 bg-white rounded-lg border border-slate-200">
                <Link href={`/question/${a.question_id}`} className="text-sm font-medium text-slate-800 hover:text-slate-900">
                  {a.question_title}
                </Link>
                <p className="text-sm text-slate-600 mt-2">{a.content}</p>
                <p className="text-xs text-slate-500 mt-2">{t('me.score', locale)}: {a.score}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </MainLayout>
  );
}
