/**
 * 角色权限模型
 * 负责用户角色和权限的定义和管理
 * 
 * @version 2.0.0
 * @author MarketBook Team
 * @description 优化了权限验证逻辑，增加了错误处理和类型检查
 */

class Role {
    constructor(roleData) {
        try {
            this.id = roleData.id || null;
            this.name = roleData.name || '';
            this.description = roleData.description || '';
            this.permissions = Array.isArray(roleData.permissions) ? [...roleData.permissions] : [];
            this.createdAt = roleData.createdAt ? new Date(roleData.createdAt) : new Date();
            this.updatedAt = roleData.updatedAt ? new Date(roleData.updatedAt) : new Date();
            this.isActive = roleData.isActive !== undefined ? Boolean(roleData.isActive) : true;
        } catch (error) {
            throw new Error(`角色初始化失败: ${error.message}`);
        }
    }

    /**
     * 验证角色名称格式
     * @returns {boolean} 是否有效
     */
    validateName() {
        if (typeof this.name !== 'string') return false;
        const nameRegex = /^[a-zA-Z0-9_]{2,30}$/;
        return nameRegex.test(this.name.trim());
    }

    /**
     * 验证权限列表格式
     * @returns {boolean} 是否有效
     */
    validatePermissions() {
        if (!Array.isArray(this.permissions)) {
            return false;
        }
        
        // 检查每个权限是否有效
        const validPermissions = [
            'user:read', 'user:write', 'user:delete',
            'post:read', 'post:write', 'post:delete', 'post:moderate',
            'trade:read', 'trade:write', 'trade:execute',
            'admin:read', 'admin:write', 'admin:delete'
        ];
        
        return this.permissions.every(permission => 
            typeof permission === 'string' && validPermissions.includes(permission)
        );
    }

    /**
     * 检查角色是否拥有特定权限
     * @param {string} permission 权限名称
     * @returns {boolean} 是否拥有权限
     */
    hasPermission(permission) {
        if (typeof permission !== 'string') return false;
        
        // 使用Set优化查找性能，避免重复计算
        if (!this._permissionSet) {
            this._permissionSet = new Set(this.permissions);
        }
        
        return this._permissionSet.has(permission);
    }

    /**
     * 获取权限缓存状态（性能监控）
     * @returns {object} 缓存状态信息
     */
    getCacheStats() {
        return {
            cacheInitialized: !!this._permissionSet,
            cacheSize: this._permissionSet ? this._permissionSet.size : 0,
            originalPermissionsCount: this.permissions.length,
            cacheHitRate: this._cacheHits ? this._cacheHits / (this._cacheHits + this._cacheMisses) : 0,
            lastCacheUpdate: this._lastCacheUpdate || null
        };
    }

    /**
     * 清除权限缓存（当权限变更时调用）
     */
    clearPermissionCache() {
        this._permissionSet = null;
        this._lastCacheUpdate = new Date();
    }

    /**
     * 性能监控：记录权限检查统计
     */
    _recordPermissionCheck(hit) {
        if (!this._cacheHits) this._cacheHits = 0;
        if (!this._cacheMisses) this._cacheMisses = 0;
        
        if (hit) this._cacheHits++;
        else this._cacheMisses++;
    }

    /**
     * 检查角色是否拥有所有指定权限
     * @param {string[]} permissions 权限列表
     * @returns {boolean} 是否拥有所有权限
     */
    hasAllPermissions(permissions) {
        if (!Array.isArray(permissions)) return false;
        return permissions.every(permission => this.hasPermission(permission));
    }

    /**
     * 检查角色是否拥有任意指定权限
     * @param {string[]} permissions 权限列表
     * @returns {boolean} 是否拥有任意权限
     */
    hasAnyPermission(permissions) {
        if (!Array.isArray(permissions)) return false;
        return permissions.some(permission => this.hasPermission(permission));
    }

    /**
     * 添加权限
     * @param {string} permission 权限名称
     * @returns {boolean} 是否添加成功
     */
    addPermission(permission) {
        if (typeof permission !== 'string' || this.permissions.includes(permission)) {
            return false;
        }
        
        this.permissions.push(permission);
        this.updatedAt = new Date();
        return true;
    }

    /**
     * 批量添加权限
     * @param {string[]} permissions 权限列表
     * @returns {number} 成功添加的权限数量
     */
    addPermissions(permissions) {
        if (!Array.isArray(permissions)) return 0;
        
        let addedCount = 0;
        permissions.forEach(permission => {
            if (this.addPermission(permission)) {
                addedCount++;
            }
        });
        
        return addedCount;
    }

