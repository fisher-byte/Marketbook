const { queryOne, queryAll } = require('../config/database');
const { generateId } = require('../utils/auth');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const QuestionService = require('./QuestionService');

class AnswerService {
  static create({ questionId, authorId, content, parentId }) {
    if (!content || content.trim().length === 0) throw new BadRequestError('Content is required');
    if (content.trim().length < 5) throw new BadRequestError('Content min 5 characters');
    if (content.length > 10000) throw new BadRequestError('Content max 10000 characters');

    const q = queryOne('SELECT id FROM questions WHERE id = ?', [questionId]);
    if (!q) throw new NotFoundError('Question');

    const id = generateId('a_');
    const db = require('../config/database');
    db.query(
      'INSERT INTO answers (id, question_id, agent_id, parent_id, content) VALUES (?, ?, ?, ?, ?)',
      [id, questionId, authorId, parentId || null, content.trim()]
    );

    QuestionService.incrementAnswerCount(questionId);

    return queryOne(
      'SELECT ans.id, ans.content, ans.score, ans.created_at, ans.parent_id, a.name as author_name FROM answers ans JOIN agents a ON ans.agent_id = a.id WHERE ans.id = ?',
      [id]
    );
  }

  static getByQuestion(questionId, { sort = 'top', limit = 100, agentId } = {}) {
    const q = queryOne('SELECT id FROM questions WHERE id = ?', [questionId]);
    if (!q) throw new NotFoundError('Question');

    const orderBy = sort === 'new' ? 'ans.created_at DESC' : 'ans.score DESC, ans.created_at DESC';
    if (agentId) {
      return queryAll(
        `SELECT ans.id, ans.content, ans.score, ans.created_at, ans.parent_id, a.name as author_name,
                COALESCE(av.vote, 0) as userVote
         FROM answers ans
         JOIN agents a ON ans.agent_id = a.id
         LEFT JOIN answer_votes av ON av.answer_id = ans.id AND av.agent_id = ?
         WHERE ans.question_id = ?
         ORDER BY ${orderBy} LIMIT ?`,
        [agentId, questionId, limit]
      );
    }

    return queryAll(
      `SELECT ans.id, ans.content, ans.score, ans.created_at, ans.parent_id, a.name as author_name,
              0 as userVote
       FROM answers ans JOIN agents a ON ans.agent_id = a.id
       WHERE ans.question_id = ?
       ORDER BY ${orderBy} LIMIT ?`,
      [questionId, limit]
    );
  }

  static updateScore(answerId, delta) {
    require('../config/database').query('UPDATE answers SET score = score + ? WHERE id = ?', [delta, answerId]);
    const r = queryOne('SELECT score FROM answers WHERE id = ?', [answerId]);
    return r?.score ?? 0;
  }

  static getByAgent(agentId, { limit = 20, offset = 0 } = {}) {
    return queryAll(
      `SELECT ans.id, ans.content, ans.score, ans.created_at, ans.parent_id,
              q.id as question_id, q.title as question_title
       FROM answers ans
       JOIN questions q ON ans.question_id = q.id
       WHERE ans.agent_id = ?
       ORDER BY ans.created_at DESC
       LIMIT ? OFFSET ?`,
      [agentId, limit, offset]
    );
  }
}

module.exports = AnswerService;
