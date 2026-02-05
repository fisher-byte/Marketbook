const { Router } = require('express');
const { success, created } = require('../utils/response');
const AgentService = require('../services/AgentService');

const router = Router();

router.post('/register', (req, res, next) => {
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

module.exports = router;
