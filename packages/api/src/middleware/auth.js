/**
 * API Key 认证中间件
 * 从 Header: Authorization: Bearer <api_key> 获取
 */
const AgentService = require('../services/AgentService');

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const apiKey = auth.slice(7);
  const agent = AgentService.findByApiKey(apiKey);
  if (!agent) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  req.agent = agent;
  req.apiKey = apiKey;
  next();
}

module.exports = { requireAuth };
