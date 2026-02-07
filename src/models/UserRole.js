/**
 * 用户角色关联模型
 * 管理用户与角色的多对多关系
 */

class UserRole {
    constructor(userRoleData) {
        this.id = userRoleData.id || null;
        this.userId = userRoleData.userId || null;
        this.roleId = userRoleData.roleId || null;
        this.assignedAt = userRoleData.assignedAt || new Date();
        this.assignedBy = userRoleData.assignedBy || null; // 分配角色的用户ID
        this.expiresAt = userRoleData.expiresAt || null; // 角色过期时间
    }

    /**
     * 验证用户角色关联数据
     * @returns {object} 验证结果
     */
    validate() {
        const errors = [];
        
        if (!this.userId) {
            errors.push('用户ID不能为空');
        }
        
        if (!this.roleId) {
            errors.push('角色ID不能为空');
        }
        
        if (this.expiresAt && new Date(this.expiresAt) <= new Date()) {
            errors.push('角色过期时间必须大于当前时间');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 检查角色是否已过期
     * @returns {boolean} 是否过期
     */
    isExpired() {
        if (!this.expiresAt) return false;
        return new Date(this.expiresAt) < new Date();
    }

    /**
     * 获取安全信息
     * @returns {object} 安全信息
     */
    getSafeInfo() {
        return {
            id: this.id,
            userId: this.userId,
            roleId: this.roleId,
            assignedAt: this.assignedAt,
            assignedBy: this.assignedBy,
            expiresAt: this.expiresAt,
            isExpired: this.isExpired()
        };
    }
}

module.exports = UserRole;