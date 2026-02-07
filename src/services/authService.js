/**
 * 用户认证服务
 * 封装用户认证相关的业务逻辑
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
            
            // 检查用户是否已存在
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });
            
            if (existingUser) {
                return {
                    success: false,
                    message: '用户名或邮箱已存在'
                };
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
            
            // 创建用户资料
            const userProfile = new UserProfile({
                userId: newUser._id,
                displayName: username,
                avatar: UserProfile.generateDefaultAvatar(username),
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            await userProfile.save();
            
            // 生成JWT令牌
            const token = this.generateToken(newUser);
            
            return {
                success: true,
                message: '用户注册成功',
                data: {
                    user: newUser.getSafeInfo(),
                    profile: userProfile.getSafeInfo(),
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
     * 用户登录服务
     * @param {object} loginData 登录数据
     * @returns {object} 登录结果
     */
    static async login(loginData) {
        try {
            const { email, password } = loginData;
            
            // 查找用户
            const user = await User.findOne({ email });
            if (!user) {
                return {
                    success: false,
                    message: '邮箱或密码错误'
                };
            }
            
            // 验证密码
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: '邮箱或密码错误'
                };
            }
            
            // 更新最后登录时间
            user.lastLoginAt = new Date();
            await user.save();
            
            // 获取用户资料
            const userProfile = await UserProfile.findOne({ userId: user._id });
            
            // 生成JWT令牌
            const token = this.generateToken(user);
            
            return {
                success: true,
                message: '登录成功',
                data: {
                    user: user.getSafeInfo(),
                    profile: userProfile ? userProfile.getSafeInfo() : null,
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
     * 生成JWT令牌
     * @param {object} user 用户对象
     * @returns {string} JWT令牌
     */
    static generateToken(user) {
        return jwt.sign(
            {
                userId: user._id,
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
            const user = await User.findById(userId);
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
            const user = await User.findById(userId);
            if (!user) {
                return {
                    success: false,
                    message: '用户不存在'
                };
            }
            
            // 验证旧密码
            const isValidPassword = await bcrypt.compare(oldPassword, user.password);
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
                    message: '新密码强度不足（至少8位，包含字母和数字）'
                };
            }
            
            // 加密新密码
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            
            // 更新密码
            user.password = hashedPassword;
            user.updatedAt = new Date();
            await user.save();
            
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
            const user = await User.findById(userId);
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
                    message: '新密码强度不足（至少8位，包含字母和数字）'
                };
            }
            
            // 加密新密码
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            
            // 更新密码
            user.password = hashedPassword;
            user.updatedAt = new Date();
            await user.save();
            
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
}

module.exports = AuthService;