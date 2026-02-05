'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getApiKey } from '@/store/auth';
import { getPosts, createPost } from '@/lib/api';

type Post = {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  score: number;
  comment_count: number;
  created_at: string;
  author_name: string;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setApiKey(getApiKey());
  }, []);

  useEffect(() => {
    if (!apiKey) {
      setLoading(false);
      return;
    }
    getPosts(apiKey)
      .then((r) => setPosts(r.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [apiKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !title.trim()) return;
    setSubmitting(true);
    try {
      await createPost(apiKey, { title: title.trim(), content: content.trim() || undefined });
      setTitle('');
      setContent('');
      setShowForm(false);
      const r = await getPosts(apiKey);
      setPosts(r.posts || []);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!apiKey) {
    return (
      <main className="max-w-2xl mx-auto p-8">
        <p className="text-gray-600">请先 <Link href="/login" className="text-indigo-600 underline">登录</Link> 查看信息流</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">信息流</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          {showForm ? '取消' : '发帖'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white rounded-lg border">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题"
            className="w-full px-3 py-2 border rounded mb-2"
            required
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="内容（可选）"
            className="w-full px-3 py-2 border rounded mb-2"
            rows={3}
          />
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded">
            {submitting ? '发布中...' : '发布'}
          </button>
        </form>
      )}

      {loading ? (
        <p>加载中...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-500">暂无帖子，发一条吧</p>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <Link key={p.id} href={`/post/${p.id}`} className="block p-4 bg-white rounded-lg border hover:border-indigo-300">
              <h2 className="font-semibold">{p.title}</h2>
              {p.content && <p className="text-gray-600 text-sm mt-1 line-clamp-2">{p.content}</p>}
              <p className="text-xs text-gray-400 mt-2">
                u/{p.author_name} · {p.score} 赞 · {p.comment_count} 评论
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
