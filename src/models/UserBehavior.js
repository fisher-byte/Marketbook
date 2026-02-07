/**
 * 用户行为分析模型 - MarketBook项目
 * 负责收集、分析和预测用户行为模式，为个性化推荐提供数据支持
 * 
 * 功能特性：
 * - 用户行为数据收集和存储
 * - 行为模式分析和预测
 * - 个性化推荐算法基础
 * - 用户兴趣标签生成
 * 
 * @version 1.0.0
 * @author MarketBook Team
 */

class UserBehavior {
    constructor(userId) {
        this.userId = userId;
        
        // 行为数据存储
        this.behaviorData = {
            // 浏览行为
            pageViews: [],
            timeSpent: {},
            
            // 交互行为
            clicks: [],
            searches: [],
            likes: [],
            comments: [],
            shares: [],
            
            // 交易行为（模拟盘）
            trades: [],
            portfolioChanges: [],
            
            // 学习行为
            tutorialsCompleted: [],
            articlesRead: [],
            videosWatched: []
        };
        
        // 分析结果缓存
        this.analysisCache = {
            interests: [],
            behaviorPatterns: {},
            recommendations: [],
            lastAnalyzed: null
        };
        
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * 记录页面浏览行为
     * @param {string} pageId 页面ID
     * @param {number} duration 停留时长（秒）
     * @param {string} referrer 来源页面
     */
    recordPageView(pageId, duration = 0, referrer = '') {
        const viewRecord = {
            pageId,
            timestamp: new Date(),
            duration,
            referrer
        };
        
        this.behaviorData.pageViews.push(viewRecord);
        this.updatedAt = new Date();
        
        // 更新停留时间统计
        this.behaviorData.timeSpent[pageId] = 
            (this.behaviorData.timeSpent[pageId] || 0) + duration;
    }

    /**
     * 记录点击行为
     * @param {string} elementId 元素ID
     * @param {string} elementType 元素类型
     * @param {object} metadata 附加数据
     */
    recordClick(elementId, elementType, metadata = {}) {
        const clickRecord = {
            elementId,
            elementType,
            timestamp: new Date(),
            metadata
        };
        
        this.behaviorData.clicks.push(clickRecord);
        this.updatedAt = new Date();
    }

    /**
     * 记录搜索行为
     * @param {string} query 搜索关键词
     * @param {array} results 搜索结果
     */
    recordSearch(query, results = []) {
        const searchRecord = {
            query,
            timestamp: new Date(),
            resultCount: results.length,
            topResults: results.slice(0, 3)
        };
        
        this.behaviorData.searches.push(searchRecord);
        this.updatedAt = new Date();
    }

    /**
     * 记录交易行为
     * @param {string} tradeId 交易ID
     * @param {string} asset 交易资产
     * @param {string} action 交易动作（buy/sell）
     * @param {number} amount 交易金额
     * @param {object} metadata 交易元数据
     */
    recordTrade(tradeId, asset, action, amount, metadata = {}) {
        const tradeRecord = {
            tradeId,
            asset,
            action,
            amount,
            timestamp: new Date(),
            metadata
        };
        
        this.behaviorData.trades.push(tradeRecord);
        this.updatedAt = new Date();
    }

    /**
     * 分析用户兴趣标签
     * @returns {array} 兴趣标签列表
     */
    analyzeInterests() {
        const interests = new Map();
        
        // 分析浏览行为
        this.behaviorData.pageViews.forEach(view => {
            const category = this.categorizePage(view.pageId);
            if (category) {
                interests.set(category, (interests.get(category) || 0) + 1);
            }
        });
        
        // 分析搜索行为
        this.behaviorData.searches.forEach(search => {
            const keywords = this.extractKeywords(search.query);
            keywords.forEach(keyword => {
                interests.set(keyword, (interests.get(keyword) || 0) + 1);
            });
        });
        
        // 分析交易行为
        this.behaviorData.trades.forEach(trade => {
            const assetCategory = this.categorizeAsset(trade.asset);
            if (assetCategory) {
                interests.set(assetCategory, (interests.get(assetCategory) || 0) + 1);
            }
        });
        
        // 排序并返回前5个兴趣标签
        const sortedInterests = Array.from(interests.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([interest, score]) => ({
                interest,
                score,
                confidence: this.calculateConfidence(score)
            }));
        
        this.analysisCache.interests = sortedInterests;
        this.analysisCache.lastAnalyzed = new Date();
        
        return sortedInterests;
    }

    /**
     * 分析行为模式
     * @returns {object} 行为模式分析结果
     */
    analyzeBehaviorPatterns() {
        const patterns = {
            activityTimes: this.analyzeActivityTimes(),
            preferredContent: this.analyzePreferredContent(),
            interactionFrequency: this.analyzeInteractionFrequency(),
            learningProgress: this.analyzeLearningProgress()
        };
        
        this.analysisCache.behaviorPatterns = patterns;
        this.analysisCache.lastAnalyzed = new Date();
        
        return patterns;
    }

    /**
     * 生成个性化推荐
     * @param {number} limit 推荐数量
     * @returns {array} 推荐内容列表
     */
    generateRecommendations(limit = 5) {
        const interests = this.analyzeInterests();
        const patterns = this.analyzeBehaviorPatterns();
        
        const recommendations = [];
        
        // 基于兴趣标签推荐相关内容
        interests.forEach(({ interest }) => {
            const relatedContent = this.getRelatedContent(interest);
            recommendations.push(...relatedContent);
        });
        
        // 基于行为模式推荐
        if (patterns.preferredContent) {
            patterns.preferredContent.forEach(contentType => {
                const trendingContent = this.getTrendingContent(contentType);
                recommendations.push(...trendingContent);
            });
        }
        
        // 去重和排序
        const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
        const sortedRecommendations = uniqueRecommendations
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);
        
        this.analysisCache.recommendations = sortedRecommendations;
        
        return sortedRecommendations;
    }

