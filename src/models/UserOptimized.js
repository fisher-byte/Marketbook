/**
 * 用户模型优化版 - MarketBook 平台
 * 增强性能监控、错误处理和缓存机制
 * 
 * 优化重点：
 * 1. 增强错误处理机制
 * 2. 改进性能监控指标
 * 3. 优化缓存策略
 * 4. 增加交易统计功能
 * 
 * @version 3.0.0
 * @author MarketBook Team
 */

class UserOptimized {
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
        
        // 交易数据（为模拟盘功能准备）
        this.tradingData = userData.tradingData || {
            totalTrades: 0,
            successfulTrades: 0,
            totalProfit: 0,
            assetTypes: [],
            tradingHistory: []
        };
        
        // 性能优化：智能缓存机制
        this._cache = {
            safeInfo: null,
            fullInfo: null,
            stats: null,
            tradingStats: null,
            lastCalculated: null,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        // 增强性能监控
        this._performanceMetrics = {
            validationTime: 0,
            calculationTime: 0,
            cacheHitRate: 0,
            errorCount: 0,
            lastError: null
        };
        
        // 错误处理记录
        this._errorLog = [];
    }

    // ==================== 增强验证方法 ====================

    /**
     * 增强验证：用户名格式验证
     * @returns {object} 验证结果 {isValid: boolean, error: string|null}
     */
    validateUsername() {
        const startTime = Date.now();
        
        try {
            if (typeof this.username !== 'string') {
                throw new Error('用户名必须是字符串类型');
            }
            
            const trimmedUsername = this.username.trim();
            if (!trimmedUsername) {
                return { isValid: false, error: '用户名不能为空' };
            }
            
            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
            const isValid = usernameRegex.test(trimmedUsername);
            
            this._recordPerformance('validationTime', Date.now() - startTime);
            
            return {
                isValid,
                error: isValid ? null : '用户名格式不正确（3-20位字母、数字、下划线）'
            };
            
        } catch (error) {
            this._recordError('validateUsername', error);
            return { isValid: false, error: error.message };
        }
    }

