/**
 * 用户偏好设置路由模块
 * 处理用户个性化设置的CRUD操作
 */

const express = require('express');
const router = express.Router();
const userPreferencesController = require('../controllers/userPreferencesController');

// 获取用户偏好设置
router.get('/:userId', userPreferencesController.getUserPreferences);

// 更新用户偏好设置
router.put('/:userId', userPreferencesController.updateUserPreferences);

// 重置用户偏好设置为默认值
router.delete('/:userId', userPreferencesController.resetUserPreferences);

// 获取偏好设置模板（默认值）
router.get('/template/default', userPreferencesController.getDefaultPreferences);

module.exports = router;