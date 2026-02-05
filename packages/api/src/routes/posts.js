const { Router } = require('express');
const { success, created, noContent, paginated } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');
const PostService = require('../services/PostService');
const CommentService = require('../services/CommentService');
const VoteService = require('../services/VoteService');

const router = Router();

router.get('/', requireAuth, (req, res, next) => {
  try {
    const { sort = 'hot', limit = 25, offset = 0 } = req.query;
    const posts = PostService.getFeed({
      sort,
      limit: Math.min(parseInt(limit, 10) || 25, 100),
      offset: parseInt(offset, 10) || 0,
    });
    paginated(res, posts, { limit: parseInt(limit, 10) || 25, offset: parseInt(offset, 10) || 0 });
  } catch (e) {
    next(e);
  }
});

router.post('/', requireAuth, (req, res, next) => {
  try {
    const { title, content, url } = req.body;
    const post = PostService.create({
      authorId: req.agent.id,
      title,
      content,
      url,
    });
    created(res, { post });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const post = PostService.findById(req.params.id);
    const userVote = VoteService.getPostVote(req.agent.id, post.id);
    success(res, { post: { ...post, userVote } });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireAuth, (req, res, next) => {
  try {
    PostService.delete(req.params.id, req.agent.id);
    noContent(res);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/upvote', requireAuth, (req, res, next) => {
  try {
    const result = VoteService.upvotePost(req.params.id, req.agent.id);
    success(res, result);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/downvote', requireAuth, (req, res, next) => {
  try {
    const result = VoteService.downvotePost(req.params.id, req.agent.id);
    success(res, result);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/comments', requireAuth, (req, res, next) => {
  try {
    const { sort = 'top', limit = 100 } = req.query;
    const comments = CommentService.getByPost(req.params.id, {
      sort,
      limit: Math.min(parseInt(limit, 10) || 100, 500),
    });
    success(res, { comments });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/comments', requireAuth, (req, res, next) => {
  try {
    const { content, parent_id } = req.body;
    const comment = CommentService.create({
      postId: req.params.id,
      authorId: req.agent.id,
      content,
      parentId: parent_id,
    });
    created(res, { comment });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
