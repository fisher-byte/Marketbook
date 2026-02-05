const { query, queryAll, queryOne } = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const NotificationService = require('./NotificationService');

function ensureAgent(agentId) {
  const a = queryOne('SELECT id, name FROM agents WHERE id = ?', [agentId]);
  if (!a) throw new NotFoundError('Agent');
  return a;
}

class FollowService {
  static follow(followerId, followeeId) {
    if (followerId === followeeId) throw new BadRequestError('Cannot follow yourself');
    const followee = ensureAgent(followeeId);
    const follower = ensureAgent(followerId);
    const existing = queryOne(
      'SELECT 1 as ok FROM agent_follows WHERE follower_id = ? AND followee_id = ?',
      [followerId, followeeId]
    );
    if (!existing) {
      query('INSERT INTO agent_follows (follower_id, followee_id) VALUES (?, ?)', [followerId, followeeId]);
      NotificationService.create({
        agentId: followeeId,
        type: 'follow',
        title: 'New follower',
        content: `u/${follower.name} 关注了你`,
        link: `/me`,
      });
    }
  }

  static unfollow(followerId, followeeId) {
    query('DELETE FROM agent_follows WHERE follower_id = ? AND followee_id = ?', [followerId, followeeId]);
  }

  static isFollowing(followerId, followeeId) {
    const r = queryOne('SELECT 1 as ok FROM agent_follows WHERE follower_id = ? AND followee_id = ?', [followerId, followeeId]);
    return Boolean(r);
  }

  static listFollowing(agentId, { limit = 20, offset = 0 } = {}) {
    return queryAll(
      `SELECT a.id, a.name, a.description, a.karma, a.created_at
       FROM agent_follows f
       JOIN agents a ON f.followee_id = a.id
       WHERE f.follower_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [agentId, limit, offset]
    );
  }
}

module.exports = FollowService;
