/**
 * 用户偏好设置控制器
 * 负责处理用户偏好设置的CRUD操作
 */

const UserPreferences = require('../models/UserPreferences');

class UserPreferencesController {
    
    /**
     * 获取用户偏好设置
     * @param {string} userId 用户ID
     * @returns {Promise<object>} 用户偏好设置对象
     */
    async getUserPreferences(userId) {
        try {
            const preferences = new UserPreferences({ userId });
            return await preferences.load();
        } catch (error) {
            throw new Error(`获取用户偏好设置失败: ${error.message}`);
        }
    }

    /**
     * 更新用户偏好设置
     * @param {string} userId 用户ID
     * @param {object} updates 更新数据
     * @returns {Promise<object>} 更新后的偏好设置
     */
    async updateUserPreferences(userId, updates) {
        try {
            const preferences = new UserPreferences({ userId });
            await preferences.load();
            
            const validation = preferences.validateUpdates(updates);
            if (!validation.isValid) {
                throw new Error(`偏好设置验证失败: ${validation.errors.join(', ')}`);
            }
            
            await preferences.update(updates);
            return preferences.getPreferences();
        } catch (error) {
            throw new Error(`更新用户偏好设置失败: ${error.message}`);
        }
    }

    /**
     * 重置用户偏好设置为默认值
     * @param {string} userId 用户ID
     * @returns {Promise<object>} 重置后的偏好设置
     */
    async resetUserPreferences(userId) {
        try {
            const preferences = new UserPreferences({ userId });
            await preferences.resetToDefaults();
            return preferences.getPreferences();
        } catch (error) {
            throw new Error(`重置用户偏好设置失败: ${error.message}`);
        }
    }

    /**
     * 获取用户偏好设置统计信息
     * @param {string} userId 用户ID
     * @returns {Promise<object>} 统计信息
     */
    async getUserPreferencesStats(userId) {
        try {
            const preferences = new UserPreferences({ userId });
            await preferences.load();
            return preferences.getStats();
        } catch (error) {
            throw new Error(`获取用户偏好设置统计失败: ${error.message}`);
        }
    }

    /**
     * 批量更新多个用户的偏好设置
     * @param {string[]} userIds 用户ID数组
     * @param {object} updates 更新数据
     * @returns {Promise<object>} 批量更新结果
     */
    async batchUpdateUserPreferences(userIds, updates) {
        try {
            const results = {
                success: [],
                errors: []
            };

            for (const userId of userIds) {
                try {
                    const preferences = new UserPreferences({ userId });
                    await preferences.load();
                    
                    const validation = preferences.validateUpdates(updates);
                    if (!validation.isValid) {
                        throw new Error(`用户 ${userId} 偏好设置验证失败`);
                    }
                    
                    await preferences.update(updates);
                    results.success.push({
                        userId,
                        preferences: preferences.getPreferences()
                    });
                } catch (error) {
                    results.errors.push({
                        userId,
                        error: error.message
                    });
                }
            }

            return results;
        } catch (error) {
            throw new Error(`批量更新用户偏好设置失败: ${error.message}`);
        }
    }

    /**
     * 导出用户偏好设置数据
     * @param {string} userId 用户ID
     * @returns {Promise<object>} 导出的偏好设置数据
     */
    async exportUserPreferences(userId) {
        try {
            const preferences = new UserPreferences({ userId });
            await preferences.load();
            
            return {
                userId,
                preferences: preferences.getPreferences(),
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '1.0.0',
                    format: 'json'
                }
            };
        } catch (error) {
            throw new Error(`导出用户偏好设置失败: ${error.message}`);
        }
    }

    /**
     * 导入用户偏好设置数据
     * @param {string} userId 用户ID
     * @param {object} importData 导入数据
     * @returns {Promise<object>} 导入结果
     */
    async importUserPreferences(userId, importData) {
        try {
            const preferences = new UserPreferences({ userId });
            
            // 验证导入数据格式
            if (!importData.preferences || typeof importData.preferences !== 'object') {
                throw new Error('导入数据格式不正确');
            }
            
            const validation = preferences.validateUpdates(importData.preferences);
            if (!validation.isValid) {
                throw new Error(`导入数据验证失败: ${validation.errors.join(', ')}`);
            }
            
            await preferences.update(importData.preferences);
            return {
                success: true,
                message: '偏好设置导入成功',
                preferences: preferences.getPreferences()
            };
        } catch (error) {
            throw new Error(`导入用户偏好设置失败: ${error.message}`);
        }
    }
}

module.exports = UserPreferencesController;