    /**
     * 分析用户活跃时间段
     * @returns {object} 活跃时间分析
     */
    analyzeActivityTimes() {
        const hourCounts = new Array(24).fill(0);
        
        // 统计各小时的活动次数
        [...this.behaviorData.pageViews, ...this.behaviorData.clicks].forEach(record => {
            const hour = new Date(record.timestamp).getHours();
            hourCounts[hour]++;
        });
        
        const maxCount = Math.max(...hourCounts);
        const peakHours = hourCounts
            .map((count, hour) => ({ hour, count, ratio: count / maxCount }))
            .filter(item => item.ratio > 0.3) // 超过30%峰值的时段
            .sort((a, b) => b.count - a.count);
        
        return {
            peakHours: peakHours.map(item => item.hour),
            activityDistribution: hourCounts,
            isNocturnal: this.isNocturnalUser(hourCounts),
            preferredTimeSlot: this.getPreferredTimeSlot(hourCounts)
        };
    }

    /**
     * 分析偏好的内容类型
     * @returns {array} 偏好内容类型列表
     */
    analyzePreferredContent() {
        const contentTypes = new Map();
        
        this.behaviorData.pageViews.forEach(view => {
            const type = this.getContentType(view.pageId);
            if (type) {
                contentTypes.set(type, (contentTypes.get(type) || 0) + 1);
            }
        });
        
        return Array.from(contentTypes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([type]) => type);
    }

    /**
     * 分析交互频率
     * @returns {object} 交互频率分析
     */
    analyzeInteractionFrequency() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const recentInteractions = [...this.behaviorData.clicks, ...this.behaviorData.pageViews]
            .filter(record => new Date(record.timestamp) > oneWeekAgo);
        
        const dailyCounts = {};
        recentInteractions.forEach(record => {
            const date = new Date(record.timestamp).toDateString();
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });
        
