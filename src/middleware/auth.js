/**
 * 认证中间件
 * 负责JWT令牌验证和权限检查
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserRole = require('../models/UserRole');

const JWT_SECRET = process.env.JWT_SECRET || 'marketbook-secret-key';

/**
 * 验证JWT令牌
 */
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '访问令牌缺失'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: '令牌无效或已过期'
        });
    }
};

/**
 * 检查用户权限
 * @param {string} requiredPermission 需要的权限
 */
const requirePermission = (requiredPermission) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '用户未认证'
            });
        }

        try {
            // 获取用户角色和权限
            const userRoles = await UserRole.getUserRoles(req.user.id);
            const hasPermission = userRoles.some(role => 
                role.permissions.includes(requiredPermission)
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足'
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '权限检查失败',
                error: error.message
            });
        }
    };
};

/**
 * 检查用户角色
 * @param {string} requiredRole 需要的角色
 */
const requireRole = (requiredRole) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '用户未认证'
            });
        }

        try {
            const userRoles = await UserRole.getUserRoles(req.user.id);
            const hasRole = userRoles.some(role => 
                role.name === requiredRole
            );

            if (!hasRole) {
                return res.status(403).json({
                    success: false,
                    message: '角色权限不足'
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '角色检查失败',
                error: error.message
            });
        }
    };
};

module.exports = {
    authenticateToken,
    requirePermission,
    requireRole
};