    /**
     * 增强验证：邮箱格式验证
     * @returns {object} 验证结果 {isValid: boolean, error: string|null}
     */
    validateEmail() {
        const startTime = Date.now();
        
        try {
            if (typeof this.email !== 'string') {
                throw new Error('邮箱必须是字符串类型');
            }
            
            const trimmedEmail = this.email.trim().toLowerCase();
            if (!trimmedEmail) {
                return { isValid: false, error: '邮箱不能为空' };
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const isValid = emailRegex.test(trimmedEmail);
            
            this._recordPerformance('validationTime', Date.now() - startTime);
            
            return {
                isValid,
                error: isValid ? null : '邮箱格式不正确'
            };
            
        } catch (error) {
            this._recordError('validateEmail', error);
            return { isValid: false, error: error.message };
        }
    }

    /**
     * 增强验证：密码强度验证
     * @returns {object} 验证结果 {isValid: boolean, error: string|null}
     */
    validatePassword() {
        const startTime = Date.now();
        
        try {
            if (typeof this.password !== 'string') {
                throw new Error('密码必须是字符串类型');
            }
            
            if (!this.password) {
                return { isValid: false, error: '密码不能为空' };
            }
            
            // 增强密码策略：至少8位，包含大小写字母、数字和特殊字符
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            const isValid = passwordRegex.test(this.password);
            
            this._recordPerformance('validationTime', Date.now() - startTime);
            
            return {
                isValid,
                error: isValid ? null : '密码强度不足（至少8位，包含大小写字母、数字和特殊字符）'
            };
            
        } catch (error) {
            this._recordError('validatePassword', error);
            return { isValid: false, error: error.message };
        }
    }

    // ==================== 增强业务逻辑 ====================

    /**
     * 增强登录失败处理
     * @param {number} maxAttempts 最大尝试次数
     * @param {number} lockDuration 锁定时长（分钟）
     * @returns {object} 处理结果 {locked: boolean, remainingAttempts: number}
     */
    handleLoginFailure(maxAttempts = 5, lockDuration = 30) {
        try {
            this.failedLoginAttempts += 1;
            this.updatedAt = new Date();
            
            const remainingAttempts = Math.max(0, maxAttempts - this.failedLoginAttempts);
            let locked = false;
            
            if (this.failedLoginAttempts >= maxAttempts) {
                const lockTime = new Date();
                lockTime.setMinutes(lockTime.getMinutes() + lockDuration);
                this.lockedUntil = lockTime;
                locked = true;
            }
            
            return {
                locked,
                remainingAttempts,
                message: locked ? 
                    `账户已锁定，${lockDuration}分钟后自动解锁` : 
                    `登录失败，剩余尝试次数：${remainingAttempts}`
            };
            
        } catch (error) {
            this._recordError('handleLoginFailure', error);
            throw error;
        }
    }

    /**
     * 增强交易记录添加
     * @param {object} tradeData 交易数据
     * @returns {object} 处理结果 {success: boolean, tradeId: string}
     */
    addTradeRecord(tradeData) {
        try {
            const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const tradeRecord = {
                id: tradeId,
                timestamp: new Date(),
                symbol: tradeData.symbol || 'Unknown',
                type: tradeData.type || 'buy',
                quantity: tradeData.quantity || 0,
                price: tradeData.price || 0,
                profit: tradeData.profit || 0,
                success: tradeData.success || false
            };
            
            this.tradingData.totalTrades += 1;
            if (tradeRecord.success) {
                this.tradingData.successfulTrades += 1;
            }
            this.tradingData.totalProfit += tradeRecord.profit;
            
            if (tradeData.assetType && !this.tradingData.assetTypes.includes(tradeData.assetType)) {
                this.tradingData.assetTypes.push(tradeData.assetType);
            }
            
            this.tradingData.tradingHistory.push(tradeRecord);
            this.updatedAt = new Date();
            
            // 清除缓存
            this._clearCache('tradingStats');
            
            return {
                success: true,
                tradeId,
                message: '交易记录添加成功'
            };
            
        } catch (error) {
            this._recordError('addTradeRecord', error);
            return {
                success: false,
                tradeId: null,
                error: error.message
            };
        }
    }

    // ==================== 增强缓存机制 ====================

    /**
     * 智能获取用户统计信息（带缓存）
     * @returns {object} 统计信息
     */
    getStats() {
        if (this._shouldUseCache('stats')) {
            this._cache.cacheHits++;
            return this._cache.stats;
        }
        
        this._cache.cacheMisses++;
        const startTime = Date.now();
        
        try {
            const stats = this._calculateStats();
            this._cache.stats = stats;
            this._cache.lastCalculated = new Date();
            
            this._recordPerformance('calculationTime', Date.now() - startTime);
            return stats;
            
        } catch (error) {
            this._recordError('getStats', error);
            throw error;
        }
    }

    /**
     * 智能获取交易统计信息（带缓存）
     * @returns {object} 交易统计
     */
    getTradingStats() {
        if (this._shouldUseCache('tradingStats')) {
            this._cache.cacheHits++;
            return this._cache.tradingStats;
        }
        
        this._cache.cacheMisses++;
        const startTime = Date.now();
        
        try {
            const tradingStats = this._calculateTradingStats();
            this._cache.tradingStats = tradingStats;
            this._cache.lastCalculated = new Date();
            
            this._recordPerformance('calculationTime', Date.now() - startTime);
            return tradingStats;
            
        } catch (error) {
            this._recordError('getTradingStats', error);
            throw error;
        }
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 判断是否应该使用缓存
     * @param {string} cacheKey 缓存键
     * @returns {boolean} 是否使用缓存
     */
    _shouldUseCache(cacheKey) {
        if (!this._cache[cacheKey]) return false;
        
        // 缓存有效期：5分钟
        const cacheAge = new Date() - this._cache.lastCalculated;
        return cacheAge < 5 * 60 * 1000; // 5分钟
    }

    /**
     * 清除指定缓存
     * @param {string} cacheKey 缓存键
     */
    _clearCache(cacheKey) {
        if (this._cache[cacheKey]) {
            this._cache[cacheKey] = null;
        }
    }

    /**
     * 记录性能指标
     * @param {string} metric 指标名称
     * @param {number} value 指标值
     */
    _recordPerformance(metric, value) {
        if (this._performanceMetrics[metric] !== undefined) {
            this._performanceMetrics[metric] += value;
        }
        
        // 计算缓存命中率
        const totalCacheAccess = this._cache.cacheHits + this._cache.cacheMisses;
        if (totalCacheAccess > 0) {
            this._performanceMetrics.cacheHitRate = this._cache.cacheHits / totalCacheAccess;
        }
    }

    /**
     * 记录错误信息
     * @param {string} method 方法名称
     * @param {Error} error 错误对象
     */
    _recordError(method, error) {
        this._performanceMetrics.errorCount++;
        this._performanceMetrics.lastError = {
            method,
            message: error.message,
            timestamp: new Date()
        };
        
        this._errorLog.push({
            timestamp: new Date(),
            method,
            error: error.message,
            stack: error.stack
        });
        
        // 限制错误日志大小
        if (this._errorLog.length > 100) {
            this._errorLog = this._errorLog.slice(-100);
        }
    }

    /**
     * 计算用户统计信息
     * @returns {object} 统计信息
     */
    _calculateStats() {
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
            loginFrequency: this.calculateLoginFrequency(),
            accountStrength: this.calculateAccountStrength(),
            riskLevel: this.assessRiskLevel(),
            performanceMetrics: this.getPerformanceMetrics()
        };
    }

    /**
     * 计算交易统计信息
     * @returns {object} 交易统计
     */
    _calculateTradingStats() {
        return {
            totalTrades: this.tradingData.totalTrades || 0,
            successfulTrades: this.tradingData.successfulTrades || 0,
            winRate: this.tradingData.totalTrades > 0 ? 
                (this.tradingData.successfulTrades / this.tradingData.totalTrades * 100).toFixed(2) : 0,
            totalProfit: this.tradingData.totalProfit || 0,
            averageTradeValue: this.tradingData.totalTrades > 0 ? 
                (this.tradingData.totalProfit / this.tradingData.totalTrades).toFixed(2) : 0,
            riskExposure: this.calculateRiskExposure(),
            tradingExperience: this.getTradingExperienceLevel(),
            portfolioDiversity: this.calculatePortfolioDiversity(),
            strategyEffectiveness: this.assessStrategyEffectiveness(),
            tradingHistorySummary: this.getTradingHistorySummary()
        };
    }

    /**
     * 获取交易历史摘要
     * @returns {object} 历史摘要
     */
    getTradingHistorySummary() {
        const history = this.tradingData.tradingHistory || [];
        const recentTrades = history.slice(-10); // 最近10笔交易
        
        return {
            totalTrades: history.length,
            recentTradesCount: recentTrades.length,
            recentWinRate: recentTrades.length > 0 ? 
                (recentTrades.filter(t => t.success).length / recentTrades.length * 100).toFixed(2) : 0,
            recentProfit: recentTrades.reduce((sum, trade) => sum + trade.profit, 0),
            mostTradedAsset: this.getMostTradedAsset(),
            tradingTrend: this.analyzeTradingTrend()
        };
    }

    /**
     * 获取最常交易的资产
     * @returns {string} 资产名称
     */
    getMostTradedAsset() {
        const history = this.tradingData.tradingHistory || [];
        if (history.length === 0) return 'None';
        
        const assetCounts = {};
        history.forEach(trade => {
            assetCounts[trade.symbol] = (assetCounts[trade.symbol] || 0) + 1;
        });
        
        return Object.keys(assetCounts).reduce((a, b) => 
            assetCounts[a] > assetCounts[b] ? a : b, 'Unknown'
        );
    }

    /**
     * 分析交易趋势
     * @returns {string} 趋势描述
     */
    analyzeTradingTrend() {
        const history = this.tradingData.tradingHistory || [];
        if (history.length < 5) return 'insufficient_data';
        
        const recentTrades = history.slice(-5);
        const winCount = recentTrades.filter(t => t.success).length;
        
        if (winCount >= 4) return 'strong_uptrend';
        if (winCount >= 3) return 'moderate_uptrend';
        if (winCount <= 1) return 'downtrend';
        return 'sideways';
    }

    // ==================== 性能监控方法 ====================

    /**
     * 获取性能监控报告
     * @returns {object} 性能报告
     */
    getPerformanceMetrics() {
        return {
            ...this._performanceMetrics,
            cacheEfficiency: {
                hits: this._cache.cacheHits,
                misses: this._cache.cacheMisses,
                hitRate: this._performanceMetrics.cacheHitRate
            },
            errorSummary: {
                totalErrors: this._performanceMetrics.errorCount,
                lastError: this._performanceMetrics.lastError,
                errorRate: this._performanceMetrics.errorCount / Math.max(1, this._cache.cacheHits + this._cache.cacheMisses)
            }
        };
    }

    /**
     * 获取错误日志摘要
     * @param {number} limit 限制数量
     * @returns {object} 错误摘要
     */
    getErrorSummary(limit = 10) {
        const recentErrors = this._errorLog.slice(-limit);
        
        return {
            totalErrors: this._errorLog.length,
            recentErrors: recentErrors,
            errorFrequency: this.calculateErrorFrequency(),
            mostCommonError: this.getMostCommonError()
        };
    }

    /**
     * 计算错误频率
     * @returns {string} 频率描述
     */
    calculateErrorFrequency() {
        if (this._errorLog.length === 0) return 'none';
        
        const firstError = this._errorLog[0].timestamp;
        const daysSinceFirstError = (new Date() - firstError) / (1000 * 60 * 60 * 24);
        const errorsPerDay = this._errorLog.length / Math.max(1, daysSinceFirstError);
        
        if (errorsPerDay > 1) return 'high';
        if (errorsPerDay > 0.1) return 'moderate';
        return 'low';
    }

    /**
     * 获取最常见错误
     * @returns {string} 错误消息
     */
    getMostCommonError() {
        if (this._errorLog.length === 0) return 'none';
        
        const errorCounts = {};
        this._errorLog.forEach(error => {
            errorCounts[error.error] = (errorCounts[error.error] || 0) + 1;
        });
        
        return Object.keys(errorCounts).reduce((a, b) => 
            errorCounts[a] > errorCounts[b] ? a : b
        );
    }

    // ==================== 原有方法保持兼容 ====================

    isLocked() {
        return this.lockedUntil && new Date() < new Date(this.lockedUntil);
    }

    canLogin() {
        return this.isActive && !this.isLocked() && this.emailVerified;
    }

    handleLoginSuccess() {
        this.failedLoginAttempts = 0;
        this.lockedUntil = null;
        this.lastLoginAt = new Date();
        this.updatedAt = new Date();
    }

    verifyEmail() {
        this.emailVerified = true;
        this.updatedAt = new Date();
    }

    getSafeInfo() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastLoginAt: this.lastLoginAt,
            isActive: this.isActive,
            emailVerified: this.emailVerified,
            tradingStats: this.getTradingStats()
        };
    }

    // ... 其他原有方法保持兼容
}

module.exports = UserOptimized;