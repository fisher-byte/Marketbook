/**
 * 用户分析服务 - MarketBook项目
 * 提供用户行为统计、活跃度分析和健康度评估功能
 * 
 * @version 1.0.0
 * @author MarketBook Team
 */

class UserAnalyticsService {
    constructor() {
        this.userStats = new Map();
        this.activityLogs = new Map();
    }

    /**
     * 记录用户活动
     * @param {string} userId 用户ID
     * @param {string} activityType 活动类型
     * @param {object} metadata 活动元数据
     */
    logActivity(userId, activityType, metadata = {}) {
        if (!this.activityLogs.has(userId)) {
            this.activityLogs.set(userId, []);
        }
        
        const activity = {
            timestamp: new Date(),
            type: activityType,
            metadata: metadata
        };
        
        this.activityLogs.get(userId).push(activity);
        
        // 保持最近1000条记录
        if (this.activityLogs.get(userId).length > 1000) {
            this.activityLogs.get(userId).shift();
        }
    }

    /**
     * 获取用户活动统计
     * @param {string} userId 用户ID
     * @param {number} days 统计天数
     * @returns {object} 活动统计
     */
    getUserActivityStats(userId, days = 30) {
        const activities = this.activityLogs.get(userId) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const recentActivities = activities.filter(activity => 
            activity.timestamp >= cutoffDate
        );
        
        const activityCounts = {};
        recentActivities.forEach(activity => {
            activityCounts[activity.type] = (activityCounts[activity.type] || 0) + 1;
        });
        
        return {
            totalActivities: recentActivities.length,
            activityCounts: activityCounts,
            dailyAverage: recentActivities.length / days,
            lastActivity: recentActivities.length > 0 ? 
                recentActivities[recentActivities.length - 1].timestamp : null
        };
    }

    /**
     * 计算用户参与度分数
     * @param {string} userId 用户ID
     * @returns {number} 参与度分数 (0-100)
     */
    calculateEngagementScore(userId) {
        const stats = this.getUserActivityStats(userId, 30);
        
        let score = 0;
        
        // 活动频率评分 (0-40分)
        if (stats.dailyAverage >= 5) score += 40;
        else if (stats.dailyAverage >= 3) score += 30;
        else if (stats.dailyAverage >= 1) score += 20;
        else if (stats.dailyAverage >= 0.5) score += 10;
        
        // 活动多样性评分 (0-30分)
        const activityTypes = Object.keys(stats.activityCounts).length;
        if (activityTypes >= 5) score += 30;
        else if (activityTypes >= 3) score += 20;
        else if (activityTypes >= 1) score += 10;
        
        // 近期活跃度评分 (0-30分)
        if (stats.lastActivity) {
            const hoursSinceLastActivity = (new Date() - stats.lastActivity) / (1000 * 60 * 60);
            if (hoursSinceLastActivity <= 1) score += 30;
            else if (hoursSinceLastActivity <= 24) score += 20;
            else if (hoursSinceLastActivity <= 72) score += 10;
        }
        
        return Math.min(100, score);
    }

    /**
     * 获取用户行为模式分析
     * @param {string} userId 用户ID
     * @returns {object} 行为模式分析
     */
    analyzeUserBehavior(userId) {
        const activities = this.activityLogs.get(userId) || [];
        
        if (activities.length === 0) {
            return {
                pattern: 'inactive',
                peakHours: [],
                preferredActivities: [],
                consistency: 0
            };
        }
        
        // 分析活跃时间段
        const hourCounts = {};
        activities.forEach(activity => {
            const hour = activity.timestamp.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        const peakHours = Object.entries(hourCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));
        
        // 分析活动偏好
        const activityCounts = {};
        activities.forEach(activity => {
            activityCounts[activity.type] = (activityCounts[activity.type] || 0) + 1;
        });
        
        const preferredActivities = Object.entries(activityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type]) => type);
        
        // 分析行为一致性
        const daysWithActivity = new Set();
        activities.forEach(activity => {
            const dateStr = activity.timestamp.toISOString().split('T')[0];
            daysWithActivity.add(dateStr);
        });
        
        const totalDays = Math.max(1, (new Date() - activities[0].timestamp) / (1000 * 60 * 60 * 24));
        const consistency = Math.round((daysWithActivity.size / totalDays) * 100);
        
