'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiKey } from '@/store/auth';
import { getQuestion, getAnswers, addAnswer, upvoteQuestion, upvoteAnswer } from '@/lib/api';
import { useLocale } from '@/components/useLocale';
import { t } from '@/lib/i18n';
import { VoteButton } from '@/components/VoteButton';

const SECTION_NAMES: Record<string, string> = { a_stock: 'A股', us_stock: '美股', futures: '期货' };

export default function QuestionPage() {
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setApiKey(getApiKey());
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
      await addAnswer(apiKey, id, answerText.trim());
      setAnswerText('');
      const aRes = await getAnswers(apiKey, id);
      setAnswers(aRes.answers || []);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async () => {
    if (!apiKey) return;
    try {
      await upvoteQuestion(apiKey, id);
      if (question) setQuestion({ ...question, score: question.score + 1 });
    } catch {}
  };

  const handleAnswerUpvote = async (answerId: string) => {
    if (!apiKey) return;
    try {
      await upvoteAnswer(apiKey, answerId);
      setAnswers((prev) =>
        prev.map((a) => (a.id === answerId ? { ...a, score: a.score + 1 } : a))
      );
    } catch {}
  };

  if (loading || !question) {
    return <main className="max-w-2xl mx-auto p-8">{t('question.loading', locale)}</main>;
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <Link href="/" className="text-indigo-600 mb-4 inline-block">← {t('question.back', locale)}</Link>
      <div className="p-4 bg-white rounded-lg border mb-6">
        <span className="text-xs text-indigo-600">{t(`section.${SECTION_KEYS[question.section] || question.section}`, locale) || question.section}</span>
        <h1 className="text-xl font-bold mt-1">{question.title}</h1>
        {question.content && <p className="mt-2 text-gray-700">{question.content}</p>}
        <div className="mt-4 flex items-center gap-4">
          {apiKey ? (
            <VoteButton
              count={question.score}
              voted={question.userVote === 1}
              onClick={handleUpvote}
            />
          ) : (
            <span className="text-gray-400">↑ {question.score}</span>
          )}
          <span className="text-sm text-gray-400">u/{question.author_name}</span>
          {!apiKey && (
            <Link href="/login" className="ml-auto text-indigo-600 text-sm">{t('question.loginToVote', locale)}</Link>
          )}
        </div>
      </div>

      <h2 className="font-semibold mb-4">{t('question.answers', locale)} ({answers.length})</h2>
      {apiKey && (
        <form onSubmit={handleAnswer} className="mb-6">
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder={t('question.writeAnswer', locale)}
            className="w-full px-3 py-2 border rounded mb-2"
            rows={4}
          />
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded">
            {t('question.publish', locale)}
          </button>
        </form>
      )}
      {!apiKey && (
        <p className="mb-6 text-gray-500 text-sm">
          <Link href="/login" className="text-indigo-600">{t('question.loginToAnswer', locale)}</Link>
        </p>
      )}

      <div className="space-y-4">
        {answers.map((a) => (
          <div key={a.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start">
              <p className="text-sm text-gray-600">u/{a.author_name}</p>
              {apiKey ? (
                <VoteButton
                  count={a.score}
                  onClick={() => handleAnswerUpvote(a.id)}
                  compact
                />
              ) : (
                <span className="text-gray-400">↑ {a.score}</span>
              )}
            </div>
            <p className="mt-2">{a.content}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
