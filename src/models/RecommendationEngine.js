/**
 * 推荐引擎 - MarketBook平台
 * 基于用户行为和偏好提供个性化内容推荐
 * 
 * 功能特性：
 * - 协同过滤推荐
 * - 基于内容的推荐
 * - 实时行为分析
 * - 推荐结果缓存和优化
 * 
 * @version 1.0.0
 * @author MarketBook Team
 */

class RecommendationEngine {
    constructor() {
        // 推荐算法配置
        this.config = {
            collaborativeWeight: 0.6,    // 协同过滤权重
            contentWeight: 0.4,         // 内容推荐权重
            maxRecommendations: 10,      // 最大推荐数量
            cacheTTL: 3600000,           // 缓存有效期（1小时）
            similarityThreshold: 0.3     // 相似度阈值
        };
        
        // 缓存系统
        this.cache = new Map();
        this.cacheTimestamps = new Map();
        
        // 用户行为数据存储
        this.userInteractions = new Map();
        this.contentFeatures = new Map();
        
        // 性能监控
        this.stats = {
            totalRequests: 0,
            cacheHits: 0,
            processingTime: 0,
            recommendationsGenerated: 0
        };
    }

    /**
     * 记录用户行为
     * @param {string} userId 用户ID
     * @param {string} contentId 内容ID
     * @param {string} actionType 行为类型（view/like/share/comment）
     * @param {number} weight 行为权重（0-1）
     */
    recordInteraction(userId, contentId, actionType, weight = 0.1) {
        if (!this.userInteractions.has(userId)) {
            this.userInteractions.set(userId, new Map());
        }
        
        const userActions = this.userInteractions.get(userId);
        const actionKey = `${contentId}_${actionType}`;
        
        // 更新行为权重（考虑时间衰减）
        const currentWeight = userActions.get(actionKey) || 0;
        const newWeight = currentWeight + weight;
        
        userActions.set(actionKey, Math.min(newWeight, 1.0));
        
        // 清理过期缓存
        this.clearExpiredCache(userId);
    }

    /**
     * 添加内容特征
     * @param {string} contentId 内容ID
     * @param {object} features 内容特征
     */
    addContentFeatures(contentId, features) {
        this.contentFeatures.set(contentId, {
            ...features,
            timestamp: Date.now()
        });
    }

    /**
     * 获取个性化推荐
     * @param {string} userId 用户ID
     * @param {object} options 推荐选项
     * @returns {Array} 推荐内容列表
     */
    getRecommendations(userId, options = {}) {
        const startTime = Date.now();
        this.stats.totalRequests++;
        
        // 检查缓存
        const cacheKey = this.generateCacheKey(userId, options);
        if (this.isCacheValid(cacheKey)) {
            this.stats.cacheHits++;
            return this.cache.get(cacheKey);
        }
        
        // 生成推荐
        const recommendations = this.generateRecommendations(userId, options);
        
        // 缓存结果
        this.cache.set(cacheKey, recommendations);
        this.cacheTimestamps.set(cacheKey, Date.now());
        
        // 更新统计信息
        this.stats.processingTime += Date.now() - startTime;
        this.stats.recommendationsGenerated += recommendations.length;
        
        return recommendations;
    }

    /**
     * 生成推荐内容
     * @param {string} userId 用户ID
     * @param {object} options 推荐选项
     * @returns {Array} 推荐内容列表
     */
    generateRecommendations(userId, options) {
        const userInteractions = this.userInteractions.get(userId) || new Map();
        
        // 获取协同过滤推荐
        const collaborativeRecs = this.getCollaborativeRecommendations(userId, options);
        
        // 获取基于内容的推荐
        const contentRecs = this.getContentBasedRecommendations(userId, options);
        
        // 合并推荐结果
        const mergedRecs = this.mergeRecommendations(collaborativeRecs, contentRecs);
        
        // 过滤和排序
        return this.filterAndSortRecommendations(mergedRecs, options);
    }

    /**
     * 协同过滤推荐
     * @param {string} userId 用户ID
     * @param {object} options 推荐选项
     * @returns {Array} 协同过滤推荐列表
     */
    getCollaborativeRecommendations(userId, options) {
        const userInteractions = this.userInteractions.get(userId) || new Map();
        const similarUsers = this.findSimilarUsers(userId);
        
        const recommendations = [];
        
        // 基于相似用户的行为进行推荐
        similarUsers.forEach((similarity, similarUserId) => {
            const similarUserInteractions = this.userInteractions.get(similarUserId) || new Map();
            
            similarUserInteractions.forEach((weight, actionKey) => {
                const [contentId, actionType] = actionKey.split('_');
                
                // 如果当前用户没有该内容的行为记录
                if (!userInteractions.has(actionKey)) {
                    const score = similarity * weight;
                    
                    recommendations.push({
                        contentId,
                        score,
                        source: 'collaborative',
                        reason: `相似用户 ${similarUserId} 也${this.getActionDescription(actionType)}`
                    });
                }
            });
        });
        
        return recommendations;
    }

