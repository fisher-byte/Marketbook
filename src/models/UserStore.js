/**
 * User Store - 用户数据存储适配层
 * 对 User 和 UserProfile 进行封装，使用内存存储
 * 
 * @module UserStore
 */

const memoryStore = require('../db/memoryStore');
const User = require('./User');
const UserProfile = require('./UserProfile');
const bcrypt = require('bcrypt');

class UserStore {
    /**
     * 根据条件查找单个用户
     * @param {object} query 查询条件，如 {email: 'xxx'} 或 {username: 'xxx'}
     * @returns {object|null} User实例或null
     */
    static async findOne(query) {
        const userData = memoryStore.findOne('users', query);
        if (!userData) {
            return null;
        }
        
        // 转换为User实例
        return new User(userData);
    }

    /**
     * 根据ID查找用户
     * @param {number} id 用户ID
     * @returns {object|null} User实例或null
     */
    static async findById(id) {
        const userData = memoryStore.findById('users', id);
        if (!userData) {
            return null;
        }
        
        return new User(userData);
    }

    /**
     * 保存用户
     * @param {object} userData 用户数据（可以是User实例或普通对象）
     * @returns {object} 保存后的User实例
     */
    static async save(userData) {
        // 如果是User实例，转换为普通对象
        const dataToSave = userData instanceof User ? 
            userData.getFullInfo() : userData;
        
        // 如果有密码且未加密，进行加密
        if (dataToSave.password && !dataToSave.password.startsWith('$2')) {
            const salt = await bcrypt.genSalt(10);
            dataToSave.password = await bcrypt.hash(dataToSave.password, salt);
        }
        
        // 保存到内存存储
        const saved = memoryStore.save('users', dataToSave);
        
        // 返回User实例
        return new User(saved);
    }

    /**
     * 更新用户
     * @param {object} query 查询条件
     * @param {object} update 更新内容
     * @returns {object|null} 更新后的User实例或null
     */
    static async updateOne(query, update) {
        const updated = memoryStore.updateOne('users', query, update);
        if (!updated) {
            return null;
        }
        
        return new User(updated);
    }

    /**
     * 删除用户
     * @param {object} query 查询条件
     * @returns {boolean} 是否删除成功
     */
    static async deleteOne(query) {
        return memoryStore.deleteOne('users', query);
    }

    /**
     * 查找多个用户
     * @param {object} query 查询条件
     * @param {object} options 查询选项
     * @returns {array} User实例数组
     */
    static async find(query = {}, options = {}) {
        const users = memoryStore.find('users', query, options);
        return users.map(userData => new User(userData));
    }

    /**
     * 统计用户数量
     * @param {object} query 查询条件
     * @returns {number} 用户数量
     */
    static async count(query = {}) {
        return memoryStore.count('users', query);
    }

    /**
     * 验证密码
     * @param {string} plainPassword 明文密码
     * @param {string} hashedPassword 加密后的密码
     * @returns {boolean} 是否匹配
     */
    static async comparePassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
}

class UserProfileStore {
    /**
     * 根据用户ID查找用户资料
     * @param {number} userId 用户ID
     * @returns {object|null} UserProfile实例或null
     */
    static async findByUserId(userId) {
        const profileData = memoryStore.findOne('userProfiles', { userId });
        if (!profileData) {
            return null;
        }
        
        return new UserProfile(profileData);
    }

    /**
     * 保存用户资料
     * @param {object} profileData 用户资料数据
     * @returns {object} 保存后的UserProfile实例
     */
    static async save(profileData) {
        const dataToSave = profileData instanceof UserProfile ?
            profileData : profileData;
        
        const saved = memoryStore.save('userProfiles', dataToSave);
        return new UserProfile(saved);
    }

    /**
     * 更新用户资料
     * @param {number} userId 用户ID
     * @param {object} update 更新内容
     * @returns {object|null} 更新后的UserProfile实例或null
     */
    static async updateByUserId(userId, update) {
        const updated = memoryStore.updateOne('userProfiles', { userId }, update);
        if (!updated) {
            return null;
        }
        
        return new UserProfile(updated);
    }

    /**
     * 删除用户资料
     * @param {number} userId 用户ID
     * @returns {boolean} 是否删除成功
     */
    static async deleteByUserId(userId) {
        return memoryStore.deleteOne('userProfiles', { userId });
    }
}

module.exports = {
    UserStore,
    UserProfileStore,
};
