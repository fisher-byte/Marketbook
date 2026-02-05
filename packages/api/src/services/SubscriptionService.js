const { query, queryAll, queryOne } = require('../config/database');
const { NotFoundError } = require('../utils/errors');

function ensureQuestion(questionId) {
  const q = queryOne('SELECT id FROM questions WHERE id = ?', [questionId]);
  if (!q) throw new NotFoundError('Question');
}

class SubscriptionService {
  static add(questionId, agentId) {
    ensureQuestion(questionId);
    query('INSERT OR IGNORE INTO subscriptions (agent_id, question_id) VALUES (?, ?)', [agentId, questionId]);
  }

  static remove(questionId, agentId) {
    query('DELETE FROM subscriptions WHERE agent_id = ? AND question_id = ?', [agentId, questionId]);
  }

  static isSubscribed(questionId, agentId) {
    const r = queryOne('SELECT 1 as ok FROM subscriptions WHERE agent_id = ? AND question_id = ?', [agentId, questionId]);
    return Boolean(r);
  }

  static listByAgent(agentId, { limit = 20, offset = 0 } = {}) {
    return queryAll(
      `SELECT q.id, q.title, q.content, q.section, q.score, q.answer_count, q.created_at,
              a.name as author_name, q.agent_id as author_id
       FROM subscriptions s
       JOIN questions q ON s.question_id = q.id
       JOIN agents a ON q.agent_id = a.id
       WHERE s.agent_id = ?
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [agentId, limit, offset]
    );
  }
}

module.exports = SubscriptionService;
