/**
 * 用户偏好智能推荐系统 - MarketBook 平台
 * 基于用户行为数据提供个性化推荐，提升用户体验
 * 
 * 优化重点：
 * 1. 个性化内容推荐
 * 2. 智能交易策略匹配
 * 3. 学习路径优化
 * 4. 社区互动增强
 * 
 * @version 1.0.0
 * @author MarketBook Team
 */

class UserPreferenceRecommender {
    constructor(userId) {
        this.userId = userId;
        this.userProfile = {};
        this.behaviorData = {
            pageViews: [],
            searchQueries: [],
            tradeActions: [],
            contentInteractions: [],
            communityEngagements: []
        };
        
        // 推荐引擎配置
        this.recommendationConfig = {
            maxRecommendations: 10,
            similarityThreshold: 0.7,
            recencyWeight: 0.3,
            frequencyWeight: 0.4,
            diversityWeight: 0.3,
            coldStartStrategy: 'popular'
        };
        
        // 缓存机制
        this.cache = {
            recommendations: null,
            lastUpdate: null,
            cacheDuration: 300000 // 5分钟
        };
        
        // 性能监控
        this.metrics = {
            recommendationCount: 0,
            hitRate: 0,
            processingTime: 0,
            userSatisfaction: 0
        };
    }
    
    // ==================== 用户行为记录 ====================
    
    /**
     * 记录页面浏览行为
     * @param {string} pageId 页面ID
     * @param {number} duration 停留时长（秒）
     * @param {string} category 页面分类
     */
    recordPageView(pageId, duration, category) {
        this.behaviorData.pageViews.push({
            pageId,
            duration,
            category,
            timestamp: new Date()
        });
        this._invalidateCache();
    }
    
    /**
     * 记录搜索行为
     * @param {string} query 搜索关键词
     * @param {array} results 搜索结果
     */
    recordSearchQuery(query, results) {
        this.behaviorData.searchQueries.push({
            query,
            results: results.map(r => r.id),
            timestamp: new Date()
        });
        this._invalidateCache();
    }
    
    /**
     * 记录交易行为
     * @param {string} symbol 交易品种
     * @param {string} action 交易动作
     * @param {number} amount 交易金额
     * @param {boolean} success 是否成功
     */
    recordTradeAction(symbol, action, amount, success) {
        this.behaviorData.tradeActions.push({
            symbol,
            action,
            amount,
            success,
            timestamp: new Date()
        });
        this._invalidateCache();
    }
    
    /**
     * 记录内容互动
     * @param {string} contentId 内容ID
     * @param {string} interactionType 互动类型（like, comment, share, read）
     * @param {number} rating 评分（1-5）
     */
    recordContentInteraction(contentId, interactionType, rating = null) {
        this.behaviorData.contentInteractions.push({
            contentId,
            interactionType,
            rating,
            timestamp: new Date()
        });
        this._invalidateCache();
    }
    
    /**
     * 记录社区互动
     * @param {string} communityId 社区ID
     * @param {string} activityType 活动类型
     * @param {number} engagementLevel 参与度（1-10）
     */
    recordCommunityEngagement(communityId, activityType, engagementLevel) {
        this.behaviorData.communityEngagements.push({
            communityId,
            activityType,
            engagementLevel,
            timestamp: new Date()
        });
        this._invalidateCache();
    }
    
    // ==================== 智能推荐引擎 ====================
    
    /**
     * 获取个性化推荐
     * @param {string} context 推荐上下文
     * @returns {array} 推荐列表
     */
    getRecommendations(context = 'general') {
        const startTime = Date.now();
        
        // 检查缓存
        if (this._isCacheValid()) {
            this.metrics.hitRate++;
            return this.cache.recommendations;
        }
        
        try {
            let recommendations = [];
            
            // 根据上下文选择推荐策略
            switch (context) {
                case 'trading':
                    recommendations = this._getTradingRecommendations();
                    break;
                case 'learning':
                    recommendations = this._getLearningRecommendations();
                    break;
                case 'community':
                    recommendations = this._getCommunityRecommendations();
                    break;
                default:
                    recommendations = this._getGeneralRecommendations();
            }
            
            // 应用多样性过滤
            recommendations = this._applyDiversityFilter(recommendations);
            
            // 限制数量
            recommendations = recommendations.slice(0, this.recommendationConfig.maxRecommendations);
            
            // 更新缓存
            this.cache.recommendations = recommendations;
            this.cache.lastUpdate = new Date();
            
            this.metrics.recommendationCount++;
            this.metrics.processingTime += Date.now() - startTime;
            
            return recommendations;
            
        } catch (error) {
            console.error('推荐生成失败:', error);
            return this._getFallbackRecommendations();
        }
    }
    
