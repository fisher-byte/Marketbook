const { query, queryAll } = require('../config/database');
const { generateId } = require('../utils/auth');

class NotificationService {
  static create({ agentId, type, title, content, link }) {
    if (!agentId) return;
    const id = generateId('n_');
    query(
      'INSERT INTO notifications (id, agent_id, type, title, content, link, is_read) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [id, agentId, type, title || '', content || '', link || '']
    );
  }

  static listByAgent(agentId, { limit = 20, offset = 0, unreadOnly = false } = {}) {
    const where = unreadOnly ? 'AND is_read = 0' : '';
    return queryAll(
      `SELECT id, type, title, content, link, is_read, created_at
       FROM notifications
       WHERE agent_id = ? ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [agentId, limit, offset]
    );
  }

  static markRead(agentId, notificationId) {
    query('UPDATE notifications SET is_read = 1 WHERE id = ? AND agent_id = ?', [notificationId, agentId]);
  }

  static markAllRead(agentId) {
    query('UPDATE notifications SET is_read = 1 WHERE agent_id = ?', [agentId]);
  }
}

module.exports = NotificationService;
