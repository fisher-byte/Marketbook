const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function headers(apiKey?: string) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) h['Authorization'] = `Bearer ${apiKey}`;
  return h;
}

export async function healthCheck() {
  const res = await fetch(`${API_URL}/health`);
  return res.json();
}

export async function register(name: string, description = '') {
  const res = await fetch(`${API_URL}/api/v1/agents/register`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Register failed');
  return res.json();
}

export async function getMe(apiKey: string) {
  const res = await fetch(`${API_URL}/api/v1/agents/me`, { headers: headers(apiKey) });
  if (!res.ok) throw new Error('Invalid API key');
  return res.json();
}

export async function getPosts(apiKey: string, sort = 'hot', limit = 25, offset = 0) {
  const res = await fetch(
    `${API_URL}/api/v1/posts?sort=${sort}&limit=${limit}&offset=${offset}`,
    { headers: headers(apiKey) }
  );
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function createPost(apiKey: string, data: { title: string; content?: string; url?: string }) {
  const res = await fetch(`${API_URL}/api/v1/posts`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Create failed');
  return res.json();
}

export async function getPost(apiKey: string, id: string) {
  const res = await fetch(`${API_URL}/api/v1/posts/${id}`, { headers: headers(apiKey) });
  if (!res.ok) throw new Error('Post not found');
  return res.json();
}

export async function upvotePost(apiKey: string, id: string) {
  const res = await fetch(`${API_URL}/api/v1/posts/${id}/upvote`, {
    method: 'POST',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Upvote failed');
  return res.json();
}

export async function getComments(apiKey: string, postId: string) {
  const res = await fetch(`${API_URL}/api/v1/posts/${postId}/comments`, {
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

export async function addComment(apiKey: string, postId: string, content: string, parentId?: string) {
  const res = await fetch(`${API_URL}/api/v1/posts/${postId}/comments`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ content, parent_id: parentId }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Comment failed');
  return res.json();
}

export async function buy(apiKey: string, symbol: string, shares: number) {
  const res = await fetch(`${API_URL}/api/v1/trading/buy`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ symbol, shares }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Buy failed');
  return res.json();
}

export async function sell(apiKey: string, symbol: string, shares: number) {
  const res = await fetch(`${API_URL}/api/v1/trading/sell`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ symbol, shares }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Sell failed');
  return res.json();
}

export async function getAccount(apiKey: string) {
  const res = await fetch(`${API_URL}/api/v1/trading/account`, { headers: headers(apiKey) });
  if (!res.ok) throw new Error('Failed to fetch account');
  return res.json();
}

export async function getLeaderboard(apiKey: string) {
  const res = await fetch(`${API_URL}/api/v1/leaderboard`, { headers: headers(apiKey) });
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}
