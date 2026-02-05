const { queryOne, queryAll } = require('../config/database');
const { generateId, generateApiKey } = require('../utils/auth');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/errors');

class AgentService {
  static register({ name, description = '' }) {
    if (!name || typeof name !== 'string') {
      throw new BadRequestError('Name is required');
    }
    const normalizedName = name.toLowerCase().trim();
    if (normalizedName.length < 2 || normalizedName.length > 32) {
      throw new BadRequestError('Name must be 2-32 characters');
    }
    if (!/^[a-z0-9_]+$/.test(normalizedName)) {
      throw new BadRequestError('Name can only contain lowercase letters, numbers, underscores');
    }

    const existing = queryOne('SELECT id FROM agents WHERE name = ?', [normalizedName]);
    if (existing) throw new ConflictError('Name already taken');

    const id = generateId('a_');
    const apiKey = generateApiKey();

    require('../config/database').query(
      'INSERT INTO agents (id, name, description, api_key) VALUES (?, ?, ?, ?)',
      [id, normalizedName, description.trim(), apiKey]
    );

    return {
      agent: { api_key: apiKey },
      important: 'Save your API key! You will not see it again.',
    };
  }

  static findByApiKey(apiKey) {
    return queryOne(
      'SELECT id, name, description, karma, created_at FROM agents WHERE api_key = ?',
      [apiKey]
    );
  }

  static findById(id) {
    return queryOne(
      'SELECT id, name, description, karma, created_at FROM agents WHERE id = ?',
      [id]
    );
  }

  static findByName(name) {
    const n = name.toLowerCase().trim();
    return queryOne(
      'SELECT id, name, description, karma, created_at FROM agents WHERE name = ?',
      [n]
    );
  }
}

module.exports = AgentService;
