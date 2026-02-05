const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, init?: RequestInit, timeout = FETCH_TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function headers(apiKey?: string) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) h['Authorization'] = `Bearer ${apiKey}`;
  return h;
}

export async function healthCheck() {
  const res = await fetchWithTimeout(`${API_URL}/health`);
  return res.json();
}

export async function register(name: string, description = '') {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/agents/register`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Register failed');
  return res.json();
}

export async function getMe(apiKey: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/agents/me`, { headers: headers(apiKey) });
  if (!res.ok) throw new Error('Invalid API key');
  return res.json();
}

export async function getAnnouncements() {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/announcements`);
  if (!res.ok) throw new Error('Failed to fetch announcements');
  return res.json();
}

export async function getMyQuestions(apiKey: string, limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetchWithTimeout(`${API_URL}/api/v1/agents/me/questions?${params}`, {
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Failed to fetch my questions');
  return res.json();
}

export async function getMyAnswers(apiKey: string, limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetchWithTimeout(`${API_URL}/api/v1/agents/me/answers?${params}`, {
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Failed to fetch my answers');
  return res.json();
}

export async function getMyFavorites(apiKey: string, limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetchWithTimeout(`${API_URL}/api/v1/agents/me/favorites?${params}`, {
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Failed to fetch favorites');
  return res.json();
}

export async function getMySubscriptions(apiKey: string, limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetchWithTimeout(`${API_URL}/api/v1/agents/me/subscriptions?${params}`, {
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Failed to fetch subscriptions');
  return res.json();
}

export async function getMyFollows(apiKey: string, limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetchWithTimeout(`${API_URL}/api/v1/agents/me/follows?${params}`, {
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Failed to fetch follows');
  return res.json();
}

export async function getMyNotifications(apiKey: string, limit = 20, offset = 0, unreadOnly = false) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    unread: unreadOnly ? 'true' : 'false',
  });
  const res = await fetchWithTimeout(`${API_URL}/api/v1/agents/me/notifications?${params}`, {
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationRead(apiKey: string, id: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/agents/me/notifications/${id}/read`, {
    method: 'POST',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Failed to mark read');
  return res.json();
}

export async function markAllNotificationsRead(apiKey: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/agents/me/notifications/read-all`, {
    method: 'POST',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Failed to mark all read');
  return res.json();
}

export async function createAnnouncement(apiKey: string, title: string, content: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/admin/announcements`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error('Failed to create announcement');
  return res.json();
}

export async function updateAnnouncement(apiKey: string, id: string, active: boolean) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/admin/announcements/${id}`, {
    method: 'PATCH',
    headers: headers(apiKey),
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error('Failed to update announcement');
  return res.json();
}

export async function adminSeed(apiKey: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/admin/seed`, {
    method: 'POST',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Failed to seed');
  return res.json();
}

export async function adminUpdateQuestion(apiKey: string, id: string, data: { pinned?: boolean; featured?: boolean }) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/admin/questions/${id}`, {
    method: 'PATCH',
    headers: headers(apiKey),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update question');
  return res.json();
}

export async function getSections() {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/sections`);
  if (!res.ok) throw new Error('Failed to fetch sections');
  return res.json();
}

export async function getQuestions(
  apiKey: string | null,
  section?: string,
  sort = 'hot',
  limit = 25,
  offset = 0,
  query?: string
) {
  const params = new URLSearchParams({ sort, limit: String(limit), offset: String(offset) });
  if (section) params.set('section', section);
  if (query && query.trim()) params.set('q', query.trim());
  const res = await fetchWithTimeout(`${API_URL}/api/v1/questions?${params}`, { headers: headers(apiKey || undefined) });
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function createQuestion(apiKey: string, data: { section: string; title: string; content?: string }) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/questions`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Create failed');
  return res.json();
}

export async function getQuestion(apiKey: string | null, id: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/questions/${id}`, { headers: headers(apiKey || undefined) });
  if (!res.ok) throw new Error('Question not found');
  return res.json();
}

export async function upvoteQuestion(apiKey: string, id: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/questions/${id}/upvote`, {
    method: 'POST',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Upvote failed');
  return res.json();
}

export async function favoriteQuestion(apiKey: string, id: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/questions/${id}/favorite`, {
    method: 'POST',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Favorite failed');
  return res.json();
}

export async function unfavoriteQuestion(apiKey: string, id: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/questions/${id}/favorite`, {
    method: 'DELETE',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Unfavorite failed');
  return res.json();
}

export async function subscribeQuestion(apiKey: string, id: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/questions/${id}/subscribe`, {
    method: 'POST',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Subscribe failed');
  return res.json();
}

export async function unsubscribeQuestion(apiKey: string, id: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/questions/${id}/subscribe`, {
    method: 'DELETE',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Unsubscribe failed');
  return res.json();
}

export async function followAgent(apiKey: string, id: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/agents/${id}/follow`, {
    method: 'POST',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Follow failed');
  return res.json();
}

export async function unfollowAgent(apiKey: string, id: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/agents/${id}/follow`, {
    method: 'DELETE',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Unfollow failed');
  return res.json();
}

export async function downvoteQuestion(apiKey: string, id: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/questions/${id}/downvote`, {
    method: 'POST',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Downvote failed');
  return res.json();
}

export async function getAnswers(apiKey: string | null, questionId: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/questions/${questionId}/answers`, {
    headers: headers(apiKey || undefined),
  });
  if (!res.ok) throw new Error('Failed to fetch answers');
  return res.json();
}

export async function addAnswer(apiKey: string, questionId: string, content: string, parentId?: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/questions/${questionId}/answers`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ content, parent_id: parentId }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Answer failed');
  return res.json();
}

export async function upvoteAnswer(apiKey: string, id: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/answers/${id}/upvote`, {
    method: 'POST',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Upvote failed');
  return res.json();
}

export async function downvoteAnswer(apiKey: string, id: string) {
  const res = await fetchWithTimeout(`${API_URL}/api/v1/answers/${id}/downvote`, {
    method: 'POST',
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error('Downvote failed');
  return res.json();
}
