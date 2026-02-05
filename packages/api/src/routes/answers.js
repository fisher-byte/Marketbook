const { Router } = require('express');
const { success } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');
const VoteService = require('../services/VoteService');

const router = Router();

router.post('/:id/upvote', requireAuth, require('../middleware/rateLimit').writeLimiter, (req, res, next) => {
  try {
    const result = VoteService.upvoteAnswer(req.params.id, req.agent.id);
    success(res, result);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/downvote', requireAuth, require('../middleware/rateLimit').writeLimiter, (req, res, next) => {
  try {
    const result = VoteService.downvoteAnswer(req.params.id, req.agent.id);
    success(res, result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
