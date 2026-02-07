/**
 * 用户服务层 - 增强版
 * 提供用户认证、资料管理、权限控制等核心业务逻辑
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserEnhanced');
const EmailService = require('./emailService');

class UserService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'marketbook-secret-key';
        this.tokenExpiry = '7d';
    }

    /**
     * 用户注册
     */
    async register(userData) {
        try {
            // 验证邮箱是否已存在
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                throw new Error('邮箱已被注册');
            }

            // 验证用户名是否已存在
            const existingUsername = await User.findOne({ username: userData.username });
            if (existingUsername) {
                throw new Error('用户名已被使用');
            }

            // 密码加密
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

            // 创建用户
            const user = new User({
                username: userData.username,
                email: userData.email,
                password: hashedPassword,
                profile: {
                    displayName: userData.displayName || userData.username,
                    avatar: userData.avatar || '/images/default-avatar.png'
                },
                preferences: {
                    theme: 'auto',
                    language: 'zh-CN',
                    notifications: {
                        email: true,
                        push: true
                    }
                }
            });

            await user.save();

            // 发送欢迎邮件
            await EmailService.sendWelcomeEmail(user.email, user.username);

            return {
                success: true,
                message: '注册成功',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    displayName: user.profile.displayName
                }
            };
        } catch (error) {
            throw new Error(`注册失败: ${error.message}`);
        }
    }

    /**
     * 用户登录
     */
    async login(credentials) {
        try {
            const { email, password } = credentials;

            // 查找用户
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                throw new Error('用户不存在');
            }

            // 验证密码
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                throw new Error('密码错误');
            }

            // 检查账户状态
            if (user.status !== 'active') {
                throw new Error('账户已被禁用，请联系管理员');
            }

            // 生成JWT令牌
            const token = jwt.sign(
                {
                    userId: user._id,
                    username: user.username,
                    email: user.email
                },
                this.jwtSecret,
                { expiresIn: this.tokenExpiry }
            );

            // 更新最后登录时间
            user.lastLoginAt = new Date();
            await user.save();

            return {
                success: true,
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    displayName: user.profile.displayName,
                    avatar: user.profile.avatar,
                    role: user.role,
                    preferences: user.preferences
                }
            };
        } catch (error) {
            throw new Error(`登录失败: ${error.message}`);
        }
    }

    /**
     * 验证JWT令牌
     */
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            const user = await User.findById(decoded.userId);
            
            if (!user || user.status !== 'active') {
                throw new Error('令牌无效或用户不存在');
            }

            return {
                valid: true,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * 获取用户资料
     */
    async getProfile(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('用户不存在');
            }

            return {
                success: true,
                profile: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    displayName: user.profile.displayName,
                    avatar: user.profile.avatar,
                    bio: user.profile.bio,
                    location: user.profile.location,
                    website: user.profile.website,
                    joinDate: user.createdAt,
                    lastLogin: user.lastLoginAt
                }
            };
        } catch (error) {
            throw new Error(`获取用户资料失败: ${error.message}`);
        }
    }

    /**
     * 更新用户资料
     */
    async updateProfile(userId, profileData) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('用户不存在');
            }

            // 更新资料字段
            if (profileData.displayName) {
                user.profile.displayName = profileData.displayName;
            }
            if (profileData.bio !== undefined) {
                user.profile.bio = profileData.bio;
            }
            if (profileData.location) {
                user.profile.location = profileData.location;
            }
            if (profileData.website) {
                user.profile.website = profileData.website;
            }
            if (profileData.avatar) {
                user.profile.avatar = profileData.avatar;
            }

            await user.save();

            return {
                success: true,
                message: '资料更新成功',
                profile: user.profile
            };
        } catch (error) {
            throw new Error(`更新资料失败: ${error.message}`);
        }
    }

    /**
     * 更新用户偏好设置
     */
    async updatePreferences(userId, preferences) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('用户不存在');
            }

            // 合并更新偏好设置
            user.preferences = { ...user.preferences, ...preferences };
            await user.save();

            return {
                success: true,
                message: '偏好设置更新成功',
                preferences: user.preferences
            };
        } catch (error) {
            throw new Error(`更新偏好设置失败: ${error.message}`);
        }
    }

    /**
     * 修改密码
     */
    async changePassword(userId, passwordData) {
        try {
            const { currentPassword, newPassword } = passwordData;

            const user = await User.findById(userId).select('+password');
            if (!user) {
                throw new Error('用户不存在');
            }

            // 验证当前密码
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                throw new Error('当前密码错误');
            }

            // 加密新密码
            const saltRounds = 12;
            user.password = await bcrypt.hash(newPassword, saltRounds);
            await user.save();

            return {
                success: true,
                message: '密码修改成功'
            };
        } catch (error) {
            throw new Error(`修改密码失败: ${error.message}`);
        }
    }

    /**
     * 搜索用户
     */
    async searchUsers(query, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            
            const users = await User.find({
                $or: [
                    { username: { $regex: query, $options: 'i' } },
                    { 'profile.displayName': { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } }
                ],
                status: 'active'
            })
            .select('username profile.email profile.avatar profile.bio createdAt')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

            const total = await User.countDocuments({
                $or: [
                    { username: { $regex: query, $options: 'i' } },
                    { 'profile.displayName': { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } }
                ],
                status: 'active'
            });

            return {
                success: true,
                users: users.map(user => ({
                    id: user._id,
                    username: user.username,
                    displayName: user.profile.displayName,
                    avatar: user.profile.avatar,
                    bio: user.profile.bio,
                    joinDate: user.createdAt
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw new Error(`搜索用户失败: ${error.message}`);
        }
    }

    /**
     * 获取用户统计信息
     */
    async getUserStats(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('用户不存在');
            }

            // 这里可以集成其他服务的统计数据
            // 例如：交易记录数、帖子数、关注数等

            return {
                success: true,
                stats: {
                    joinDays: Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24)),
                    lastActive: user.lastLoginAt,
                    // 占位统计，实际需要集成其他服务
                    tradingRecords: 0,
                    forumPosts: 0,
                    followers: 0,
                    following: 0
                }
            };
        } catch (error) {
            throw new Error(`获取用户统计失败: ${error.message}`);
        }
    }
}

module.exports = new UserService();