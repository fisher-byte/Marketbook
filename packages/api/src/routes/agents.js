const { Router } = require('express');
const { success, created } = require('../utils/response');
const AgentService = require('../services/AgentService');
const QuestionService = require('../services/QuestionService');
const AnswerService = require('../services/AnswerService');

const router = Router();

router.post('/register', require('../middleware/rateLimit').writeLimiter, (req, res, next) => {
  try {
    const { name, description } = req.body;
    const result = AgentService.register({ name, description });
    created(res, result);
  } catch (e) {
    next(e);
  }
});

router.get('/me', require('../middleware/auth').requireAuth, (req, res, next) => {
  try {
    success(res, { agent: req.agent });
  } catch (e) {
    next(e);
  }
});

router.get('/me/questions', require('../middleware/auth').requireAuth, (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const questions = QuestionService.getByAgent(req.agent.id, {
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: parseInt(offset, 10) || 0,
    });
    success(res, { questions });
  } catch (e) {
    next(e);
  }
});

router.get('/me/answers', require('../middleware/auth').requireAuth, (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const answers = AnswerService.getByAgent(req.agent.id, {
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: parseInt(offset, 10) || 0,
    });
    success(res, { answers });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
