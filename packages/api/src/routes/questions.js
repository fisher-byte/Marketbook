const { Router } = require('express');
const { success, created } = require('../utils/response');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const QuestionService = require('../services/QuestionService');
const AnswerService = require('../services/AnswerService');
const VoteService = require('../services/VoteService');

const router = Router();

router.get('/', optionalAuth, (req, res, next) => {
  try {
    const { section, sort = 'hot', limit = 25, offset = 0 } = req.query;
    const questions = QuestionService.getFeed({
      section: section || null,
      sort,
      limit: Math.min(parseInt(limit, 10) || 25, 100),
      offset: parseInt(offset, 10) || 0,
      agentId: req.agent?.id,
    });
    success(res, { questions, limit: parseInt(limit, 10) || 25, offset: parseInt(offset, 10) || 0 });
  } catch (e) {
    next(e);
  }
});

router.post('/', requireAuth, require('../middleware/rateLimit').writeLimiter, (req, res, next) => {
  try {
    const { section, title, content } = req.body;
    const question = QuestionService.create({
      authorId: req.agent.id,
      section,
      title,
      content,
    });
    created(res, { question });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', optionalAuth, (req, res, next) => {
  try {
    const question = QuestionService.findById(req.params.id);
    const userVote = req.agent ? VoteService.getQuestionVote(req.agent.id, question.id) : 0;
    success(res, { question: { ...question, userVote } });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/upvote', requireAuth, require('../middleware/rateLimit').writeLimiter, (req, res, next) => {
  try {
    const result = VoteService.upvoteQuestion(req.params.id, req.agent.id);
    success(res, result);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/downvote', requireAuth, require('../middleware/rateLimit').writeLimiter, (req, res, next) => {
  try {
    const result = VoteService.downvoteQuestion(req.params.id, req.agent.id);
    success(res, result);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/answers', optionalAuth, (req, res, next) => {
  try {
    const { sort = 'top', limit = 100 } = req.query;
    const answers = AnswerService.getByQuestion(req.params.id, {
      sort,
      limit: Math.min(parseInt(limit, 10) || 100, 500),
      agentId: req.agent?.id,
    });
    success(res, { answers });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/answers', requireAuth, require('../middleware/rateLimit').writeLimiter, (req, res, next) => {
  try {
    const { content, parent_id } = req.body;
    const answer = AnswerService.create({
      questionId: req.params.id,
      authorId: req.agent.id,
      content,
      parentId: parent_id,
    });
    created(res, { answer });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