    /**
     * 基于内容的推荐
     * @param {string} userId 用户ID
     * @param {object} options 推荐选项
     * @returns {Array} 内容推荐列表
     */
    getContentBasedRecommendations(userId, options) {
        const userInteractions = this.userInteractions.get(userId) || new Map();
        const userPreferences = this.extractUserPreferences(userId);
        
        const recommendations = [];
        
        // 基于用户偏好匹配内容特征
        this.contentFeatures.forEach((features, contentId) => {
            // 如果用户没有该内容的行为记录
            const hasInteraction = Array.from(userInteractions.keys()).some(key => 
                key.startsWith(contentId)
            );
            
            if (!hasInteraction) {
                const similarity = this.calculateContentSimilarity(userPreferences, features);
                
                if (similarity >= this.config.similarityThreshold) {
                    recommendations.push({
                        contentId,
                        score: similarity,
                        source: 'content',
                        reason: `与您的兴趣偏好相似`
                    });
                }
            }
        });
        
        return recommendations;
    }

    /**
     * 查找相似用户
     * @param {string} userId 用户ID
     * @returns {Map} 相似用户及相似度
     */
    findSimilarUsers(userId) {
        const targetUserInteractions = this.userInteractions.get(userId) || new Map();
        const similarUsers = new Map();
        
        // 计算与其他用户的相似度
        this.userInteractions.forEach((otherUserInteractions, otherUserId) => {
            if (otherUserId !== userId) {
                const similarity = this.calculateUserSimilarity(
                    targetUserInteractions,
                    otherUserInteractions
                );
                
                if (similarity >= this.config.similarityThreshold) {
                    similarUsers.set(otherUserId, similarity);
                }
            }
        });
        
        return similarUsers;
    }

    /**
     * 计算用户相似度
     * @param {Map} userAInteractions 用户A的行为记录
     * @param {Map} userBInteractions 用户B的行为记录
     * @returns {number} 相似度分数（0-1）
     */
    calculateUserSimilarity(userAInteractions, userBInteractions) {
        let commonInteractions = 0;
        let totalInteractions = 0;
        
        userAInteractions.forEach((weightA, actionKey) => {
            const weightB = userBInteractions.get(actionKey) || 0;
            
            if (weightA > 0 && weightB > 0) {
                commonInteractions += Math.min(weightA, weightB);
            }
            
            totalInteractions += weightA;
        });
        
        return totalInteractions > 0 ? commonInteractions / totalInteractions : 0;
    }

    /**
     * 提取用户偏好
     * @param {string} userId 用户ID
     * @returns {object} 用户偏好特征
     */
    extractUserPreferences(userId) {
        const userInteractions = this.userInteractions.get(userId) || new Map();
        const preferences = {
            contentTypes: new Map(),
            tags: new Map(),
            authors: new Map()
        };
        
        userInteractions.forEach((weight, actionKey) => {
            const [contentId, actionType] = actionKey.split('_');
            const contentFeatures = this.contentFeatures.get(contentId);
            
            if (contentFeatures) {
                // 分析内容类型偏好
                if (contentFeatures.type) {
                    const currentWeight = preferences.contentTypes.get(contentFeatures.type) || 0;
                    preferences.contentTypes.set(contentFeatures.type, currentWeight + weight);
                }
                
                // 分析标签偏好
                if (contentFeatures.tags) {
                    contentFeatures.tags.forEach(tag => {
                        const currentWeight = preferences.tags.get(tag) || 0;
                        preferences.tags.set(tag, currentWeight + weight);
                    });
                }
                
                // 分析作者偏好
                if (contentFeatures.author) {
                    const currentWeight = preferences.authors.get(contentFeatures.author) || 0;
                    preferences.authors.set(contentFeatures.author, currentWeight + weight);
                }
            }
        });
        
        return preferences;
    }

    /**
     * 计算内容相似度
     * @param {object} userPreferences 用户偏好
     * @param {object} contentFeatures 内容特征
     * @returns {number} 相似度分数（0-1）
     */
    calculateContentSimilarity(userPreferences, contentFeatures) {
        let similarity = 0;
        let totalWeight = 0;
        
        // 内容类型匹配
        if (contentFeatures.type && userPreferences.contentTypes.has(contentFeatures.type)) {
            const typeWeight = userPreferences.contentTypes.get(contentFeatures.type);
            similarity += typeWeight * 0.4;
            totalWeight += 0.4;
        }
        
        // 标签匹配
        if (contentFeatures.tags) {
            let tagSimilarity = 0;
            contentFeatures.tags.forEach(tag => {
                if (userPreferences.tags.has(tag)) {
                    tagSimilarity += userPreferences.tags.get(tag);
                }
            });
            
            similarity += tagSimilarity * 0.3;
            totalWeight += 0.3;
        }
        
        // 作者匹配
        if (contentFeatures.author && userPreferences.authors.has(contentFeatures.author)) {
            const authorWeight = userPreferences.authors.get(contentFeatures.author);
            similarity += authorWeight * 0.3;
            totalWeight += 0.3;
        }
        
        return totalWeight > 0 ? similarity / totalWeight : 0;
    }