        const averageDaily = Object.values(dailyCounts).reduce((sum, count) => sum + count, 0) / 
                            Math.max(Object.keys(dailyCounts).length, 1);
        
        return {
            averageDailyInteractions: Math.round(averageDaily),
            interactionConsistency: this.calculateConsistency(dailyCounts),
            engagementLevel: this.getEngagementLevel(averageDaily)
        };
    }

    /**
     * 分析学习进度
     * @returns {object} 学习进度分析
     */
    analyzeLearningProgress() {
        const completedCount = this.behaviorData.tutorialsCompleted.length;
        const articlesRead = this.behaviorData.articlesRead.length;
        const videosWatched = this.behaviorData.videosWatched.length;
        
        return {
            completedTutorials: completedCount,
            articlesRead,
            videosWatched,
            totalLearningActivities: completedCount + articlesRead + videosWatched,
            learningVelocity: this.calculateLearningVelocity(),
            knowledgeGap: this.identifyKnowledgeGap()
        };
    }

    // ==================== 辅助方法 ====================

    /**
     * 页面分类
     */
    categorizePage(pageId) {
        const categories = {
            'forum': '社区讨论',
            'tutorial': '学习教程',
            'market': '市场分析',
            'trade': '交易功能',
            'portfolio': '投资组合',
            'news': '新闻资讯'
        };
        
        for (const [key, category] of Object.entries(categories)) {
            if (pageId.includes(key)) return category;
        }
        
        return '其他';
    }

    /**
     * 资产分类
     */
    categorizeAsset(asset) {
        const categories = {
            'stock': '股票',
            'crypto': '加密货币',
            'forex': '外汇',
            'future': '期货',
            'option': '期权'
        };
        
        for (const [key, category] of Object.entries(categories)) {
            if (asset.toLowerCase().includes(key)) return category;
        }
        
        return '其他资产';
    }

    /**
     * 提取关键词
     */
    extractKeywords(query) {
        // 简单的关键词提取逻辑
        const stopWords = ['的', '和', '与', '在', '关于', '如何', '什么', '为什么'];
        return query.split(/[\s\,\;\。\，]+/)
            .filter(word => word.length > 1 && !stopWords.includes(word))
            .slice(0, 3);
    }

    /**
     * 计算置信度
     */
    calculateConfidence(score) {
        const maxPossible = Math.max(1, this.behaviorData.pageViews.length / 10);
        return Math.min(1, score / maxPossible);
    }

    /**
     * 判断是否为夜间用户
     */
    isNocturnalUser(hourCounts) {
        const nightHours = hourCounts.slice(22).concat(hourCounts.slice(0, 6));
        const dayHours = hourCounts.slice(6, 22);
        
        const nightTotal = nightHours.reduce((sum, count) => sum + count, 0);
        const dayTotal = dayHours.reduce((sum, count) => sum + count, 0);
        
        return nightTotal > dayTotal * 0.7; // 夜间活动超过日间70%
    }

    /**
     * 获取偏好时间段
     */
    getPreferredTimeSlot(hourCounts) {
        const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
        
        if (maxHour >= 6 && maxHour < 12) return 'morning';
        if (maxHour >= 12 && maxHour < 18) return 'afternoon';
        if (maxHour >= 18 && maxHour < 22) return 'evening';
        return 'night';
    }

    /**
     * 计算一致性
     */
    calculateConsistency(dailyCounts) {
        const counts = Object.values(dailyCounts);
        if (counts.length < 2) return 0;
        
        const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length;
        const variance = counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length;
        const stdDev = Math.sqrt(variance);
        
        return Math.max(0, 1 - stdDev / mean);
    }

    /**
     * 获取参与度等级
     */
    getEngagementLevel(averageDaily) {
        if (averageDaily >= 10) return 'high';
        if (averageDaily >= 5) return 'medium';
        if (averageDaily >= 1) return 'low';
        return 'inactive';
    }

    /**
     * 计算学习速度
     */
    calculateLearningVelocity() {
        if (this.behaviorData.tutorialsCompleted.length < 2) return 0;
        
        const firstDate = new Date(this.behaviorData.tutorialsCompleted[0].timestamp);
        const lastDate = new Date(this.behaviorData.tutorialsCompleted.slice(-1)[0].timestamp);
        const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
        
        return this.behaviorData.tutorialsCompleted.length / Math.max(daysDiff, 1);
    }

    /**
     * 识别知识缺口
     */
    identifyKnowledgeGap() {
        // 简化的知识缺口识别逻辑
        const viewedTopics = new Set(this.behaviorData.pageViews.map(view => 
            this.categorizePage(view.pageId)
        ));
        
        const allTopics = ['社区讨论', '学习教程', '市场分析', '交易功能', '投资组合', '新闻资讯'];
        return allTopics.filter(topic => !viewedTopics.has(topic));
    }

    /**
     * 获取相关内容（模拟）
     */
    getRelatedContent(interest) {
        // 模拟相关内容获取逻辑
        return [
            {
                id: `rec_${interest}_1`,
                title: `${interest}相关文章`,
                type: 'article',
                relevanceScore: 0.9
            },
            {
                id: `rec_${interest}_2`,
                title: `${interest}教程视频`,
                type: 'video',
                relevanceScore: 0.8
            }
        ];
    }

    /**
     * 获取热门内容（模拟）
     */
    getTrendingContent(contentType) {
        // 模拟热门内容获取逻辑
        return [
            {
                id: `trend_${contentType}_1`,
                title: `热门${contentType}`,
                type: contentType,
                relevanceScore: 0.7
            }
        ];
    }

    /**
     * 推荐去重
     */
    deduplicateRecommendations(recommendations) {
        const seen = new Set();
        return recommendations.filter(rec => {
            const key = `${rec.id}_${rec.type}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * 获取内容类型
     */
    getContentType(pageId) {
        const types = {
            'article': '文章',
            'video': '视频',
            'tutorial': '教程',
            'forum': '讨论',
            'analysis': '分析'
        };
        
        for (const [key, type] of Object.entries(types)) {
            if (pageId.includes(key)) return type;
        }
        
        return null;
    }

    /**
     * 获取行为统计摘要
     * @returns {object} 统计摘要
     */
    getSummary() {
        return {
            totalPageViews: this.behaviorData.pageViews.length,
            totalClicks: this.behaviorData.clicks.length,
            totalSearches: this.behaviorData.searches.length,
            totalTrades: this.behaviorData.trades.length,
            averageTimePerSession: this.calculateAverageSessionTime(),
            favoritePages: this.getFavoritePages(),
            behaviorConsistency: this.calculateOverallConsistency(),
            lastActivity: this.updatedAt
        };
    }

    /**
     * 计算平均会话时间
     */
    calculateAverageSessionTime() {
        if (this.behaviorData.pageViews.length === 0) return 0;
        
        const totalTime = this.behaviorData.pageViews.reduce((sum, view) => sum + view.duration, 0);
        return totalTime / this.behaviorData.pageViews.length;
    }

    /**
     * 获取最常访问的页面
     */
    getFavoritePages() {
        const pageCounts = {};
        this.behaviorData.pageViews.forEach(view => {
            pageCounts[view.pageId] = (pageCounts[view.pageId] || 0) + 1;
        });
        
        return Object.entries(pageCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([pageId, count]) => ({ pageId, count }));
    }

    /**
     * 计算整体一致性
     */
    calculateOverallConsistency() {
        const metrics = [
            this.analyzeInteractionFrequency().interactionConsistency,
            this.calculateSessionConsistency()
        ];
        
        return metrics.reduce((sum, metric) => sum + metric, 0) / metrics.length;
    }

    /**
     * 计算会话一致性
     */
    calculateSessionConsistency() {
        // 简化的会话一致性计算
        return 0.8; // 模拟值
    }
}

module.exports = UserBehavior;