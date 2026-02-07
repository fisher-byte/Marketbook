/**
 * 用户模型 - MarketBook 平台
 * 负责用户数据的定义、验证和业务逻辑处理
 * 
 * @version 3.0.0
 * @author MarketBook Team
 * @description 增强版本：集成错误处理、性能监控和高级分析功能
 */

const ErrorHandler = require('../utils/ErrorHandler');
const PerformanceMonitor = require('../utils/PerformanceMonitor');

class User {
    constructor(userData = {}) {
        // 基础信息
        this.id = userData.id || null;
        this.username = userData.username || '';
        this.email = userData.email || '';
        this.password = userData.password || '';
        
        // 时间戳
        this.createdAt = userData.createdAt || new Date();
        this.updatedAt = userData.updatedAt || new Date();
        
        // 状态管理
        this.isActive = userData.isActive !== undefined ? userData.isActive : true;
        this.emailVerified = userData.emailVerified || false;
        this.lastLoginAt = userData.lastLoginAt || null;
        
        // 安全相关
        this.failedLoginAttempts = userData.failedLoginAttempts || 0;
        this.lockedUntil = userData.lockedUntil || null;
        
        // 性能优化：缓存机制
        this._cache = {
            safeInfo: null,
            fullInfo: null,
            stats: null,
            lastCalculated: null
        };
        
        // 性能监控
        this._performanceMonitor = new PerformanceMonitor('UserModel');
        this._errorHandler = new ErrorHandler('UserModel');
        
        // 高级分析数据
        this._analytics = {
            loginPatterns: [],
            behaviorMetrics: {},
            riskAssessment: {},
            performanceHistory: [],
            interactionHistory: [],
            preferencePatterns: {}
        };
        
        // 行为分析集成
        this._behaviorAnalyzer = null;
        this._recommendationEngine = null;
    }

    // ==================== 验证方法 ====================

    /**
     * 验证用户名格式
     * @returns {boolean} 是否有效
     * @throws {Error} 当用户名格式严重错误时抛出异常
     */
    validateUsername() {
        if (typeof this.username !== 'string') {
            throw new Error('用户名必须是字符串类型');
        }
        
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(this.username.trim());
    }

