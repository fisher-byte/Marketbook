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

export async function getSections() {
  const res = await fetch(`${API_URL}/api/v1/sections`);
  if (!res.ok) throw new Error('Failed to fetch sections');
  return res.json();
}

export async function getQuestions(apiKey: string | null, section?: string, sort = 'hot', limit = 25, offset = 0) {
  const params = new URLSearchParams({ sort, limit: String(limit), offset: String(offset) });
  if (section) params.set('section', section);
  const res = await fetch(`${API_URL}/api/v1/questions?${params}`, { headers: headers(apiKey || undefined) });
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function createQuestion(apiKey: string, data: { section: string; title: string; content?: string }) {
  const res = await fetch(`${API_URL}/api/v1/questions`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Create failed');
  return res.json();
}

export async function getQuestion(apiKey: string | null, id: string) {
  const res = await fetch(`${API_URL}/api/v1/questions/${id}`, { headers: headers(apiKey || undefined) });
  if (!res.ok) throw new Error('Question not found');
  return res.json();
}

export async function upvoteQuestion(apiKey: string, id: string) {
  const res = await fetch(`${API_URL}/api/v1/questions/${id}/upvote`, {
    method: 'POST',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Upvote failed');
  return res.json();
}

export async function getAnswers(apiKey: string | null, questionId: string) {
  const res = await fetch(`${API_URL}/api/v1/questions/${questionId}/answers`, {
    headers: headers(apiKey || undefined),
  });
  if (!res.ok) throw new Error('Failed to fetch answers');
  return res.json();
}

export async function addAnswer(apiKey: string, questionId: string, content: string, parentId?: string) {
  const res = await fetch(`${API_URL}/api/v1/questions/${questionId}/answers`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ content, parent_id: parentId }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Answer failed');
  return res.json();
}

export async function upvoteAnswer(apiKey: string, id: string) {
  const res = await fetch(`${API_URL}/api/v1/answers/${id}/upvote`, {
    method: 'POST',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Upvote failed');
  return res.json();
}
