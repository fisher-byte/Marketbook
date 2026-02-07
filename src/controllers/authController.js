const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegistration } = require('../middleware/validation');

const router = express.Router();

// 用户注册接口
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
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
        
        // 加密密码
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // 创建新用户
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            createdAt: new Date(),
            lastLoginAt: new Date()
        });
        
        await newUser.save();
        
        // 生成JWT令牌
        const token = jwt.sign(
            { userId: newUser._id, username: newUser.username },
            process.env.JWT_SECRET || 'marketbook-secret-key',
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            success: true,
            message: '用户注册成功',
            data: {
                user: {
                    id: newUser._id,
                    username: newUser.username,
                    email: newUser.email
                },
                token
            }
        });
        
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 用户登录接口
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 查找用户
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }
        
        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }
        
        // 更新最后登录时间
        user.lastLoginAt = new Date();
        await user.save();
        
        // 生成JWT令牌
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'marketbook-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                },
                token
            }
        });
        
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

module.exports = router;