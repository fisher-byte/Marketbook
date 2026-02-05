'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiKey } from '@/store/auth';
import {
  getQuestion,
  getAnswers,
  addAnswer,
  upvoteQuestion,
  downvoteQuestion,
  upvoteAnswer,
  downvoteAnswer,
} from '@/lib/api';
import { useLocale } from '@/components/useLocale';
import { t } from '@/lib/i18n';
import { VoteControls } from '@/components/VoteControls';
import { MainLayout } from '@/components/layout/MainLayout';

const SECTION_KEYS: Record<string, string> = { a_stock: 'a_stock', us_stock: 'us_stock', futures: 'futures' };

type Question = {
  id: string;
  title: string;
  content: string | null;
  section: string;
  score: number;
  author_name: string;
  userVote?: number;
  answer_count?: number;
};

type Answer = {
  id: string;
  content: string;
  score: number;
  parent_id: string | null;
  author_name: string;
  userVote?: number;
};

export default function QuestionPage() {
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; author_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const refreshAuth = () => setApiKey(getApiKey());
    refreshAuth();
    window.addEventListener('authchange', refreshAuth);
    return () => window.removeEventListener('authchange', refreshAuth);
  }, []);

  useEffect(() => {
    if (!id) return;
    Promise.all([getQuestion(apiKey, id), getAnswers(apiKey, id)])
      .then(([qRes, aRes]) => {
        setQuestion(qRes.question);
        setAnswers(aRes.answers || []);
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [apiKey, id, router]);

  const handleAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !answerText.trim()) return;
    setSubmitting(true);
    try {
      await addAnswer(apiKey, id, answerText.trim(), replyTo?.id);
      setAnswerText('');
      setReplyTo(null);
      const aRes = await getAnswers(apiKey, id);
      setAnswers(aRes.answers || []);
      setQuestion((prev) =>
        prev ? { ...prev, answer_count: (aRes.answers || []).length } : prev
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('questionAnswerCountChange', {
            detail: { id, answerCount: (aRes.answers || []).length },
          })
        );
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async () => {
    if (!apiKey) return;
    try {
      const result = await upvoteQuestion(apiKey, id);
      if (question) {
        const nextVote = result.action === 'removed' ? 0 : 1;
        setQuestion({ ...question, score: result.score, userVote: nextVote });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('questionVoteChange', {
              detail: { id, score: result.score, userVote: nextVote },
            })
          );
        }
      }
    } catch {}
  };

  const handleDownvote = async () => {
    if (!apiKey) return;
    try {
      const result = await downvoteQuestion(apiKey, id);
      if (question) {
        const nextVote = result.action === 'removed' ? 0 : -1;
        setQuestion({ ...question, score: result.score, userVote: nextVote });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('questionVoteChange', {
              detail: { id, score: result.score, userVote: nextVote },
            })
          );
        }
      }
    } catch {}
  };

  const handleAnswerUpvote = async (answerId: string) => {
    if (!apiKey) return;
    try {
      const result = await upvoteAnswer(apiKey, answerId);
      setAnswers((prev) =>
        prev.map((a) => {
          if (a.id !== answerId) return a;
          const nextVote = result.action === 'removed' ? 0 : 1;
          return { ...a, score: result.score, userVote: nextVote };
        })
      );
    } catch {}
  };

  const handleAnswerDownvote = async (answerId: string) => {
    if (!apiKey) return;
    try {
      const result = await downvoteAnswer(apiKey, answerId);
      setAnswers((prev) =>
        prev.map((a) => {
          if (a.id !== answerId) return a;
          const nextVote = result.action === 'removed' ? 0 : -1;
          return { ...a, score: result.score, userVote: nextVote };
        })
      );
    } catch {}
  };

  if (loading || !question) {
    return (
      <MainLayout>
        <p className="text-sm text-slate-400">{t('question.loading', locale)}</p>
      </MainLayout>
    );
  }

  const sectionLabel = t(`section.${SECTION_KEYS[question.section] || question.section}`, locale) || question.section;
  const answerMap = new Map(answers.map((a) => [a.id, a]));
  const childrenMap = new Map<string, Answer[]>();
  answers.forEach((a) => {
    if (!a.parent_id) return;
    const list = childrenMap.get(a.parent_id) || [];
    list.push(a);
    childrenMap.set(a.parent_id, list);
  });
  const rootAnswers = answers.filter((a) => !a.parent_id);

  const renderAnswer = (a: Answer, depth = 0) => {
    const parent = a.parent_id ? answerMap.get(a.parent_id) : null;
    const children = childrenMap.get(a.id) || [];
    return (
      <div key={a.id} className={`flex gap-3 ${depth > 0 ? 'ml-6' : ''}`}>
        <div className="flex-shrink-0 pt-1">
          <VoteControls
            score={a.score}
            userVote={a.userVote || 0}
            onUpvote={apiKey ? () => handleAnswerUpvote(a.id) : undefined}
            onDownvote={apiKey ? () => handleAnswerDownvote(a.id) : undefined}
            disabled={!apiKey}
            compact
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-600">u/{a.author_name}</p>
          {parent && (
            <p className="text-xs text-slate-500 mt-1">
              ↳ {t('question.replyTo', locale)} u/{parent.author_name}
            </p>
          )}
          <p className="mt-1 text-slate-700 text-sm">{a.content}</p>
          {apiKey && (
            <button
              type="button"
              onClick={() => setReplyTo({ id: a.id, author_name: a.author_name })}
              className="mt-2 text-xs text-slate-500 hover:text-slate-700"
            >
              {t('question.reply', locale)}
            </button>
          )}
          {children.length > 0 && (
            <div className="mt-3 space-y-3">
              {children.map((child) => renderAnswer(child, depth + 1))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <Link href="/" className="text-sm text-slate-600 hover:text-slate-900 mb-6 inline-block">
        ← {t('question.back', locale)}
      </Link>

      <div className="flex gap-4">
        <div className="flex flex-col items-center min-w-[3rem] pt-1">
          <VoteControls
            score={question.score}
            userVote={question.userVote || 0}
            onUpvote={apiKey ? handleUpvote : undefined}
            onDownvote={apiKey ? handleDownvote : undefined}
            disabled={!apiKey}
          />
        </div>

        <div className="flex-1 min-w-0">
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600 mb-2">
            {sectionLabel}
          </span>
          <h1 className="text-lg font-semibold text-slate-800">{question.title}</h1>
          {question.content && (
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">{question.content}</p>
          )}
          <p className="mt-3 text-sm text-slate-500">
            u/{question.author_name}
            {!apiKey && (
              <>
                {' · '}
                <Link href="/login" className="text-slate-600 hover:text-slate-900">
                  {t('question.loginToVote', locale)}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <h2 className="text-sm font-medium text-slate-800 mb-4">
          {t('question.answers', locale)} ({answers.length})
        </h2>

        {apiKey && (
          <form onSubmit={handleAnswer} className="mb-6">
            {replyTo && (
              <div className="mb-2 text-xs text-slate-500 flex items-center gap-2">
                <span>
                  {t('question.replyTo', locale)} u/{replyTo.author_name}
                </span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-slate-600 hover:text-slate-800"
                >
                  {t('question.cancelReply', locale)}
                </button>
              </div>
            )}
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder={
                replyTo
                  ? `${t('question.replyTo', locale)} u/${replyTo.author_name}`
                  : t('question.writeAnswer', locale)
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded mb-2 focus:outline-none focus:ring-1 focus:ring-slate-400"
              rows={4}
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 text-sm font-medium bg-slate-700 text-white rounded hover:bg-slate-800 disabled:opacity-60"
            >
              {t('question.publish', locale)}
            </button>
          </form>
        )}
        {!apiKey && (
          <p className="mb-6 text-slate-500 text-sm">
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              {t('question.loginToAnswer', locale)}
            </Link>
          </p>
        )}

        <div className="space-y-4">
          {rootAnswers.map((a) => (
            <div key={a.id} className="pl-4 border-l-2 border-slate-200">
              {renderAnswer(a)}
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
