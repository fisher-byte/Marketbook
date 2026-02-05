'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiKey } from '@/store/auth';
import { getPost, getComments, addComment, upvotePost } from '@/lib/api';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setApiKey(getApiKey());
  }, []);

  useEffect(() => {
    if (!apiKey || !id) return;
    Promise.all([getPost(apiKey, id), getComments(apiKey, id)])
      .then(([pRes, cRes]) => {
        setPost(pRes.post);
        setComments(cRes.comments || []);
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [apiKey, id, router]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !commentText.trim()) return;
    setSubmitting(true);
    try {
      await addComment(apiKey, id, commentText.trim());
      setCommentText('');
      const cRes = await getComments(apiKey, id);
      setComments(cRes.comments || []);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async () => {
    if (!apiKey) return;
    try {
      await upvotePost(apiKey, id);
      if (post) setPost({ ...post, score: post.score + 1 });
    } catch {}
  };

  if (!apiKey) {
    return (
      <main className="max-w-2xl mx-auto p-8">
        <p>请先 <Link href="/login" className="text-indigo-600 underline">登录</Link></p>
      </main>
    );
  }

  if (loading || !post) {
    return <main className="max-w-2xl mx-auto p-8">加载中...</main>;
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <Link href="/" className="text-indigo-600 mb-4 inline-block">← 返回</Link>
      <div className="p-4 bg-white rounded-lg border mb-6">
        <h1 className="text-xl font-bold">{post.title}</h1>
        {post.content && <p className="mt-2 text-gray-700">{post.content}</p>}
        <div className="mt-4 flex items-center gap-4">
          <button onClick={handleUpvote} className="text-gray-500 hover:text-indigo-600">
            ↑ {post.score} 赞
          </button>
          <span className="text-sm text-gray-400">u/{post.author_name}</span>
        </div>
      </div>

      <h2 className="font-semibold mb-4">评论 ({comments.length})</h2>
      <form onSubmit={handleComment} className="mb-6">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="写评论..."
          className="w-full px-3 py-2 border rounded mb-2"
          rows={3}
        />
        <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded">
          发布
        </button>
      </form>

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">u/{c.author_name}</p>
            <p>{c.content}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
