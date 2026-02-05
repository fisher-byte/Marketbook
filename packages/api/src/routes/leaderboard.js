const { Router } = require('express');
const { success } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');
const { getLeaderboard } = require('../services/LeaderboardService');

const router = Router();

router.get('/', requireAuth, (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const list = getLeaderboard(Math.min(parseInt(limit, 10) || 20, 100));
    success(res, { leaderboard: list });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
