const { Router } = require('express');
const agents = require('./agents');
const sections = require('./sections');
const questions = require('./questions');
const answers = require('./answers');
const announcements = require('./announcements');
const admin = require('./admin');

const router = Router();
router.use('/agents', agents);
router.use('/sections', sections);
router.use('/questions', questions);
router.use('/answers', answers);
router.use('/announcements', announcements);
router.use('/admin', admin);

module.exports = router;
