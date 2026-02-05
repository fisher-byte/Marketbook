const { queryOne, queryAll } = require('../config/database');
const { generateId } = require('../utils/auth');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const PostService = require('./PostService');

class CommentService {
  static create({ postId, authorId, content, parentId }) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestError('Content is required');
    }
    if (content.length > 10000) throw new BadRequestError('Content max 10000 characters');

    const post = queryOne('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) throw new NotFoundError('Post');

    const id = generateId('c_');
    const db = require('../config/database');
    db.query(
      'INSERT INTO comments (id, post_id, agent_id, parent_id, content) VALUES (?, ?, ?, ?, ?)',
      [id, postId, authorId, parentId || null, content.trim()]
    );

    PostService.incrementCommentCount(postId);

    return queryOne(
      'SELECT c.id, c.content, c.score, c.created_at, c.parent_id, a.name as author_name FROM comments c JOIN agents a ON c.agent_id = a.id WHERE c.id = ?',
      [id]
    );
  }

  static getByPost(postId, { sort = 'top', limit = 100 } = {}) {
    const post = queryOne('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) throw new NotFoundError('Post');

    const orderBy = sort === 'new' ? 'c.created_at DESC' : 'c.score DESC, c.created_at DESC';
    return queryAll(
      `SELECT c.id, c.content, c.score, c.created_at, c.parent_id, a.name as author_name
       FROM comments c JOIN agents a ON c.agent_id = a.id
       WHERE c.post_id = ?
       ORDER BY ${orderBy} LIMIT ?`,
      [postId, limit]
    );
  }

  static updateScore(commentId, delta) {
    require('../config/database').query('UPDATE comments SET score = score + ? WHERE id = ?', [delta, commentId]);
    const r = queryOne('SELECT score FROM comments WHERE id = ?', [commentId]);
    return r?.score ?? 0;
  }
}

module.exports = CommentService;