    /**
     * 获取交易相关推荐
     */
    _getTradingRecommendations() {
        const recommendations = [];
        
        // 基于交易历史推荐
        const recentTrades = this.behaviorData.tradeActions.slice(-20);
        const tradeSymbols = [...new Set(recentTrades.map(t => t.symbol))];
        
        // 推荐相似品种
        tradeSymbols.forEach(symbol => {
            const similarSymbols = this._findSimilarSymbols(symbol);
            recommendations.push(...similarSymbols.map(s => ({
                type: 'trading_symbol',
                id: s,
                score: this._calculateSymbolScore(symbol, s),
                reason: `与您交易的${symbol}相似的品种`
            })));
        });
        
        // 推荐交易策略
        const userStrategy = this._analyzeTradingStrategy();
        const matchingStrategies = this._findMatchingStrategies(userStrategy);
        recommendations.push(...matchingStrategies.map(s => ({
            type: 'trading_strategy',
            id: s.id,
            score: s.score,
            reason: `符合您交易风格的策略`
        })));
        
        return recommendations.sort((a, b) => b.score - a.score);
    }
    
    /**
     * 获取学习相关推荐
     */
    _getLearningRecommendations() {
        const recommendations = [];
        
        // 基于浏览历史推荐
        const recentViews = this.behaviorData.pageViews.slice(-30);
        const viewedCategories = this._getTopCategories(recentViews);
        
        viewedCategories.forEach(category => {
            const relatedContent = this._findRelatedContent(category);
            recommendations.push(...relatedContent.map(c => ({
                type: 'learning_content',
                id: c.id,
                score: c.relevance,
                reason: `与您关注的${category}相关的内容`
            })));
        });
        
        // 推荐学习路径
        const skillLevel = this._assessSkillLevel();
        const learningPaths = this._getLearningPaths(skillLevel);
        recommendations.push(...learningPaths.map(p => ({
            type: 'learning_path',
            id: p.id,
            score: p.matchScore,
            reason: `适合您当前水平的进阶路径`
        })));
        
        return recommendations.sort((a, b) => b.score - a.score);
    }
    
    /**
     * 获取社区相关推荐
     */
    _getCommunityRecommendations() {
        const recommendations = [];
        
        // 推荐相似用户
        const similarUsers = this._findSimilarUsers();
        recommendations.push(...similarUsers.map(u => ({
            type: 'community_user',
            id: u.id,
            score: u.similarity,
            reason: `与您交易风格相似的用户`
        })));
        
        // 推荐热门话题
        const trendingTopics = this._getTrendingTopics();
        recommendations.push(...trendingTopics.map(t => ({
            type: 'community_topic',
            id: t.id,
            score: t.popularity,
            reason: `当前社区热门讨论话题`
        })));
        
        // 推荐专家内容
        const expertContent = this._getExpertRecommendations();
        recommendations.push(...expertContent.map(e => ({
            type: 'expert_content',
            id: e.id,
            score: e.authority,
            reason: `行业专家分享的优质内容`
        })));
        
        return recommendations.sort((a, b) => b.score - a.score);
    }
    
    /**
     * 获取通用推荐
     */
    _getGeneralRecommendations() {
        return [
            ...this._getTradingRecommendations(),
            ...this._getLearningRecommendations(),
            ...this._getCommunityRecommendations()
        ].sort((a, b) => b.score - a.score);
    }
    
    // ==================== 推荐算法核心 ====================
    
    /**
     * 分析用户交易策略
     */
    _analyzeTradingStrategy() {
        const trades = this.behaviorData.tradeActions;
        if (trades.length === 0) return 'conservative';
        
        const successRate = trades.filter(t => t.success).length / trades.length;
        const avgAmount = trades.reduce((sum, t) => sum + t.amount, 0) / trades.length;
        const frequency = trades.length / 30; // 30天频率
        
        if (successRate > 0.7 && frequency > 5) return 'aggressive';
        if (successRate > 0.5 && frequency > 2) return 'moderate';
        return 'conservative';
    }
    
    /**
     * 评估用户技能水平
     */
    _assessSkillLevel() {
        const interactions = [
            ...this.behaviorData.pageViews,
            ...this.behaviorData.contentInteractions,
            ...this.behaviorData.tradeActions
        ];
        
        if (interactions.length < 10) return 'beginner';
        if (interactions.length < 50) return 'intermediate';
        return 'advanced';
    }
    
    /**
     * 应用多样性过滤
     */
    _applyDiversityFilter(recommendations) {
        const diversified = [];
        const typeCounts = {};
        
        recommendations.forEach(rec => {
            typeCounts[rec.type] = (typeCounts[rec.type] || 0) + 1;
            
            // 确保每种类型不超过最大限制
            if (typeCounts[rec.type] <= 3) {
                diversified.push(rec);
            }
        });
        
        return diversified;
    }
    
