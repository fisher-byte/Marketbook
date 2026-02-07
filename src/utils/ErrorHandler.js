/**
 * 用户系统错误处理工具类
 * 提供统一的错误处理机制和性能监控
 * 
 * @version 1.0.0
 * @author MarketBook Team
 * @description 优化用户系统的错误处理和性能监控
 */

class ErrorHandler {
    constructor() {
        this.errorLogs = [];
        this.performanceMetrics = {
            validationTime: 0,
            databaseTime: 0,
            cacheTime: 0,
            totalRequests: 0,
            errorCount: 0
        };
        this.maxLogSize = 1000; // 最大日志数量
    }

    /**
     * 记录错误信息
     * @param {string} type 错误类型
     * @param {string} message 错误信息
     * @param {object} context 上下文信息
     * @param {Error} error 原始错误对象
     */
    logError(type, message, context = {}, error = null) {
        const errorEntry = {
            id: this.generateId(),
            timestamp: new Date(),
            type: type,
            message: message,
            context: context,
            stack: error ? error.stack : null,
            severity: this.getSeverityLevel(type)
        };

        this.errorLogs.push(errorEntry);
        this.performanceMetrics.errorCount++;

        // 保持日志大小限制
        if (this.errorLogs.length > this.maxLogSize) {
            this.errorLogs.shift();
        }

        // 根据错误类型进行不同处理
        this.handleErrorByType(errorEntry);
    }

    /**
     * 记录性能指标
     * @param {string} metricType 指标类型
     * @param {number} duration 持续时间(毫秒)
     */
    recordPerformance(metricType, duration) {
        if (this.performanceMetrics[metricType] !== undefined) {
            this.performanceMetrics[metricType] += duration;
        }
        this.performanceMetrics.totalRequests++;
    }

    /**
     * 生成唯一ID
     * @returns {string} 唯一标识符
     */
    generateId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取错误严重级别
     * @param {string} type 错误类型
     * @returns {string} 严重级别
     */
    getSeverityLevel(type) {
        const severityMap = {
            'validation': 'low',
            'authentication': 'high',
            'authorization': 'high',
            'database': 'medium',
            'network': 'medium',
            'security': 'critical',
            'performance': 'medium'
        };

        return severityMap[type] || 'medium';
    }

    /**
     * 根据错误类型进行特定处理
     * @param {object} errorEntry 错误条目
     */
    handleErrorByType(errorEntry) {
        switch (errorEntry.type) {
            case 'security':
                this.handleSecurityError(errorEntry);
                break;
            case 'authentication':
                this.handleAuthError(errorEntry);
                break;
            case 'performance':
                this.handlePerformanceError(errorEntry);
                break;
            default:
                // 默认处理
                break;
        }
    }

    /**
     * 处理安全相关错误
     * @param {object} errorEntry 错误条目
     */
    handleSecurityError(errorEntry) {
        // 记录安全事件到安全日志
        console.warn(`安全警告: ${errorEntry.message}`, errorEntry.context);
        
        // 可以集成到安全监控系统
        this.notifySecurityTeam(errorEntry);
    }

    /**
     * 处理认证错误
     * @param {object} errorEntry 错误条目
     */
    handleAuthError(errorEntry) {
        // 记录认证失败尝试
        console.warn(`认证错误: ${errorEntry.message}`, errorEntry.context);
        
        // 可以触发账户锁定逻辑
        if (errorEntry.context.failedAttempts >= 3) {
            this.triggerAccountLock(errorEntry.context.userId);
        }
    }

    /**
     * 处理性能错误
     * @param {object} errorEntry 错误条目
     */
    handlePerformanceError(errorEntry) {
        // 记录性能问题
        console.warn(`性能问题: ${errorEntry.message}`, errorEntry.context);
        
        // 触发性能优化建议
        this.suggestPerformanceOptimization(errorEntry.context);
    }

    /**
     * 通知安全团队
     * @param {object} errorEntry 错误条目
     */
    notifySecurityTeam(errorEntry) {
        // 集成安全通知系统
        // 例如：发送邮件、Slack通知等
        const securityAlert = {
            title: `安全事件: ${errorEntry.type}`,
            message: errorEntry.message,
            context: errorEntry.context,
            timestamp: errorEntry.timestamp,
            severity: errorEntry.severity
        };
        
        // 这里可以调用实际的通知服务
        console.log('安全通知:', securityAlert);
    }

    /**
     * 触发账户锁定
     * @param {string} userId 用户ID
     */
    triggerAccountLock(userId) {
        // 调用用户服务锁定账户
        console.log(`触发账户锁定: ${userId}`);
        // 实际实现中会调用User模型的锁定方法
    }

    /**
     * 建议性能优化
     * @param {object} context 上下文信息
     */
    suggestPerformanceOptimization(context) {
        const suggestions = [];
        
        if (context.responseTime > 1000) {
            suggestions.push('数据库查询优化建议: 添加索引或优化查询语句');
        }
        
        if (context.memoryUsage > 80) {
            suggestions.push('内存使用优化建议: 检查内存泄漏或增加缓存策略');
        }
        
        if (suggestions.length > 0) {
            console.log('性能优化建议:', suggestions);
        }
    }

    /**
     * 获取错误统计信息
     * @returns {object} 错误统计
     */
    getErrorStats() {
        const stats = {
            totalErrors: this.errorLogs.length,
            errorDistribution: {},
            severityDistribution: {},
            recentErrors: this.errorLogs.slice(-10),
            performanceSummary: {...this.performanceMetrics}
        };

        // 按类型统计
        this.errorLogs.forEach(error => {
            stats.errorDistribution[error.type] = (stats.errorDistribution[error.type] || 0) + 1;
            stats.severityDistribution[error.severity] = (stats.severityDistribution[error.severity] || 0) + 1;
        });

        // 计算平均性能指标
        if (this.performanceMetrics.totalRequests > 0) {
            stats.performanceSummary.averageValidationTime = 
                this.performanceMetrics.validationTime / this.performanceMetrics.totalRequests;
            stats.performanceSummary.averageDatabaseTime = 
                this.performanceMetrics.databaseTime / this.performanceMetrics.totalRequests;
        }

        return stats;
    }

    /**
     * 清除旧日志
     * @param {number} days 保留天数
     */
    clearOldLogs(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        this.errorLogs = this.errorLogs.filter(log => 
            new Date(log.timestamp) > cutoffDate
        );
    }

    /**
     * 导出错误报告
     * @returns {object} 错误报告
     */
    exportReport() {
        return {
            timestamp: new Date(),
            summary: this.getErrorStats(),
            recentErrors: this.errorLogs.slice(-50),
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * 生成优化建议
     * @returns {string[]} 建议列表
     */
    generateRecommendations() {
        const recommendations = [];
        const stats = this.getErrorStats();

        // 基于错误类型给出建议
        if (stats.errorDistribution.authentication > 10) {
            recommendations.push('加强用户认证流程，考虑增加多因素认证');
        }

        if (stats.errorDistribution.validation > 20) {
            recommendations.push('优化前端表单验证，减少无效请求');
        }

        if (stats.performanceSummary.averageDatabaseTime > 500) {
            recommendations.push('优化数据库查询性能，考虑添加缓存层');
        }

        return recommendations;
    }

    /**
     * 重置性能指标
     */
    resetMetrics() {
        this.performanceMetrics = {
            validationTime: 0,
            databaseTime: 0,
            cacheTime: 0,
            totalRequests: 0,
            errorCount: 0
        };
    }
}

// 创建全局实例
const errorHandler = new ErrorHandler();

module.exports = {
    ErrorHandler,
    errorHandler
};