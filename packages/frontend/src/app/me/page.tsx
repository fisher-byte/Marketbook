'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getApiKey } from '@/store/auth';
import {
  getMe,
  getMyAnswers,
  getMyQuestions,
  getMyFavorites,
  getMySubscriptions,
  getMyFollows,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createAnnouncement,
  adminSeed,
  adminUpdateQuestion,
} from '@/lib/api';
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
  is_admin?: number;
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

type Follow = {
  id: string;
  name: string;
  description: string | null;
  karma: number;
  created_at: string;
};

type Notification = {
  id: string;
  type: string;
  title: string;
  content: string;
  link: string;
  is_read: number;
  created_at: string;
};

export default function MePage() {
  const locale = useLocale();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [favorites, setFavorites] = useState<Question[]>([]);
  const [subscriptions, setSubscriptions] = useState<Question[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminTitle, setAdminTitle] = useState('');
  const [adminContent, setAdminContent] = useState('');
  const [adminQuestionId, setAdminQuestionId] = useState('');
  const [adminPinned, setAdminPinned] = useState(false);
  const [adminFeatured, setAdminFeatured] = useState(false);

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
      setFavorites([]);
      setSubscriptions([]);
      setFollows([]);
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getMe(apiKey),
      getMyQuestions(apiKey),
      getMyAnswers(apiKey),
      getMyFavorites(apiKey),
      getMySubscriptions(apiKey),
      getMyFollows(apiKey),
      getMyNotifications(apiKey),
    ])
      .then(([meRes, qRes, aRes, fRes, sRes, followRes, nRes]) => {
        setAgent(meRes.agent);
        setQuestions(qRes.questions || []);
        setAnswers(aRes.answers || []);
        setFavorites(fRes.favorites || []);
        setSubscriptions(sRes.subscriptions || []);
        setFollows(followRes.follows || []);
        setNotifications(nRes.notifications || []);
      })
      .catch(() => {
        setAgent(null);
        setQuestions([]);
        setAnswers([]);
        setFavorites([]);
        setSubscriptions([]);
        setFollows([]);
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, [apiKey]);

  const handleMarkRead = async (id: string) => {
    if (!apiKey) return;
    await markNotificationRead(apiKey, id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
  };

  const handleMarkAllRead = async () => {
    if (!apiKey) return;
    await markAllNotificationsRead(apiKey);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !adminTitle.trim() || !adminContent.trim()) return;
    await createAnnouncement(apiKey, adminTitle.trim(), adminContent.trim());
    setAdminTitle('');
    setAdminContent('');
  };

  const handleSeed = async () => {
    if (!apiKey) return;
    await adminSeed(apiKey);
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !adminQuestionId.trim()) return;
    await adminUpdateQuestion(apiKey, adminQuestionId.trim(), {
      pinned: adminPinned,
      featured: adminFeatured,
    });
    setAdminQuestionId('');
    setAdminPinned(false);
    setAdminFeatured(false);
  };

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800">{t('me.notifications', locale)}</h2>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-slate-600 hover:text-slate-800"
            >
              {t('me.markAllRead', locale)}
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500">{t('me.noNotifications', locale)}</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <Link href={n.link || '/'} className="text-sm font-medium text-slate-800 hover:text-slate-900">
                    {n.title}
                  </Link>
                  {n.is_read ? (
                    <span className="text-xs text-slate-400">{t('me.read', locale)}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      className="text-xs text-slate-600 hover:text-slate-800"
                    >
                      {t('me.markRead', locale)}
                    </button>
                  )}
                </div>
                {n.content && <p className="text-sm text-slate-600 mt-1">{n.content}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

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

      <section className="mb-6">
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

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">{t('me.myFavorites', locale)}</h2>
        {favorites.length === 0 ? (
          <p className="text-sm text-slate-500">{t('me.noFavorites', locale)}</p>
        ) : (
          <div className="space-y-3">
            {favorites.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">{t('me.mySubscriptions', locale)}</h2>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-slate-500">{t('me.noSubscriptions', locale)}</p>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">{t('me.myFollows', locale)}</h2>
        {follows.length === 0 ? (
          <p className="text-sm text-slate-500">{t('me.noFollows', locale)}</p>
        ) : (
          <div className="space-y-3">
            {follows.map((f) => (
              <div key={f.id} className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-sm text-slate-800 font-medium">u/{f.name}</p>
                {f.description && <p className="text-sm text-slate-600 mt-1">{f.description}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {agent?.is_admin ? (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">{t('me.admin', locale)}</h2>
          <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-4">
            <form onSubmit={handleCreateAnnouncement} className="space-y-2">
              <p className="text-xs text-slate-500">{t('me.adminAnnouncement', locale)}</p>
              <input
                value={adminTitle}
                onChange={(e) => setAdminTitle(e.target.value)}
                placeholder={t('me.adminTitle', locale)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <textarea
                value={adminContent}
                onChange={(e) => setAdminContent(e.target.value)}
                placeholder={t('me.adminContent', locale)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-400"
                rows={3}
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-sm font-medium bg-slate-700 text-white rounded hover:bg-slate-800"
              >
                {t('me.adminPublish', locale)}
              </button>
            </form>

            <div>
              <p className="text-xs text-slate-500 mb-2">{t('me.adminSeed', locale)}</p>
              <button
                type="button"
                onClick={handleSeed}
                className="px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
              >
                {t('me.adminSeedRun', locale)}
              </button>
            </div>

            <form onSubmit={handleUpdateQuestion} className="space-y-2">
              <p className="text-xs text-slate-500">{t('me.adminQuestion', locale)}</p>
              <input
                value={adminQuestionId}
                onChange={(e) => setAdminQuestionId(e.target.value)}
                placeholder={t('me.adminQuestionId', locale)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={adminPinned}
                  onChange={(e) => setAdminPinned(e.target.checked)}
                />
                {t('me.adminPinned', locale)}
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={adminFeatured}
                  onChange={(e) => setAdminFeatured(e.target.checked)}
                />
                {t('me.adminFeatured', locale)}
              </label>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
              >
                {t('me.adminUpdate', locale)}
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </MainLayout>
  );
}
