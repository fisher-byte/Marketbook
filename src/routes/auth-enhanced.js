const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, UserProfile } = require('../models');
const { validateRegistration, validateLogin } = require('../middleware/validation');

const router = express.Router();

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'marketbook-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 用户注册API
 */
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        // 检查用户是否已存在
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: '用户名或邮箱已存在'
            });
        }

        // 密码加密
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 创建用户
        const user = new User({
            username,
            email,
            password: hashedPassword,
            status: 'active',
            emailVerified: false
        });

        await user.save();

        // 创建用户资料
        const userProfile = new UserProfile({
            userId: user._id,
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`,
            tradingExperience: 'beginner',
            riskTolerance: 'medium'
        });

        await userProfile.save();

        // 生成JWT令牌
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                },
                token,
                expiresIn: JWT_EXPIRES_IN
            }
        });

    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试'
        });
    }
});

/**
 * 用户登录API
 */
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;

        // 查找用户
        const user = await User.findOne({ email, status: 'active' });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 生成JWT令牌
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // 更新最后登录时间
        user.lastLoginAt = new Date();
        await user.save();

        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                },
                token,
                expiresIn: JWT_EXPIRES_IN
            }
        });

    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试'
        });
    }
});

/**
 * 获取当前用户信息
 */
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const userProfile = await UserProfile.findOne({ userId: user._id });

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    lastLoginAt: user.lastLoginAt
                },
                profile: userProfile
            }
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '无效的认证令牌'
            });
        }
        
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试'
        });
    }
});

/**
 * 更新用户资料
 */
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const { firstName, lastName, tradingExperience, riskTolerance, bio } = req.body;

        const updatedProfile = await UserProfile.findOneAndUpdate(
            { userId: decoded.userId },
            {
                firstName,
                lastName,
                displayName: `${firstName} ${lastName}`,
                tradingExperience,
                riskTolerance,
                bio,
                updatedAt: new Date()
            },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: '资料更新成功',
            data: { profile: updatedProfile }
        });

    } catch (error) {
        console.error('更新资料错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试'
        });
    }
});

/**
 * 刷新令牌
 */
router.post('/refresh', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 生成新令牌
        const newToken = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            data: {
                token: newToken,
                expiresIn: JWT_EXPIRES_IN
            }
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: '令牌刷新失败'
        });
    }
});

module.exports = router;