    /**
     * 移除权限
     * @param {string} permission 权限名称
     * @returns {boolean} 是否移除成功
     */
    removePermission(permission) {
        const index = this.permissions.indexOf(permission);
        if (index > -1) {
            this.permissions.splice(index, 1);
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    /**
     * 批量移除权限
     * @param {string[]} permissions 权限列表
     * @returns {number} 成功移除的权限数量
     */
    removePermissions(permissions) {
        if (!Array.isArray(permissions)) return 0;
        
        let removedCount = 0;
        permissions.forEach(permission => {
            if (this.removePermission(permission)) {
                removedCount++;
            }
        });
        
        return removedCount;
    }

    /**
     * 完整验证角色数据
     * @returns {object} 验证结果
     */
    validateAll() {
        const errors = [];
        
        if (!this.name) {
            errors.push('角色名称不能为空');
        } else if (!this.validateName()) {
            errors.push('角色名称格式不正确（2-30位字母、数字、下划线）');
        }
        
        if (!this.permissions || this.permissions.length === 0) {
            errors.push('权限列表不能为空');
        } else if (!this.validatePermissions()) {
            errors.push('权限列表包含无效权限');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 获取角色信息
     * @returns {object} 角色信息
     */
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            permissions: [...this.permissions],
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            isActive: this.isActive
        };
    }

    /**
     * 获取角色权限数量
     * @returns {number} 权限数量
     */
    getPermissionCount() {
        return this.permissions.length;
    }

    /**
     * 检查角色是否为空（无权限）
     * @returns {boolean} 是否为空角色
     */
    isEmpty() {
        return this.permissions.length === 0;
    }

    /**
     * 克隆角色对象
     * @returns {Role} 新的角色实例
     */
    clone() {
        return new Role({
            id: this.id,
            name: this.name,
            description: this.description,
            permissions: [...this.permissions],
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            isActive: this.isActive
        });
    }

    /**
     * 检查角色权限是否包含管理员权限
     * @returns {boolean} 是否管理员角色
     */
    isAdminRole() {
        const adminPermissions = ['admin:read', 'admin:write', 'admin:delete'];
        return this.hasAnyPermission(adminPermissions);
    }

    /**
     * 检查角色权限是否包含交易权限
     * @returns {boolean} 是否交易角色
     */
    isTraderRole() {
        const traderPermissions = ['trade:read', 'trade:write', 'trade:execute'];
        return this.hasAnyPermission(traderPermissions);
    }

    /**
     * 检查角色权限是否包含内容管理权限
     * @returns {boolean} 是否内容管理角色
     */
    isContentManagerRole() {
        const contentPermissions = ['post:read', 'post:write', 'post:delete', 'post:moderate'];
        return this.hasAnyPermission(contentPermissions);
    }

    /**
     * 获取角色权限分类统计
     * @returns {object} 权限分类统计
     */
    getPermissionStats() {
        const categories = {
            user: this.permissions.filter(p => p.startsWith('user:')).length,
            post: this.permissions.filter(p => p.startsWith('post:')).length,
            trade: this.permissions.filter(p => p.startsWith('trade:')).length,
            admin: this.permissions.filter(p => p.startsWith('admin:')).length
        };
        
        return {
            ...categories,
            total: this.permissions.length,
            hasUserPermissions: categories.user > 0,
            hasPostPermissions: categories.post > 0,
            hasTradePermissions: categories.trade > 0,
            hasAdminPermissions: categories.admin > 0
        };
    }

    /**
     * 比较两个角色的权限差异
     * @param {Role} otherRole 另一个角色
     * @returns {object} 权限差异 {added: string[], removed: string[], common: string[]}
     */
    comparePermissions(otherRole) {
        if (!(otherRole instanceof Role)) {
            throw new Error('比较对象必须是Role实例');
        }
        
        const thisPermissions = new Set(this.permissions);
        const otherPermissions = new Set(otherRole.permissions);
        
        const added = [...otherPermissions].filter(p => !thisPermissions.has(p));
        const removed = [...thisPermissions].filter(p => !otherPermissions.has(p));
        const common = [...thisPermissions].filter(p => otherPermissions.has(p));
        
        return { added, removed, common };
    }

    /**
     * 检查角色是否可以升级到目标角色
     * @param {Role} targetRole 目标角色
     * @returns {boolean} 是否可以升级
     */
    canUpgradeTo(targetRole) {
        if (!(targetRole instanceof Role)) return false;
        
        const diff = this.comparePermissions(targetRole);
        return diff.removed.length === 0; // 只能增加权限，不能减少权限
    }
}

module.exports = Role;