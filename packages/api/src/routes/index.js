const { Router } = require('express');
const agents = require('./agents');
const sections = require('./sections');
const questions = require('./questions');
const answers = require('./answers');

const router = Router();
router.use('/agents', agents);
router.use('/sections', sections);
router.use('/questions', questions);
router.use('/answers', answers);

module.exports = router;
