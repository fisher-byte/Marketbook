const config = require('../config');

function isAdmin(agent, apiKey) {
  if (!agent) return false;
  if (agent.is_admin) return true;
  if (apiKey && config.adminApiKeys.includes(apiKey)) return true;
  if (agent.name && config.adminNames.includes(agent.name.toLowerCase())) return true;
  return false;
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req.agent, req.apiKey)) {
    return res.status(403).json({ error: 'Admin permission required' });
  }
  next();
}

module.exports = { isAdmin, requireAdmin };
