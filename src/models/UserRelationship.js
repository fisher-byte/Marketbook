/**
 * 用户关系模型 - MarketBook项目
 * 管理用户之间的关注、好友关系
 * 
 * 功能特性：
 * - 关注/取消关注功能
 * - 好友关系管理
 * - 关系状态跟踪
 * - 隐私设置支持
 * 
 * @version 1.0.0
 * @author MarketBook Team
 */

class UserRelationship {
    constructor(relationshipData = {}) {
        // 关系标识
        this.id = relationshipData.id || null;
        this.followerId = relationshipData.followerId || null; // 关注者ID
        this.followingId = relationshipData.followingId || null; // 被关注者ID
        
        // 关系类型和状态
        this.relationshipType = relationshipData.relationshipType || 'follow'; // follow/friend/block
        this.status = relationshipData.status || 'active'; // active/pending/blocked
        
        // 时间戳
        this.createdAt = relationshipData.createdAt || new Date();
        this.updatedAt = relationshipData.updatedAt || new Date();
        
        // 关系元数据
        this.metadata = relationshipData.metadata || {
            mutual: false,           // 是否互相关注
            notifications: true,     // 是否接收通知
            privacyLevel: 'public'    // 关系隐私级别
        };
    }

    /**
     * 验证关系数据
     * @returns {object} 验证结果
     */
    validate() {
        const errors = [];
        
        if (!this.followerId) {
            errors.push('关注者ID不能为空');
        }
        
        if (!this.followingId) {
            errors.push('被关注者ID不能为空');
        }
        
        if (this.followerId === this.followingId) {
            errors.push('不能关注自己');
        }
        
        const validTypes = ['follow', 'friend', 'block'];
        if (!validTypes.includes(this.relationshipType)) {
            errors.push(`关系类型无效，必须是: ${validTypes.join(', ')}`);
        }
        
        const validStatuses = ['active', 'pending', 'blocked', 'rejected'];
        if (!validStatuses.includes(this.status)) {
            errors.push(`状态无效，必须是: ${validStatuses.join(', ')}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 检查是否为好友关系
     * @returns {boolean}
     */
    isFriend() {
        return this.relationshipType === 'friend' && this.status === 'active';
    }

    /**
     * 检查是否为关注关系
     * @returns {boolean}
     */
    isFollowing() {
        return this.relationshipType === 'follow' && this.status === 'active';
    }

    /**
     * 检查是否为屏蔽关系
     * @returns {boolean}
     */
    isBlocked() {
        return this.relationshipType === 'block' && this.status === 'active';
    }

    /**
     * 检查关系是否活跃
     * @returns {boolean}
     */
    isActive() {
        return this.status === 'active';
    }

    /**
     * 检查是否为互相关注
     * @returns {boolean}
     */
    isMutual() {
        return this.metadata.mutual;
    }

    /**
     * 设置互相关注状态
     * @param {boolean} mutual 是否互相关注
     */
    setMutual(mutual) {
        this.metadata.mutual = Boolean(mutual);
        this.updatedAt = new Date();
    }

    /**
     * 接受好友请求
     * @returns {boolean} 是否成功
     */
    acceptFriendRequest() {
        if (this.relationshipType === 'friend' && this.status === 'pending') {
            this.status = 'active';
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    /**
     * 拒绝好友请求
     * @returns {boolean} 是否成功
     */
    rejectFriendRequest() {
        if (this.relationshipType === 'friend' && this.status === 'pending') {
            this.status = 'rejected';
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    /**
     * 取消关系
     * @returns {boolean} 是否成功
     */
    cancelRelationship() {
        if (this.status === 'active' || this.status === 'pending') {
            this.status = 'inactive';
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    /**
     * 获取关系信息（安全版本）
     * @returns {object}
     */
    getInfo() {
        return {
            id: this.id,
            followerId: this.followerId,
            followingId: this.followingId,
            relationshipType: this.relationshipType,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            metadata: {
                mutual: this.metadata.mutual,
                notifications: this.metadata.notifications
            }
        };
    }

    /**
     * 获取关系统计信息
     * @returns {object}
     */
    getStats() {
        const now = new Date();
        const relationshipAge = Math.floor((now - new Date(this.createdAt)) / (1000 * 60 * 60 * 24));
        
        return {
            relationshipAgeDays: relationshipAge,
            isNew: relationshipAge < 7,
            isLongTerm: relationshipAge > 90,
            activityLevel: this.getActivityLevel()
        };
    }

    /**
     * 获取关系活跃度
     * @returns {string}
     */
    getActivityLevel() {
        const daysSinceUpdate = Math.floor((new Date() - new Date(this.updatedAt)) / (1000 * 60 * 60 * 24));
        
        if (daysSinceUpdate <= 1) return 'very_active';
        if (daysSinceUpdate <= 7) return 'active';
        if (daysSinceUpdate <= 30) return 'occasional';
        return 'inactive';
    }

    /**
     * 更新关系元数据
     * @param {object} updates 更新数据
     * @returns {boolean}
     */
    updateMetadata(updates) {
        const allowedFields = ['mutual', 'notifications', 'privacyLevel'];
        
        let updated = false;
        for (const key in updates) {
            if (allowedFields.includes(key) && this.metadata[key] !== updates[key]) {
                this.metadata[key] = updates[key];
                updated = true;
            }
        }
        
        if (updated) {
            this.updatedAt = new Date();
        }
        
        return updated;
    }
}

module.exports = UserRelationship;