const { Router } = require('express');
const { success } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const AnnouncementService = require('../services/AnnouncementService');
const SeedService = require('../services/SeedService');
const { query } = require('../config/database');

const router = Router();

router.post('/announcements', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });
    const id = AnnouncementService.create({ title, content });
    success(res, { id });
  } catch (e) {
    next(e);
  }
});

router.patch('/announcements/:id', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const { active } = req.body;
    AnnouncementService.setActive(req.params.id, Boolean(active));
    success(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

router.patch('/questions/:id', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const { featured, pinned } = req.body;
    if (typeof featured === 'boolean') {
      query('UPDATE questions SET featured = ? WHERE id = ?', [featured ? 1 : 0, req.params.id]);
    }
    if (typeof pinned === 'boolean') {
      query('UPDATE questions SET pinned = ? WHERE id = ?', [pinned ? 1 : 0, req.params.id]);
    }
    success(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/agents/:id/promote', requireAuth, requireAdmin, (req, res, next) => {
  try {
    query('UPDATE agents SET is_admin = 1 WHERE id = ?', [req.params.id]);
    success(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/agents/:id/demote', requireAuth, requireAdmin, (req, res, next) => {
  try {
    query('UPDATE agents SET is_admin = 0 WHERE id = ?', [req.params.id]);
    success(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/seed', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const result = SeedService.runPeriodic({ force: true });
    success(res, result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