        // 判断行为模式
        let pattern = 'regular';
        if (consistency < 30) pattern = 'sporadic';
        else if (consistency > 80 && activities.length > 100) pattern = 'highly_engaged';
        else if (peakHours.length > 0 && peakHours.includes(9) && peakHours.includes(15)) {
            pattern = 'market_hours';
        }
        
        return {
            pattern: pattern,
            peakHours: peakHours,
            preferredActivities: preferredActivities,
            consistency: consistency,
            totalActivityDays: daysWithActivity.size
        };
    }

    /**
     * 生成用户健康报告
     * @param {string} userId 用户ID
     * @param {object} userData 用户基础数据
     * @returns {object} 健康报告
     */
    generateHealthReport(userId, userData) {
        const engagementScore = this.calculateEngagementScore(userId);
        const behaviorAnalysis = this.analyzeUserBehavior(userId);
        const activityStats = this.getUserActivityStats(userId, 30);
        
        // 评估健康状况
        let healthStatus = 'excellent';
        if (engagementScore < 20) healthStatus = 'poor';
        else if (engagementScore < 50) healthStatus = 'fair';
        else if (engagementScore < 80) healthStatus = 'good';
        
        // 生成改进建议
        const recommendations = this.generateRecommendations(userId, engagementScore, behaviorAnalysis);
        
        return {
            userId: userId,
            healthStatus: healthStatus,
            engagementScore: engagementScore,
            behaviorAnalysis: behaviorAnalysis,
            activityStats: activityStats,
            recommendations: recommendations,
            generatedAt: new Date()
        };
    }

    /**
     * 生成个性化改进建议
     * @param {string} userId 用户ID
     * @param {number} engagementScore 参与度分数
     * @param {object} behaviorAnalysis 行为分析
     * @returns {string[]} 改进建议列表
     */
    generateRecommendations(userId, engagementScore, behaviorAnalysis) {
        const recommendations = [];
        
        if (engagementScore < 30) {
            recommendations.push("尝试每天登录平台查看最新市场动态");
            recommendations.push("参与论坛讨论可以快速提升您的交易知识");
        }
        
        if (behaviorAnalysis.consistency < 50) {
            recommendations.push("建立固定的使用习惯有助于更好地跟踪市场变化");
        }
        
        if (behaviorAnalysis.preferredActivities.length < 3) {
            recommendations.push("尝试使用更多平台功能，如模拟交易和策略分析");
        }
        
        if (behaviorAnalysis.pattern === 'sporadic') {
            recommendations.push("设置市场提醒功能，不错过重要交易机会");
        }
        
        return recommendations;
    }

    /**
     * 批量分析用户群体
     * @param {string[]} userIds 用户ID列表
     * @returns {object} 群体分析结果
     */
    analyzeUserGroup(userIds) {
        const groupStats = {
            totalUsers: userIds.length,
            averageEngagement: 0,
            engagementDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
            commonPatterns: {},
            topActivities: {}
        };
        
        let totalScore = 0;
        const patternCounts = {};
        const activityCounts = {};
        
        userIds.forEach(userId => {
            const engagementScore = this.calculateEngagementScore(userId);
            totalScore += engagementScore;
            
            const behaviorAnalysis = this.analyzeUserBehavior(userId);
            patternCounts[behaviorAnalysis.pattern] = (patternCounts[behaviorAnalysis.pattern] || 0) + 1;
            
            // 统计活动类型
            behaviorAnalysis.preferredActivities.forEach(activity => {
                activityCounts[activity] = (activityCounts[activity] || 0) + 1;
            });
            
            // 统计健康状态分布
            if (engagementScore >= 80) groupStats.engagementDistribution.excellent++;
            else if (engagementScore >= 50) groupStats.engagementDistribution.good++;
            else if (engagementScore >= 20) groupStats.engagementDistribution.fair++;
            else groupStats.engagementDistribution.poor++;
        });
        
        groupStats.averageEngagement = totalScore / userIds.length;
        groupStats.commonPatterns = patternCounts;
        groupStats.topActivities = Object.entries(activityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
        
        return groupStats;
    }
}

module.exports = UserAnalyticsService;