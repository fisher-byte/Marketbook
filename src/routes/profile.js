/**
 * 用户资料路由模块
 * 负责处理用户资料相关的HTTP请求
 */

const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const validation = require('../middleware/validation');

/**
 * 获取用户资料
 * GET /api/profile
 */
router.get('/', profileController.getProfile);

/**
 * 更新用户资料
 * PUT /api/profile
 */
router.put('/', 
    validation.validateProfileUpdate,
    profileController.updateProfile
);

/**
 * 上传用户头像
 * POST /api/profile/avatar
 */
router.post('/avatar', profileController.uploadAvatar);

/**
 * 获取用户统计信息
 * GET /api/profile/stats
 */
router.get('/stats', profileController.getUserStats);

module.exports = router;