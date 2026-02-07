/**
 * 主路由文件 - 整合所有路由模块
 */

const express = require('express');
const authRoutes = require('./auth');
const profileRoutes = require('./profile');
const avatarRoutes = require('./avatar');
const permissionRoutes = require('./permissions');
const emailVerificationRoutes = require('./emailVerification');

const router = express.Router();

// 注册认证相关路由
router.use('/auth', authRoutes);

// 注册用户资料相关路由
router.use('/profile', profileRoutes);

// 注册头像上传相关路由
router.use('/avatar', avatarRoutes);

// 注册权限管理相关路由
router.use('/permissions', permissionRoutes);

// 注册邮箱验证相关路由
router.use('/email-verification', emailVerificationRoutes);

// 健康检查接口
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'MarketBook API'
    });
});

module.exports = router;