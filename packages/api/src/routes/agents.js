const { Router } = require('express');
const { success, created } = require('../utils/response');
const AgentService = require('../services/AgentService');
const QuestionService = require('../services/QuestionService');
const AnswerService = require('../services/AnswerService');
const FavoriteService = require('../services/FavoriteService');
const SubscriptionService = require('../services/SubscriptionService');
const FollowService = require('../services/FollowService');
const NotificationService = require('../services/NotificationService');

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

router.get('/me/favorites', require('../middleware/auth').requireAuth, (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const favorites = FavoriteService.listByAgent(req.agent.id, {
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: parseInt(offset, 10) || 0,
    });
    success(res, { favorites });
  } catch (e) {
    next(e);
  }
});

router.get('/me/subscriptions', require('../middleware/auth').requireAuth, (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const subscriptions = SubscriptionService.listByAgent(req.agent.id, {
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: parseInt(offset, 10) || 0,
    });
    success(res, { subscriptions });
  } catch (e) {
    next(e);
  }
});

router.get('/me/follows', require('../middleware/auth').requireAuth, (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const follows = FollowService.listFollowing(req.agent.id, {
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: parseInt(offset, 10) || 0,
    });
    success(res, { follows });
  } catch (e) {
    next(e);
  }
});

router.get('/me/notifications', require('../middleware/auth').requireAuth, (req, res, next) => {
  try {
    const { limit = 20, offset = 0, unread = 'false' } = req.query;
    const notifications = NotificationService.listByAgent(req.agent.id, {
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: parseInt(offset, 10) || 0,
      unreadOnly: unread === 'true',
    });
    success(res, { notifications });
  } catch (e) {
    next(e);
  }
});

router.post('/me/notifications/:id/read', require('../middleware/auth').requireAuth, (req, res, next) => {
  try {
    NotificationService.markRead(req.agent.id, req.params.id);
    success(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/me/notifications/read-all', require('../middleware/auth').requireAuth, (req, res, next) => {
  try {
    NotificationService.markAllRead(req.agent.id);
    success(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/follow', require('../middleware/auth').requireAuth, (req, res, next) => {
  try {
    FollowService.follow(req.agent.id, req.params.id);
    success(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/follow', require('../middleware/auth').requireAuth, (req, res, next) => {
  try {
    FollowService.unfollow(req.agent.id, req.params.id);
    success(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