    /**
     * 验证邮箱格式
     * @returns {boolean} 是否有效
     * @throws {Error} 当邮箱格式严重错误时抛出异常
     */
    validateEmail() {
        if (typeof this.email !== 'string') {
            throw new Error('邮箱必须是字符串类型');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(this.email.trim().toLowerCase());
    }

    /**
     * 验证密码强度
     * @returns {boolean} 是否有效
     * @throws {Error} 当密码格式严重错误时抛出异常
     */
    validatePassword() {
        if (typeof this.password !== 'string') {
            throw new Error('密码必须是字符串类型');
        }
        
        // 增强密码策略：至少8位，包含大小写字母、数字和特殊字符
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(this.password);
    }

    /**
     * 检查用户是否被锁定
     * @returns {boolean} 是否被锁定
     */
    isLocked() {
        return this.lockedUntil && new Date() < new Date(this.lockedUntil);
    }

    /**
     * 检查用户是否可登录
     * @returns {boolean} 是否可登录
     */
    canLogin() {
        return this.isActive && !this.isLocked() && this.emailVerified;
    }

    // ==================== 业务逻辑方法 ====================

    /**
     * 完整验证用户数据
     * @returns {object} 验证结果 {isValid: boolean, errors: string[]}
     */
    validateAll() {
        const errors = [];
        
        try {
            // 用户名验证
            if (!this.username.trim()) {
                errors.push('用户名不能为空');
            } else if (!this.validateUsername()) {
                errors.push('用户名格式不正确（3-20位字母、数字、下划线）');
            }
            
            // 邮箱验证
            if (!this.email.trim()) {
                errors.push('邮箱不能为空');
            } else if (!this.validateEmail()) {
                errors.push('邮箱格式不正确');
            }
            
            // 密码验证（仅在创建或修改密码时验证）
            if (this.password && !this.validatePassword()) {
                errors.push('密码强度不足（至少8位，包含大小写字母、数字和特殊字符）');
            }
            
        } catch (error) {
            errors.push(`数据验证异常: ${error.message}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 处理登录失败
     * @param {number} maxAttempts 最大尝试次数
     * @param {number} lockDuration 锁定时长（分钟）
     */
    handleLoginFailure(maxAttempts = 5, lockDuration = 30) {
        this.failedLoginAttempts += 1;
        this.updatedAt = new Date();
        
        if (this.failedLoginAttempts >= maxAttempts) {
            const lockTime = new Date();
            lockTime.setMinutes(lockTime.getMinutes() + lockDuration);
            this.lockedUntil = lockTime;
        }
    }

    /**
     * 处理登录成功
     */
    handleLoginSuccess() {
        this.failedLoginAttempts = 0;
        this.lockedUntil = null;
        this.lastLoginAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * 验证邮箱
     */
    verifyEmail() {
        this.emailVerified = true;
        this.updatedAt = new Date();
    }

    // ==================== 数据操作方法 ====================

    /**
     * 获取安全的用户信息（不包含敏感数据）
     * @returns {object} 安全用户信息
     */
    getSafeInfo() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastLoginAt: this.lastLoginAt,
            isActive: this.isActive,
            emailVerified: this.emailVerified
        };
    }

    /**
     * 获取完整用户信息（包含敏感数据，仅限内部使用）
     * @returns {object} 完整用户信息
     */
    getFullInfo() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            password: this.password,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastLoginAt: this.lastLoginAt,
            isActive: this.isActive,
            emailVerified: this.emailVerified,
            failedLoginAttempts: this.failedLoginAttempts,
            lockedUntil: this.lockedUntil
        };
    }

    /**
     * 更新用户信息
     * @param {object} updates 更新数据
     */
    update(updates) {
        const allowedFields = ['username', 'email', 'password', 'isActive'];
        
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                this[key] = updates[key];
            }
        });
        
        this.updatedAt = new Date();
    }

    /**
     * 生成用户统计信息
     * @returns {object} 统计信息
     */
    getStats() {
        const now = new Date();
        const createdDays = Math.floor((now - new Date(this.createdAt)) / (1000 * 60 * 60 * 24));
        const lastLoginDays = this.lastLoginAt ? 
            Math.floor((now - new Date(this.lastLoginAt)) / (1000 * 60 * 60 * 24)) : null;
        
        return {
            accountAgeDays: createdDays,
            isRecentlyCreated: createdDays < 7,
            hasRecentActivity: this.lastLoginAt && 
                (now - new Date(this.lastLoginAt)) < (7 * 24 * 60 * 60 * 1000),
            lastLoginDays: lastLoginDays,
            securityStatus: this.isLocked() ? 'locked' : 
                           this.failedLoginAttempts > 0 ? 'warning' : 'normal',
            activityLevel: this.getActivityLevel(),
            accountHealth: this.getAccountHealthScore(),
            // 新增统计指标
            loginFrequency: this.calculateLoginFrequency(),
            accountStrength: this.calculateAccountStrength(),
            riskLevel: this.assessRiskLevel(),
            // 交易相关统计（为模拟盘功能准备）
            tradingStats: this.getTradingStats()
        };
    }

    /**
     * 获取交易相关统计信息
     * @returns {object} 交易统计
     */
    getTradingStats() {
        return {
            totalTrades: this.tradingData?.totalTrades || 0,
            successfulTrades: this.tradingData?.successfulTrades || 0,
            winRate: this.tradingData?.totalTrades > 0 ? 
                (this.tradingData.successfulTrades / this.tradingData.totalTrades * 100).toFixed(2) : 0,
            totalProfit: this.tradingData?.totalProfit || 0,
            averageTradeValue: this.tradingData?.totalTrades > 0 ? 
                (this.tradingData.totalProfit / this.tradingData.totalTrades).toFixed(2) : 0,
            riskExposure: this.calculateRiskExposure(),
            tradingExperience: this.getTradingExperienceLevel(),
            portfolioDiversity: this.calculatePortfolioDiversity(),
            strategyEffectiveness: this.assessStrategyEffectiveness()
        };
    }

    /**
     * 计算风险敞口
     * @returns {string} 风险等级
     */
    calculateRiskExposure() {
        if (!this.tradingData) return 'low';
        
        const avgTradeValue = this.tradingData.totalTrades > 0 ? 
            Math.abs(this.tradingData.totalProfit) / this.tradingData.totalTrades : 0;
        
        if (avgTradeValue > 1000) return 'high';
        if (avgTradeValue > 500) return 'medium';
        return 'low';
    }

    /**
     * 获取交易经验等级
     * @returns {string} 经验等级
     */
    getTradingExperienceLevel() {
        const totalTrades = this.tradingData?.totalTrades || 0;
        
        if (totalTrades >= 100) return 'expert';
        if (totalTrades >= 50) return 'advanced';
        if (totalTrades >= 20) return 'intermediate';
        if (totalTrades >= 5) return 'beginner';
        return 'novice';
    }

    /**
     * 计算投资组合多样性
     * @returns {string} 多样性等级
     */
    calculatePortfolioDiversity() {
        if (!this.tradingData?.assetTypes) return 'low';
        
        const uniqueAssets = new Set(this.tradingData.assetTypes).size;
        
        if (uniqueAssets >= 5) return 'high';
        if (uniqueAssets >= 3) return 'medium';
        return 'low';
    }

    /**
     * 评估策略有效性
     * @returns {string} 有效性等级
     */
    assessStrategyEffectiveness() {
        const winRate = this.tradingData?.totalTrades > 0 ? 
            this.tradingData.successfulTrades / this.tradingData.totalTrades : 0;
        
        if (winRate >= 0.7) return 'excellent';
        if (winRate >= 0.6) return 'good';
        if (winRate >= 0.5) return 'average';
        return 'needs_improvement';
    }

    /**
     * 计算登录频率指标
     * @returns {string} 频率等级
     */
    calculateLoginFrequency() {
        if (!this.lastLoginAt) return 'never';
        
        const daysSinceLastLogin = Math.floor((new Date() - new Date(this.lastLoginAt)) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastLogin <= 1) return 'daily';
        if (daysSinceLastLogin <= 3) return 'frequent';
        if (daysSinceLastLogin <= 7) return 'weekly';
        if (daysSinceLastLogin <= 30) return 'monthly';
        return 'rarely';
    }

    /**
     * 计算账户强度（安全性和活跃度综合评分）
     * @returns {number} 强度分数（0-100）
     */
    calculateAccountStrength() {
        let strength = 50; // 基础分数
        
        // 安全因素加分
        if (this.emailVerified) strength += 15;
        if (this.failedLoginAttempts === 0) strength += 10;
        if (!this.isLocked()) strength += 10;
        
        // 活跃度加分
        const activityLevel = this.getActivityLevel();
        if (activityLevel === 'very_active') strength += 15;
        else if (activityLevel === 'active') strength += 10;
        else if (activityLevel === 'occasional') strength += 5;
        
        return Math.max(0, Math.min(100, strength));
    }

    /**
     * 评估账户风险等级
     * @returns {string} 风险等级
     */
    assessRiskLevel() {
        if (this.isLocked()) return 'high';
        if (this.failedLoginAttempts >= 3) return 'medium';
        if (!this.emailVerified) return 'low';
        return 'none';
    }

    /**
     * 计算用户活跃度等级
     * @returns {string} 活跃度等级
     */
    getActivityLevel() {
        if (!this.lastLoginAt) return 'inactive';
        
        const daysSinceLastLogin = Math.floor((new Date() - new Date(this.lastLoginAt)) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastLogin <= 1) return 'very_active';
        if (daysSinceLastLogin <= 7) return 'active';
        if (daysSinceLastLogin <= 30) return 'occasional';
        return 'inactive';
    }

    /**
     * 计算账户健康分数（0-100）
     * @returns {number} 健康分数
     */
    getAccountHealthScore() {
        let score = 100;
        
        // 邮箱验证加分
        if (!this.emailVerified) score -= 20;
        
        // 账户状态减分
        if (!this.isActive) score -= 50;
        if (this.isLocked()) score -= 30;
        
        // 安全记录减分
        if (this.failedLoginAttempts > 0) score -= Math.min(this.failedLoginAttempts * 5, 20);
        
        // 活跃度加分
        const activityLevel = this.getActivityLevel();
        if (activityLevel === 'very_active') score += 10;
        else if (activityLevel === 'inactive') score -= 10;
        
        return Math.max(0, Math.min(100, score));
    }
}

module.exports = User;