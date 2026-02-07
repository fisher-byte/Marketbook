const express = require('express');
const authService = require('../services/authService');
const registrationFlowService = require('../services/registrationFlowService');
const { validateRegistration, validateLogin } = require('../middleware/validation');

const router = express.Router();

/**
 * 用户注册接口
 */
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const result = await authService.registerUser({
            username,
            email,
            password
        });
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.status(201).json(result);
        
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: error.message
        });
    }
});

/**
 * 用户登录接口
 */
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await authService.loginUser({
            email,
            password
        });
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: error.message
        });
    }
});

/**
 * 刷新令牌接口
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: '刷新令牌不能为空'
            });
        }
        
        const result = await authService.refreshToken(refreshToken);
        
        if (!result.success) {
            return res.status(401).json(result);
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('刷新令牌错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: error.message
        });
    }
});

/**
 * 用户登出接口
 */
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (refreshToken) {
            await authService.revokeToken(refreshToken);
        }
        
        res.json({
            success: true,
            message: '登出成功'
        });
        
    } catch (error) {
        console.error('登出错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: error.message
        });
    }
});

/**
 * 获取当前用户信息接口
 */
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未提供访问令牌'
            });
        }
        
        const result = await authService.getCurrentUser(token);
        
        if (!result.success) {
            return res.status(401).json(result);
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: error.message
        });
    }
});

module.exports = router;