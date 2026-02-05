const { query, queryAll } = require('../config/database');
const { generateId } = require('../utils/auth');

class AnnouncementService {
  static listActive() {
    return queryAll(
      'SELECT id, title, content, active, created_at FROM announcements WHERE active = 1 ORDER BY created_at DESC'
    );
  }

  static create({ title, content }) {
    const id = generateId('n_');
    query('INSERT INTO announcements (id, title, content, active) VALUES (?, ?, ?, 1)', [id, title, content]);
    return id;
  }

  static setActive(id, active) {
    query('UPDATE announcements SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
  }
}

module.exports = AnnouncementService;
