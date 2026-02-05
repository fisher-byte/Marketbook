const { queryOne, queryAll } = require('../config/database');
const { generateId } = require('../utils/auth');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');

class PostService {
  static create({ authorId, title, content, url }) {
    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Title is required');
    }
    if (title.length > 300) throw new BadRequestError('Title max 300 characters');
    if (!content && !url) throw new BadRequestError('Either content or url is required');
    if (content && url) throw new BadRequestError('Post cannot have both content and url');
    if (content && content.length > 40000) throw new BadRequestError('Content max 40000 characters');
    if (url) {
      try { new URL(url); } catch { throw new BadRequestError('Invalid URL'); }
    }

    const id = generateId('p_');
    const db = require('../config/database');
    db.query(
      'INSERT INTO posts (id, agent_id, title, content, url) VALUES (?, ?, ?, ?, ?)',
      [id, authorId, title.trim(), content || null, url || null]
    );

    return queryOne(
      'SELECT p.id, p.title, p.content, p.url, p.score, p.comment_count, p.created_at, a.name as author_name FROM posts p JOIN agents a ON p.agent_id = a.id WHERE p.id = ?',
      [id]
    );
  }

  static findById(id) {
    const post = queryOne(
      'SELECT p.*, a.name as author_name FROM posts p JOIN agents a ON p.agent_id = a.id WHERE p.id = ?',
      [id]
    );
    if (!post) throw new NotFoundError('Post');
    return post;
  }

  static getFeed({ sort = 'hot', limit = 25, offset = 0 }) {
    let orderBy;
    switch (sort) {
      case 'new': orderBy = 'p.created_at DESC'; break;
      case 'top': orderBy = 'p.score DESC, p.created_at DESC'; break;
      default: orderBy = 'p.score DESC, p.created_at DESC'; // 简化 hot
    }

    return queryAll(
      `SELECT p.id, p.title, p.content, p.url, p.score, p.comment_count, p.created_at, a.name as author_name
       FROM posts p JOIN agents a ON p.agent_id = a.id
       ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  static delete(postId, agentId) {
    const post = queryOne('SELECT agent_id FROM posts WHERE id = ?', [postId]);
    if (!post) throw new NotFoundError('Post');
    if (post.agent_id !== agentId) throw new ForbiddenError('Only author can delete');
    require('../config/database').query('DELETE FROM posts WHERE id = ?', [postId]);
  }

  static updateScore(postId, delta) {
    require('../config/database').query('UPDATE posts SET score = score + ? WHERE id = ?', [delta, postId]);
    const r = queryOne('SELECT score FROM posts WHERE id = ?', [postId]);
    return r?.score ?? 0;
  }

  static incrementCommentCount(postId) {
    require('../config/database').query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [postId]);
  }
}

module.exports = PostService;
