/**
 * 用户服务
 * 封装用户相关的业务逻辑
 */

const User = require('../models/User');
const UserProfile = require('../models/UserProfile');

class UserService {
    
    /**
     * 创建新用户
     * @param {object} userData 用户数据
     * @returns {object} 创建结果
     */
    async createUser(userData) {
        try {
            const user = new User(userData);
            const validation = user.validateAll();
            
            if (!validation.isValid) {
                return {
                    success: false,
                    message: '用户数据验证失败',
                    errors: validation.errors
                };
            }
            
            // 检查用户名和邮箱是否已存在
            const existingUser = await User.findOne({
                $or: [
                    { username: userData.username },
                    { email: userData.email }
                ]
            });
            
            if (existingUser) {
                return {
                    success: false,
                    message: existingUser.email === userData.email ? 
                        '邮箱已被注册' : '用户名已被使用'
                };
            }
            
            await user.save();
            
            // 创建用户资料
            const userProfile = new UserProfile({
                userId: user._id,
                displayName: user.username,
                avatar: UserProfile.generateDefaultAvatar(user.username)
            });
            
            await userProfile.save();
            
            return {
                success: true,
                message: '用户创建成功',
                user: user.getSafeInfo()
            };
            
        } catch (error) {
            console.error('创建用户错误:', error);
            return {
                success: false,
                message: '创建用户失败',
                error: error.message
            };
        }
    }
    
    /**
     * 获取用户信息
     * @param {string} userId 用户ID
     * @returns {object} 用户信息
     */
    async getUserInfo(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                return {
                    success: false,
                    message: '用户不存在'
                };
            }
            
            const profile = await UserProfile.findOne({ userId });
            
            return {
                success: true,
                user: user.getSafeInfo(),
                profile: profile ? profile.getSafeInfo() : null
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
     * 更新用户资料
     * @param {string} userId 用户ID
     * @param {object} profileData 资料数据
     * @returns {object} 更新结果
     */
    async updateUserProfile(userId, profileData) {
        try {
            let profile = await UserProfile.findOne({ userId });
            
            if (!profile) {
                // 如果资料不存在，创建新资料
                profile = new UserProfile({
                    userId,
                    ...profileData
                });
            } else {
                // 更新现有资料
                Object.assign(profile, profileData);
                profile.updatedAt = new Date();
            }
            
            const validation = profile.validateAll();
            if (!validation.isValid) {
                return {
                    success: false,
                    message: '资料数据验证失败',
                    errors: validation.errors
                };
            }
            
            await profile.save();
            
            return {
                success: true,
                message: '用户资料更新成功',
                profile: profile.getSafeInfo()
            };
            
        } catch (error) {
            console.error('更新用户资料错误:', error);
            return {
                success: false,
                message: '更新用户资料失败',
                error: error.message
            };
        }
    }
    
    /**
     * 搜索用户
     * @param {string} keyword 搜索关键词
     * @param {number} limit 限制数量
     * @returns {object} 搜索结果
     */
    async searchUsers(keyword, limit = 10) {
        try {
            const users = await User.find({
                $or: [
                    { username: { $regex: keyword, $options: 'i' } },
                    { email: { $regex: keyword, $options: 'i' } }
                ],
                isActive: true
            }).limit(limit);
            
            return {
                success: true,
                users: users.map(user => user.getSafeInfo()),
                total: users.length
            };
            
        } catch (error) {
            console.error('搜索用户错误:', error);
            return {
                success: false,
                message: '搜索用户失败',
                error: error.message
            };
        }
    }
    
    /**
     * 删除用户（软删除）
     * @param {string} userId 用户ID
     * @returns {object} 删除结果
     */
    async deleteUser(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                return {
                    success: false,
                    message: '用户不存在'
                };
            }
            
            user.isActive = false;
            user.updatedAt = new Date();
            await user.save();
            
            return {
                success: true,
                message: '用户删除成功'
            };
            
        } catch (error) {
            console.error('删除用户错误:', error);
            return {
                success: false,
                message: '删除用户失败',
                error: error.message
            };
        }
    }
}

module.exports = new UserService();