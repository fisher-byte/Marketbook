/**
 * 邮箱验证路由
 * 处理邮箱验证相关的API请求
 */

const express = require('express');
const router = express.Router();
const emailVerificationController = require('../controllers/emailVerificationController');
const auth = require('../middleware/auth');

/**
 * @route POST /api/email/send-verification
 * @description 发送邮箱验证邮件
 * @access Private (需要登录)
 */
router.post('/send-verification', auth, emailVerificationController.sendVerificationEmail);

/**
 * @route GET /api/email/verify/:token
 * @description 验证邮箱地址
 * @access Public
 */
router.get('/verify/:token', emailVerificationController.verifyEmail);

/**
 * @route POST /api/email/resend-verification
 * @description 重新发送验证邮件
 * @access Private (需要登录)
 */
router.post('/resend-verification', auth, emailVerificationController.resendVerificationEmail);

/**
 * @route GET /api/email/status
 * @description 获取邮箱验证状态
 * @access Private (需要登录)
 */
router.get('/status', auth, emailVerificationController.getVerificationStatus);

module.exports = router;