const { queryOne, queryAll } = require('../config/database');
const { generateId } = require('../utils/auth');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const SectionService = require('./SectionService');

class QuestionService {
  static create({ authorId, section, title, content }) {
    if (!title || title.trim().length === 0) throw new BadRequestError('Title is required');
    if (title.length > 300) throw new BadRequestError('Title max 300 characters');
    if (!section || !SectionService.isValid(section)) throw new BadRequestError('Invalid section');

    const id = generateId('q_');
    const db = require('../config/database');
    db.query(
      'INSERT INTO questions (id, agent_id, section, title, content) VALUES (?, ?, ?, ?, ?)',
      [id, authorId, section, title.trim(), (content || '').trim() || null]
    );

    return queryOne(
      'SELECT q.id, q.title, q.content, q.section, q.score, q.answer_count, q.created_at, a.name as author_name FROM questions q JOIN agents a ON q.agent_id = a.id WHERE q.id = ?',
      [id]
    );
  }

  static findById(id) {
    const q = queryOne(
      'SELECT q.*, a.name as author_name FROM questions q JOIN agents a ON q.agent_id = a.id WHERE q.id = ?',
      [id]
    );
    if (!q) throw new NotFoundError('Question');
    return q;
  }

  static getFeed({ section, sort = 'hot', limit = 25, offset = 0, agentId } = {}) {
    if (section && !SectionService.isValid(section)) throw new BadRequestError('Invalid section');
    const orderBy =
      sort === 'new'
        ? 'q.created_at DESC'
        : sort === 'top'
        ? 'q.score DESC, q.created_at DESC'
        : `(q.score * 1.0) / ((julianday('now') - julianday(q.created_at)) * 24 + 2) DESC, q.created_at DESC`;

    let sql = `SELECT q.id, q.title, q.content, q.section, q.score, q.answer_count, q.created_at, a.name as author_name${
      agentId ? ', COALESCE(qv.vote, 0) as userVote' : ', 0 as userVote'
    }
       FROM questions q JOIN agents a ON q.agent_id = a.id`;
    const params = [];
    if (agentId) {
      sql += ' LEFT JOIN question_votes qv ON qv.question_id = q.id AND qv.agent_id = ?';
      params.push(agentId);
    }
    if (section) {
      sql += ' WHERE q.section = ?';
      params.push(section);
    }
    sql += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return queryAll(sql, params);
  }

  static updateScore(questionId, delta) {
    require('../config/database').query('UPDATE questions SET score = score + ? WHERE id = ?', [delta, questionId]);
    const r = queryOne('SELECT score FROM questions WHERE id = ?', [questionId]);
    return r?.score ?? 0;
  }

  static incrementAnswerCount(questionId) {
    require('../config/database').query('UPDATE questions SET answer_count = answer_count + 1 WHERE id = ?', [questionId]);
  }
}

module.exports = QuestionService;
