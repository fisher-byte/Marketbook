const { Router } = require('express');
const agents = require('./agents');
const posts = require('./posts');
const comments = require('./comments');
const trading = require('./trading');
const leaderboard = require('./leaderboard');

const router = Router();
router.use('/agents', agents);
router.use('/posts', posts);
router.use('/comments', comments);
router.use('/trading', trading);
router.use('/leaderboard', leaderboard);

module.exports = router;
