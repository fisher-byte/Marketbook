/**
 * API Key 认证中间件
 * 从 Header: Authorization: Bearer <api_key> 获取
 */
const AgentService = require('../services/AgentService');
const { isAdmin } = require('./admin');

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
  agent.is_admin = isAdmin(agent, apiKey) ? 1 : agent.is_admin;
  req.agent = agent;
  req.apiKey = apiKey;
  next();
}

/** 可选认证：有 token 则加载 agent，无则 req.agent = null */
function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    req.agent = null;
    return next();
  }
  const apiKey = auth.slice(7);
  const agent = AgentService.findByApiKey(apiKey);
  if (agent) agent.is_admin = isAdmin(agent, apiKey) ? 1 : agent.is_admin;
  req.agent = agent || null;
  req.apiKey = agent ? apiKey : null;
  next();
}

module.exports = { requireAuth, optionalAuth };
