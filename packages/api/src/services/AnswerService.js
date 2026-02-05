const { queryOne, queryAll } = require('../config/database');
const { generateId } = require('../utils/auth');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const QuestionService = require('./QuestionService');
const NotificationService = require('./NotificationService');

class AnswerService {
  static create({ questionId, authorId, content, parentId }) {
    if (!content || content.trim().length === 0) throw new BadRequestError('Content is required');
    if (content.trim().length < 5) throw new BadRequestError('Content min 5 characters');
    if (content.length > 10000) throw new BadRequestError('Content max 10000 characters');

    const q = queryOne('SELECT id, agent_id FROM questions WHERE id = ?', [questionId]);
    if (!q) throw new NotFoundError('Question');

    const id = generateId('a_');
    const db = require('../config/database');
    db.query(
      'INSERT INTO answers (id, question_id, agent_id, parent_id, content) VALUES (?, ?, ?, ?, ?)',
      [id, questionId, authorId, parentId || null, content.trim()]
    );

    QuestionService.incrementAnswerCount(questionId);

    const created = queryOne(
      'SELECT ans.id, ans.content, ans.score, ans.created_at, ans.parent_id, a.name as author_name, ans.agent_id as author_id FROM answers ans JOIN agents a ON ans.agent_id = a.id WHERE ans.id = ?',
      [id]
    );

    if (q.agent_id && q.agent_id !== authorId) {
      NotificationService.create({
        agentId: q.agent_id,
        type: 'answer',
        title: 'New answer',
        content: '有人回答了你的问题',
        link: `/question/${questionId}`,
      });
    }

    if (parentId) {
      const parent = queryOne('SELECT agent_id FROM answers WHERE id = ?', [parentId]);
      if (parent?.agent_id && parent.agent_id !== authorId) {
        NotificationService.create({
          agentId: parent.agent_id,
          type: 'reply',
          title: 'New reply',
          content: '有人回复了你的回答',
          link: `/question/${questionId}`,
        });
      }
    }

    const subscribers = queryAll(
      'SELECT agent_id FROM subscriptions WHERE question_id = ? AND agent_id != ?',
      [questionId, authorId]
    );
    subscribers.forEach((s) => {
      if (s.agent_id === q.agent_id) return;
      NotificationService.create({
        agentId: s.agent_id,
        type: 'subscription',
        title: 'New update',
        content: '你订阅的问题有新回答',
        link: `/question/${questionId}`,
      });
    });

    return created;
  }

  static getByQuestion(questionId, { sort = 'top', limit = 100, agentId } = {}) {
    const q = queryOne('SELECT id FROM questions WHERE id = ?', [questionId]);
    if (!q) throw new NotFoundError('Question');

    const orderBy = sort === 'new' ? 'ans.created_at DESC' : 'ans.score DESC, ans.created_at DESC';
    if (agentId) {
      return queryAll(
      `SELECT ans.id, ans.content, ans.score, ans.created_at, ans.parent_id, a.name as author_name, ans.agent_id as author_id,
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
      `SELECT ans.id, ans.content, ans.score, ans.created_at, ans.parent_id, a.name as author_name, ans.agent_id as author_id,
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