    // ==================== 辅助方法 ====================
    
    /**
     * 检查缓存有效性
     */
    _isCacheValid() {
        return this.cache.recommendations && 
               this.cache.lastUpdate && 
               (Date.now() - this.cache.lastUpdate) < this.cache.cacheDuration;
    }
    
    /**
     * 使缓存失效
     */
    _invalidateCache() {
        this.cache.recommendations = null;
        this.cache.lastUpdate = null;
    }
    
    /**
     * 获取备用推荐（冷启动策略）
     */
    _getFallbackRecommendations() {
        return [
            {
                type: 'popular_content',
                id: 'market_analysis_weekly',
                score: 0.8,
                reason: '本周最受欢迎的市场分析'
            },
            {
                type: 'beginner_guide',
                id: 'trading_basics',
                score: 0.7,
                reason: '新手交易入门指南'
            },
            {
                type: 'community_hot',
                id: 'trending_discussion',
                score: 0.6,
                reason: '热门社区讨论话题'
            }
        ];
    }
    
    // ==================== 占位方法（实际实现需要具体数据源） ====================
    
    _findSimilarSymbols(symbol) {
        // 实际实现需要市场数据API
        return ['AAPL', 'MSFT', 'GOOGL'].filter(s => s !== symbol);
    }
    
    _calculateSymbolScore(source, target) {
        // 基于相关性计算分数
        return Math.random() * 0.5 + 0.5; // 模拟分数
    }
    
    _findMatchingStrategies(userStrategy) {
        // 匹配交易策略
        return [
            { id: 'momentum_strategy', score: 0.8 },
            { id: 'value_investing', score: 0.6 }
        ];
    }
    
    _getTopCategories(views) {
        const categoryCounts = {};
        views.forEach(view => {
            categoryCounts[view.category] = (categoryCounts[view.category] || 0) + 1;
        });
        
        return Object.keys(categoryCounts)
            .sort((a, b) => categoryCounts[b] - categoryCounts[a])
            .slice(0, 3);
    }
    
    _findRelatedContent(category) {
        return [
            { id: `content_${category}_1`, relevance: 0.9 },
            { id: `content_${category}_2`, relevance: 0.7 }
        ];
    }
    
    _getLearningPaths(skillLevel) {
        return [
            { id: `path_${skillLevel}_advanced`, matchScore: 0.8 },
            { id: `path_${skillLevel}_practical`, matchScore: 0.7 }
        ];
    }
    
    _findSimilarUsers() {
        return [
            { id: 'user_123', similarity: 0.85 },
            { id: 'user_456', similarity: 0.75 }
        ];
    }
    
    _getTrendingTopics() {
        return [
            { id: 'topic_market_outlook', popularity: 0.9 },
            { id: 'topic_tech_analysis', popularity: 0.8 }
        ];
    }
    
    _getExpertRecommendations() {
        return [
            { id: 'expert_insight_1', authority: 0.95 },
            { id: 'expert_webinar_1', authority: 0.85 }
        ];
    }
    
    // ==================== 性能监控和报告 ====================
    
    /**
     * 获取推荐系统性能报告
     */
    getPerformanceReport() {
        return {
            totalRecommendations: this.metrics.recommendationCount,
            averageProcessingTime: this.metrics.processingTime / Math.max(1, this.metrics.recommendationCount),
            cacheHitRate: this.metrics.hitRate / Math.max(1, this.metrics.recommendationCount),
            userEngagement: this._calculateUserEngagement(),
            recommendationQuality: this._assessRecommendationQuality()
        };
    }
    
    /**
     * 计算用户参与度
     */
    _calculateUserEngagement() {
        const interactions = [
            ...this.behaviorData.contentInteractions,
            ...this.behaviorData.communityEngagements
        ];
        
        if (interactions.length === 0) return 0;
        
        const recentInteractions = interactions.filter(i => 
            (Date.now() - i.timestamp) < 7 * 24 * 60 * 60 * 1000 // 7天内
        );
        
        return recentInteractions.length / 7; // 日均互动数
    }
    
    /**
     * 评估推荐质量
     */
    _assessRecommendationQuality() {
        // 基于用户反馈和互动数据评估
        const positiveInteractions = this.behaviorData.contentInteractions.filter(i => 
            i.rating && i.rating >= 4
        ).length;
        
        const totalInteractions = this.behaviorData.contentInteractions.length;
        
        return totalInteractions > 0 ? positiveInteractions / totalInteractions : 0.5;
    }
    
    /**
     * 重置用户数据（用于测试或用户重置）
     */
    resetUserData() {
        this.behaviorData = {
            pageViews: [],
            searchQueries: [],
            tradeActions: [],
            contentInteractions: [],
            communityEngagements: []
        };
        this._invalidateCache();
    }
}

module.exports = UserPreferenceRecommender;