    /**
     * 合并推荐结果
     * @param {Array} collaborativeRecs 协同过滤推荐
     * @param {Array} contentRecs 内容推荐
     * @returns {Array} 合并后的推荐列表
     */
    mergeRecommendations(collaborativeRecs, contentRecs) {
        const merged = new Map();
        
        // 合并协同过滤推荐
        collaborativeRecs.forEach(rec => {
            const existingRec = merged.get(rec.contentId);
            const newScore = rec.score * this.config.collaborativeWeight;
            
            if (existingRec) {
                existingRec.score += newScore;
                existingRec.sources.push(rec.source);
            } else {
                merged.set(rec.contentId, {
                    contentId: rec.contentId,
                    score: newScore,
                    sources: [rec.source],
                    reasons: [rec.reason]
                });
            }
        });
        
        // 合并内容推荐
        contentRecs.forEach(rec => {
            const existingRec = merged.get(rec.contentId);
            const newScore = rec.score * this.config.contentWeight;
            
            if (existingRec) {
                existingRec.score += newScore;
                existingRec.sources.push(rec.source);
                existingRec.reasons.push(rec.reason);
            } else {
                merged.set(rec.contentId, {
                    contentId: rec.contentId,
                    score: newScore,
                    sources: [rec.source],
                    reasons: [rec.reason]
                });
            }
        });
        
        return Array.from(merged.values());
    }

    /**
     * 过滤和排序推荐结果
     * @param {Array} recommendations 推荐列表
     * @param {object} options 过滤选项
     * @returns {Array} 处理后的推荐列表
     */
    filterAndSortRecommendations(recommendations, options) {
        let filteredRecs = recommendations;
        
        // 应用过滤器
        if (options.contentType) {
            filteredRecs = filteredRecs.filter(rec => {
                const features = this.contentFeatures.get(rec.contentId);
                return features && features.type === options.contentType;
            });
        }
        
        // 按分数排序
        filteredRecs.sort((a, b) => b.score - a.score);
        
        // 限制数量
        return filteredRecs.slice(0, this.config.maxRecommendations);
    }

    /**
     * 生成缓存键
     * @param {string} userId 用户ID
     * @param {object} options 推荐选项
     * @returns {string} 缓存键
     */
    generateCacheKey(userId, options) {
        return `${userId}_${JSON.stringify(options)}`;
    }

    /**
     * 检查缓存是否有效
     * @param {string} cacheKey 缓存键
     * @returns {boolean} 是否有效
     */
    isCacheValid(cacheKey) {
        const timestamp = this.cacheTimestamps.get(cacheKey);
        if (!timestamp) return false;
        
        return Date.now() - timestamp < this.config.cacheTTL;
    }

    /**
     * 清理过期缓存
     * @param {string} userId 用户ID
     */
    clearExpiredCache(userId) {
        const currentTime = Date.now();
        
        this.cacheTimestamps.forEach((timestamp, key) => {
            if (key.startsWith(userId) && currentTime - timestamp >= this.config.cacheTTL) {
                this.cache.delete(key);
                this.cacheTimestamps.delete(key);
            }
        });
    }

    /**
     * 获取行为描述
     * @param {string} actionType 行为类型
     * @returns {string} 行为描述
     */
    getActionDescription(actionType) {
        const descriptions = {
            view: '浏览了',
            like: '点赞了',
            share: '分享了',
            comment: '评论了'
        };
        
        return descriptions[actionType] || '关注了';
    }

    /**
     * 获取引擎统计信息
     * @returns {object} 统计信息
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            userCount: this.userInteractions.size,
            contentCount: this.contentFeatures.size,
            cacheHitRate: this.stats.totalRequests > 0 ? 
                (this.stats.cacheHits / this.stats.totalRequests).toFixed(2) : 0,
            avgProcessingTime: this.stats.totalRequests > 0 ?
                (this.stats.processingTime / this.stats.totalRequests).toFixed(2) : 0
        };
    }

    /**
     * 重置引擎状态
     */
    reset() {
        this.cache.clear();
        this.cacheTimestamps.clear();
        this.userInteractions.clear();
        this.contentFeatures.clear();
        
        this.stats = {
            totalRequests: 0,
            cacheHits: 0,
            processingTime: 0,
            recommendationsGenerated: 0
        };
    }
}

module.exports = RecommendationEngine;