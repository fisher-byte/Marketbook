/**
 * MarketBook 用户认证中间件 - 增强版
 * 提供JWT认证、权限验证和用户会话管理
 */

const jwt = require('jsonwebtoken');
const UserEnhanced = require('../models/UserEnhanced');

// JWT密钥配置
const JWT_SECRET = process.env.JWT_SECRET || 'marketbook-secret-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成JWT令牌
 */
const generateToken = (userId, email, role = 'user') => {
    return jwt.sign(
        { 
            userId, 
            email, 
            role,
            iat: Math.floor(Date.now() / 1000)
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * 验证JWT令牌
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Token验证失败');
    }
};

/**
 * 认证中间件 - 验证用户登录状态
 */
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.cookies?.token || 
                     req.query.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '访问被拒绝，请先登录',
                code: 'AUTH_REQUIRED'
            });
        }

        const decoded = verifyToken(token);
        const user = await UserEnhanced.findById(decoded.userId);
        
        if (!user || user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: '用户不存在或已被禁用',
                code: 'USER_INVALID'
            });
        }

        // 将用户信息添加到请求对象
        req.user = {
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            profile: user.profile
        };
        req.token = token;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: '令牌无效或已过期',
            code: 'TOKEN_INVALID'
        });
    }
};

/**
 * 权限验证中间件
 */
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '用户未认证',
                code: 'UNAUTHORIZED'
            });
        }

        if (roles.length > 0 && !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '权限不足，无法访问此资源',
                code: 'FORBIDDEN'
            });
        }

        next();
    };
};

/**
 * 可选认证中间件（不强制要求登录）
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.cookies?.token || 
                     req.query.token;

        if (token) {
            const decoded = verifyToken(token);
            const user = await UserEnhanced.findById(decoded.userId);
            
            if (user && user.status === 'active') {
                req.user = {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    profile: user.profile
                };
                req.token = token;
            }
        }

        next();
    } catch (error) {
        // 认证失败但不阻止请求继续
        next();
    }
};

/**
 * 刷新令牌中间件
 */
const refreshToken = async (req, res, next) => {
    try {
        if (req.user && req.token) {
            const newToken = generateToken(req.user.id, req.user.email, req.user.role);
            
            // 设置新的令牌到响应头
            res.set('X-New-Token', newToken);
            
            // 可选：设置到cookie
            res.cookie('token', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
            });
        }
        
        next();
    } catch (error) {
        console.error('刷新令牌失败:', error);
        next();
    }
};

/**
 * 速率限制中间件（防止暴力破解）
 */
const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 5) => {
    const attempts = new Map();
    
    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        if (!attempts.has(key)) {
            attempts.set(key, []);
        }
        
        const userAttempts = attempts.get(key);
        
        // 清理过期记录
        const validAttempts = userAttempts.filter(time => now - time < windowMs);
        attempts.set(key, validAttempts);
        
        if (validAttempts.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: '请求过于频繁，请稍后再试',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
        
        userAttempts.push(now);
        next();
    };
};

module.exports = {
    generateToken,
    verifyToken,
    authenticate,
    authorize,
    optionalAuth,
    refreshToken,
    rateLimit
};