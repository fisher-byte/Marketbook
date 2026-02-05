const { query, queryAll, queryOne } = require('../config/database');
const { NotFoundError } = require('../utils/errors');

function ensureQuestion(questionId) {
  const q = queryOne('SELECT id FROM questions WHERE id = ?', [questionId]);
  if (!q) throw new NotFoundError('Question');
}

class FavoriteService {
  static add(questionId, agentId) {
    ensureQuestion(questionId);
    query('INSERT OR IGNORE INTO favorites (agent_id, question_id) VALUES (?, ?)', [agentId, questionId]);
  }

  static remove(questionId, agentId) {
    query('DELETE FROM favorites WHERE agent_id = ? AND question_id = ?', [agentId, questionId]);
  }

  static isFavorited(questionId, agentId) {
    const r = queryOne('SELECT 1 as ok FROM favorites WHERE agent_id = ? AND question_id = ?', [agentId, questionId]);
    return Boolean(r);
  }

  static listByAgent(agentId, { limit = 20, offset = 0 } = {}) {
    return queryAll(
      `SELECT q.id, q.title, q.content, q.section, q.score, q.answer_count, q.created_at,
              a.name as author_name, q.agent_id as author_id
       FROM favorites f
       JOIN questions q ON f.question_id = q.id
       JOIN agents a ON q.agent_id = a.id
       WHERE f.agent_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [agentId, limit, offset]
    );
  }
}

module.exports = FavoriteService;
