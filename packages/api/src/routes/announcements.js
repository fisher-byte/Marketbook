const { Router } = require('express');
const { success } = require('../utils/response');
const AnnouncementService = require('../services/AnnouncementService');

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const announcements = AnnouncementService.listActive();
    success(res, { announcements });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
