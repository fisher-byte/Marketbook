/**
 * 用户认证服务
 * 封装用户认证相关的业务逻辑
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserStore, UserProfileStore } = require('../models/UserStore');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');

const JWT_SECRET = process.env.JWT_SECRET || 'marketbook-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
    
    /**
     * 用户注册服务
     * @param {object} userData 用户注册数据
     * @returns {object} 注册结果
     */
    static async register(userData) {
        try {
            const { username, email, password } = userData;
            
            // 验证用户数据
            const user = new User({ username, email, password });
            const validation = user.validateAll();
            
            if (!validation.isValid) {
                return {
                    success: false,
                    message: '用户数据验证失败',
                    errors: validation.errors
                };
            }
            
            // 检查邮箱是否已存在
            const existingEmail = await UserStore.findOne({ email });
            if (existingEmail) {
                return {
                    success: false,
                    message: '邮箱已存在'
                };
            }
            
            // 检查用户名是否已存在
            const existingUsername = await UserStore.findOne({ username });
            if (existingUsername) {
                return {
                    success: false,
                    message: '用户名已存在'
                };
            }
            
            // 创建新用户（UserStore.save会自动加密密码）
            const newUser = await UserStore.save({
                username,
                email,
                password,
                createdAt: new Date(),
                lastLoginAt: new Date(),
                isActive: true,
                emailVerified: false
            });
            
            // 创建用户资料
            const userProfile = await UserProfileStore.save({
                userId: newUser.id,
                displayName: username,
                bio: '',
                avatar: this.generateDefaultAvatar(username),
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            // 生成JWT令牌
            const token = this.generateToken(newUser);
            
            return {
                success: true,
                message: '用户注册成功',
                data: {
                    user: newUser.getSafeInfo(),
                    profile: userProfile,
                    token
                }
            };
            
        } catch (error) {
            console.error('注册服务错误:', error);
            return {
                success: false,
                message: '注册服务内部错误',
                error: error.message
            };
        }
    }
    
    /**
     * 用户注册服务（包装方法，与路由对接）
     */
    static async registerUser(userData) {
        return this.register(userData);
    }
    
    /**
     * 用户登录服务
     * @param {object} loginData 登录数据
     * @returns {object} 登录结果
     */
    static async login(loginData) {
        try {
            const { email, password } = loginData;
            
            // 查找用户
            const user = await UserStore.findOne({ email });
            if (!user) {
                return {
                    success: false,
                    message: '邮箱或密码错误'
                };
            }
            
            // 验证密码
            const isValidPassword = await UserStore.comparePassword(password, user.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: '邮箱或密码错误'
                };
            }
            
            // 检查用户是否激活
            if (!user.canLogin()) {
                return {
                    success: false,
                    message: '账户未激活或已被锁定'
                };
            }
            
            // 更新最后登录时间
            user.handleLoginSuccess();
            await UserStore.save(user);
            
            // 获取用户资料
            const userProfile = await UserProfileStore.findByUserId(user.id);
            
            // 生成JWT令牌
            const token = this.generateToken(user);
            
            return {
                success: true,
                message: '登录成功',
                data: {
                    user: user.getSafeInfo(),
                    profile: userProfile || null,
                    token
                }
            };
            
        } catch (error) {
            console.error('登录服务错误:', error);
            return {
                success: false,
                message: '登录服务内部错误',
                error: error.message
            };
        }
    }
    
    /**
     * 用户登录服务（包装方法，与路由对接）
     */
    static async loginUser(loginData) {
        return this.login(loginData);
    }
    
    /**
     * 获取当前用户信息
     * @param {string} userId 用户ID
     * @returns {object} 用户信息
     */
    static async getCurrentUser(userId) {
        try {
            const user = await UserStore.findById(parseInt(userId));
            if (!user) {
                return {
                    success: false,
                    message: '用户不存在'
                };
            }
            
            const userProfile = await UserProfileStore.findByUserId(user.id);
            
            return {
                success: true,
                data: {
                    user: user.getSafeInfo(),
                    profile: userProfile || null
                }
            };
        } catch (error) {
            console.error('获取用户信息错误:', error);
            return {
                success: false,
                message: '获取用户信息失败',
                error: error.message
            };
        }
    }
    
    /**
     * 生成JWT令牌
     * @param {object} user 用户对象
     * @returns {string} JWT令牌
     */
    static generateToken(user) {
        return jwt.sign(
            {
                userId: user.id,
                username: user.username,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    }
    
    /**
     * 验证JWT令牌
     * @param {string} token JWT令牌
     * @returns {object} 验证结果
     */
    static verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return {
                success: true,
                data: decoded
            };
        } catch (error) {
            return {
                success: false,
                message: '令牌无效或已过期',
                error: error.message
            };
        }
    }
    
    /**
     * 撤销令牌（登出）
     * @param {string} token JWT令牌
     * @returns {object} 撤销结果
     */
    static async revokeToken(token) {
        // 在内存存储模式下，令牌撤销只需要前端删除token即可
        // 如果需要服务端管理，可以维护一个黑名单
        return {
            success: true,
            message: '登出成功'
        };
    }
    
    /**
     * 刷新令牌
     * @param {string} token 旧令牌
     * @returns {object} 刷新结果
     */
    static async refreshToken(token) {
        try {
            const verification = this.verifyToken(token);
            
            if (!verification.success) {
                return verification;
            }
            
            const { userId } = verification.data;
            
            // 查找用户
            const user = await UserStore.findById(parseInt(userId));
            if (!user) {
                return {
                    success: false,
                    message: '用户不存在'
                };
            }
            
            // 生成新令牌
            const newToken = this.generateToken(user);
            
            return {
                success: true,
                message: '令牌刷新成功',
                data: {
                    token: newToken
                }
            };
            
        } catch (error) {
            console.error('令牌刷新错误:', error);
            return {
                success: false,
                message: '令牌刷新失败',
                error: error.message
            };
        }
    }
    
    /**
     * 修改密码
     * @param {string} userId 用户ID
     * @param {string} oldPassword 旧密码
     * @param {string} newPassword 新密码
     * @returns {object} 修改结果
     */
    static async changePassword(userId, oldPassword, newPassword) {
        try {
            // 查找用户
            const user = await UserStore.findById(parseInt(userId));
            if (!user) {
                return {
                    success: false,
                    message: '用户不存在'
                };
            }
            
            // 验证旧密码
            const isValidPassword = await UserStore.comparePassword(oldPassword, user.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: '旧密码错误'
                };
            }
            
            // 验证新密码
            const tempUser = new User({ password: newPassword });
            if (!tempUser.validatePassword()) {
                return {
                    success: false,
                    message: '新密码强度不足（至少8位，包含大小写字母、数字和特殊字符）'
                };
            }
            
            // 更新密码
            user.password = newPassword;
            user.updatedAt = new Date();
            await UserStore.save(user);
            
            return {
                success: true,
                message: '密码修改成功'
            };
            
        } catch (error) {
            console.error('修改密码错误:', error);
            return {
                success: false,
                message: '密码修改失败',
                error: error.message
            };
        }
    }
    
    /**
     * 重置密码（管理员功能）
     * @param {string} userId 用户ID
     * @param {string} newPassword 新密码
     * @returns {object} 重置结果
     */
    static async resetPassword(userId, newPassword) {
        try {
            // 查找用户
            const user = await UserStore.findById(parseInt(userId));
            if (!user) {
                return {
                    success: false,
                    message: '用户不存在'
                };
            }
            
            // 验证新密码
            const tempUser = new User({ password: newPassword });
            if (!tempUser.validatePassword()) {
                return {
                    success: false,
                    message: '新密码强度不足（至少8位，包含大小写字母、数字和特殊字符）'
                };
            }
            
            // 更新密码
            user.password = newPassword;
            user.updatedAt = new Date();
            await UserStore.save(user);
            
            return {
                success: true,
                message: '密码重置成功'
            };
            
        } catch (error) {
            console.error('重置密码错误:', error);
            return {
                success: false,
                message: '密码重置失败',
                error: error.message
            };
        }
    }
    
    /**
     * 生成默认头像
     * @param {string} username 用户名
     * @returns {string} 头像URL或数据
     */
    static generateDefaultAvatar(username) {
        // 简单的默认头像生成，可以返回URL或base64
        const initial = username.charAt(0).toUpperCase();
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        const colorIndex = username.charCodeAt(0) % colors.length;
        
        return `https://ui-avatars.com/api/?name=${initial}&background=${colors[colorIndex].substring(1)}&color=fff&size=200`;
    }
}

module.exports = AuthService;
