/**
 * 交易统计模块 - MarketBook 平台
 * 负责用户交易数据的统计分析和性能指标计算
 * 
 * @version 1.0.0
 * @author MarketBook Team
 * @description 用户交易行为分析、风险评估和绩效统计
 */

class TradingStats {
    constructor(userId, tradingData = {}) {
        this.userId = userId;
        
        // 交易数据
        this.totalTrades = tradingData.totalTrades || 0;
        this.winningTrades = tradingData.winningTrades || 0;
        this.losingTrades = tradingData.losingTrades || 0;
        this.totalVolume = tradingData.totalVolume || 0;
        this.averageTradeSize = tradingData.averageTradeSize || 0;
        
        // 时间统计
        this.firstTradeDate = tradingData.firstTradeDate || null;
        this.lastTradeDate = tradingData.lastTradeDate || null;
        this.tradingDays = tradingData.tradingDays || 0;
        
        // 风险指标
        this.maxDrawdown = tradingData.maxDrawdown || 0;
        this.sharpeRatio = tradingData.sharpeRatio || 0;
        this.volatility = tradingData.volatility || 0;
        
        // 绩效指标
        this.totalProfit = tradingData.totalProfit || 0;
        this.averageReturn = tradingData.averageReturn || 0;
        this.winRate = tradingData.winRate || 0;
        
        // 行为分析
        this.favoriteInstruments = tradingData.favoriteInstruments || [];
        this.tradingFrequency = tradingData.tradingFrequency || 'low';
        this.riskAppetite = tradingData.riskAppetite || 'conservative';
        
        // 缓存优化
        this._cache = {
            performanceSummary: null,
            riskAssessment: null,
            behaviorPatterns: null,
            lastCalculated: null
        };
    }

    // ==================== 基础统计方法 ====================

    /**
     * 计算胜率
     * @returns {number} 胜率百分比
     */
    calculateWinRate() {
        if (this.totalTrades === 0) return 0;
        return Math.round((this.winningTrades / this.totalTrades) * 100);
    }

    /**
     * 计算平均交易规模
     * @returns {number} 平均交易金额
     */
    calculateAverageTradeSize() {
        if (this.totalTrades === 0) return 0;
        return this.totalVolume / this.totalTrades;
    }

    /**
     * 计算交易频率等级
     * @returns {string} 频率等级
     */
    calculateTradingFrequency() {
        if (this.tradingDays === 0) return 'none';
        
        const tradesPerDay = this.totalTrades / this.tradingDays;
        
        if (tradesPerDay >= 5) return 'very_high';
        if (tradesPerDay >= 2) return 'high';
        if (tradesPerDay >= 0.5) return 'medium';
        return 'low';
    }

    /**
     * 计算风险偏好等级
     * @returns {string} 风险偏好
     */
    calculateRiskAppetite() {
        if (this.totalVolume === 0) return 'unknown';
        
        const riskScore = this.volatility * this.maxDrawdown;
        
        if (riskScore > 0.1) return 'aggressive';
        if (riskScore > 0.05) return 'moderate';
        return 'conservative';
    }

    // ==================== 绩效分析 ====================

    /**
     * 生成绩效摘要
     * @returns {object} 绩效数据
     */
    getPerformanceSummary() {
        return {
            totalTrades: this.totalTrades,
            winRate: this.calculateWinRate(),
            totalProfit: this.totalProfit,
            averageReturn: this.averageReturn,
            sharpeRatio: this.sharpeRatio,
            maxDrawdown: this.maxDrawdown,
            tradingDays: this.tradingDays,
            tradingFrequency: this.calculateTradingFrequency(),
            performanceScore: this.calculatePerformanceScore(),
            riskAdjustedReturn: this.calculateRiskAdjustedReturn(),
            consistencyScore: this.calculateConsistencyScore()
        };
    }

    /**
     * 计算综合绩效分数（0-100）
     * @returns {number} 绩效分数
     */
    calculatePerformanceScore() {
        let score = 50; // 基础分数
        
        // 胜率加分
        const winRate = this.calculateWinRate();
        if (winRate > 60) score += 20;
        else if (winRate > 40) score += 10;
        
        // 夏普比率加分
        if (this.sharpeRatio > 1.5) score += 15;
        else if (this.sharpeRatio > 0.5) score += 5;
        
        // 交易经验加分
        if (this.totalTrades > 100) score += 10;
        else if (this.totalTrades > 50) score += 5;
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * 计算风险调整后收益
     * @returns {number} 风险调整收益
     */
    calculateRiskAdjustedReturn() {
        if (this.volatility === 0) return this.averageReturn;
        return this.averageReturn / this.volatility;
    }

    /**
     * 计算交易一致性分数
     * @returns {number} 一致性分数
     */
    calculateConsistencyScore() {
        if (this.totalTrades < 10) return 0;
        
        // 基于胜率稳定性和交易频率计算
        const winRateStability = Math.min(this.winRate / 100, 1);
        const frequencyScore = Math.min(this.totalTrades / 50, 1);
        
        return Math.round((winRateStability * 0.6 + frequencyScore * 0.4) * 100);
    }

    // ==================== 风险评估 ====================

    /**
     * 生成风险评估报告
     * @returns {object} 风险数据
     */
    getRiskAssessment() {
        return {
            riskLevel: this.calculateRiskLevel(),
            maxDrawdown: this.maxDrawdown,
            volatility: this.volatility,
            riskAppetite: this.calculateRiskAppetite(),
            riskScore: this.calculateRiskScore(),
            drawdownRecovery: this.calculateDrawdownRecovery(),
            positionSizing: this.assessPositionSizing(),
            stopLossEffectiveness: this.assessStopLossEffectiveness()
        };
    }

    /**
     * 计算风险等级
     * @returns {string} 风险等级
     */
    calculateRiskLevel() {
        const riskScore = this.calculateRiskScore();
        
        if (riskScore >= 80) return 'very_high';
        if (riskScore >= 60) return 'high';
        if (riskScore >= 40) return 'medium';
        if (riskScore >= 20) return 'low';
        return 'very_low';
    }

    /**
     * 计算综合风险分数（0-100）
     * @returns {number} 风险分数
     */
    calculateRiskScore() {
        let score = 0;
        
        // 波动率贡献
        score += Math.min(this.volatility * 100, 30);
        
        // 最大回撤贡献
        score += Math.min(this.maxDrawdown * 100, 40);
        
        // 交易频率贡献
        const frequency = this.calculateTradingFrequency();
        if (frequency === 'very_high') score += 20;
        else if (frequency === 'high') score += 15;
        else if (frequency === 'medium') score += 10;
        
        return Math.min(100, score);
    }

    /**
     * 评估回撤恢复能力
     * @returns {string} 恢复能力等级
     */
    calculateDrawdownRecovery() {
        if (this.maxDrawdown === 0) return 'excellent';
        
        const recoveryRatio = this.totalProfit / this.maxDrawdown;
        
        if (recoveryRatio > 3) return 'excellent';
        if (recoveryRatio > 1.5) return 'good';
        if (recoveryRatio > 0.5) return 'fair';
        return 'poor';
    }

    /**
     * 评估仓位管理
     * @returns {string} 仓位管理等级
     */
    assessPositionSizing() {
        if (this.totalTrades === 0) return 'unknown';
        
        const avgSizeRatio = this.averageTradeSize / (this.totalVolume / this.totalTrades);
        
        if (avgSizeRatio > 0.8) return 'aggressive';
        if (avgSizeRatio > 0.5) return 'moderate';
        return 'conservative';
    }

    /**
     * 评估止损有效性
     * @returns {string} 止损有效性
     */
    assessStopLossEffectiveness() {
        if (this.losingTrades === 0) return 'excellent';
        
        const avgLossSize = this.totalVolume * this.maxDrawdown / this.losingTrades;
        const effectiveness = 1 - (avgLossSize / this.averageTradeSize);
        
        if (effectiveness > 0.8) return 'excellent';
        if (effectiveness > 0.6) return 'good';
        if (effectiveness > 0.4) return 'fair';
        return 'poor';
    }

    // ==================== 行为分析 ====================

    /**
     * 分析交易行为模式
     * @returns {object} 行为模式数据
     */
    analyzeBehaviorPatterns() {
        return {
            tradingStyle: this.identifyTradingStyle(),
            instrumentPreference: this.analyzeInstrumentPreference(),
            timePattern: this.analyzeTimePattern(),
            riskManagement: this.assessRiskManagement(),
            learningProgress: this.trackLearningProgress(),
            behavioralScore: this.calculateBehavioralScore()
        };
    }

    /**
     * 识别交易风格
     * @returns {string} 交易风格
     */
    identifyTradingStyle() {
        const frequency = this.calculateTradingFrequency();
        const riskAppetite = this.calculateRiskAppetite();
        
        if (frequency === 'very_high' && riskAppetite === 'aggressive') return 'day_trader';
        if (frequency === 'high' && riskAppetite === 'moderate') return 'swing_trader';
        if (frequency === 'low' && riskAppetite === 'conservative') return 'long_term_investor';
        return 'balanced_trader';
    }

    /**
     * 分析品种偏好
     * @returns {object} 偏好分析
     */
    analyzeInstrumentPreference() {
        return {
            topInstruments: this.favoriteInstruments.slice(0, 3),
            diversityScore: this.calculateDiversityScore(),
            specialization: this.assessSpecialization(),
            instrumentCount: this.favoriteInstruments.length
        };
    }

    /**
     * 计算品种多样性分数
     * @returns {number} 多样性分数
     */
    calculateDiversityScore() {
        const uniqueInstruments = new Set(this.favoriteInstruments).size;
        return Math.min(uniqueInstruments / 5 * 100, 100);
    }

    /**
     * 评估专业化程度
     * @returns {string} 专业化等级
     */
    assessSpecialization() {
        const uniqueCount = new Set(this.favoriteInstruments).size;
        
        if (uniqueCount === 1) return 'highly_specialized';
        if (uniqueCount <= 3) return 'specialized';
        if (uniqueCount <= 5) return 'diversified';
        return 'highly_diversified';
    }

    /**
     * 分析时间模式
     * @returns {object} 时间模式分析
     */
    analyzeTimePattern() {
        return {
            tradingHours: this.estimateTradingHours(),
            sessionPreference: this.identifySessionPreference(),
            consistency: this.assessTimeConsistency()
        };
    }

    /**
     * 估算交易时段
     * @returns {string} 主要交易时段
     */
    estimateTradingHours() {
        // 基于交易频率和风险偏好的简单估算
        const frequency = this.calculateTradingFrequency();
        
        if (frequency === 'very_high') return '全天交易';
        if (frequency === 'high') return '主要交易时段';
        return '灵活时段';
    }

    /**
     * 识别时段偏好
     * @returns {string} 时段偏好
     */
    identifySessionPreference() {
        const riskAppetite = this.calculateRiskAppetite();
        
        if (riskAppetite === 'aggressive') return '高波动时段';
        if (riskAppetite === 'moderate') return '标准交易时段';
        return '低波动时段';
    }

    /**
     * 评估时间一致性
     * @returns {string} 一致性等级
     */
    assessTimeConsistency() {
        const frequency = this.calculateTradingFrequency();
        
        if (frequency === 'very_high' || frequency === 'high') return 'consistent';
        if (frequency === 'medium') return 'moderate';
        return 'irregular';
    }

    /**
     * 评估风险管理
     * @returns {string} 风险管理等级
     */
    assessRiskManagement() {
        const riskScore = this.calculateRiskScore();
        const drawdownRecovery = this.calculateDrawdownRecovery();
        
        if (riskScore <= 20 && drawdownRecovery === 'excellent') return 'excellent';
        if (riskScore <= 40 && drawdownRecovery === 'good') return 'good';
        if (riskScore <= 60 && drawdownRecovery === 'fair') return 'fair';
        return 'needs_improvement';
    }

    /**
     * 跟踪学习进度
     * @returns {object} 学习进度
     */
    trackLearningProgress() {
        const experienceLevel = this.assessExperienceLevel();
        const improvementRate = this.calculateImprovementRate();
        
        return {
            experienceLevel: experienceLevel,
            improvementRate: improvementRate,
            learningStage: this.determineLearningStage(),
            skillGaps: this.identifySkillGaps()
        };
    }

    /**
     * 评估经验水平
     * @returns {string} 经验等级
     */
    assessExperienceLevel() {
        if (this.totalTrades >= 500) return 'expert';
        if (this.totalTrades >= 200) return 'advanced';
        if (this.totalTrades >= 50) return 'intermediate';
        if (this.totalTrades >= 10) return 'beginner';
        return 'novice';
    }

    /**
     * 计算改进率
     * @returns {number} 改进率百分比
     */
    calculateImprovementRate() {
        if (this.totalTrades < 20) return 0;
        
        // 基于胜率变化和风险控制的简单估算
        const baseWinRate = 50; // 假设基础胜率
        const improvement = Math.max(0, this.calculateWinRate() - baseWinRate);
        return Math.min(improvement / 50 * 100, 100);
    }

    /**
     * 确定学习阶段
     * @returns {string} 学习阶段
     */
    determineLearningStage() {
        const experience = this.assessExperienceLevel();
        const improvement = this.calculateImprovementRate();
        
        if (experience === 'expert' && improvement > 20) return 'mastery';
        if (experience === 'advanced' && improvement > 10) return 'proficiency';
        if (experience === 'intermediate') return 'development';
        return 'foundation';
    }

    /**
     * 识别技能差距
     * @returns {string[]} 需要改进的技能
     */
    identifySkillGaps() {
        const gaps = [];
        
        if (this.winRate < 40) gaps.push('交易策略');
        if (this.maxDrawdown > 0.2) gaps.push('风险控制');
        if (this.volatility > 0.15) gaps.push('仓位管理');
        if (this.tradingDays < 10) gaps.push('交易经验');
        
        return gaps;
    }

    /**
     * 计算行为分数
     * @returns {number} 行为分数
     */
    calculateBehavioralScore() {
        let score = 60; // 基础分数
        
        // 风险管理加分
        const riskManagement = this.assessRiskManagement();
        if (riskManagement === 'excellent') score += 20;
        else if (riskManagement === 'good') score += 10;
        
        // 一致性加分
        const consistency = this.assessTimeConsistency();
        if (consistency === 'consistent') score += 10;
        
        // 学习进度加分
        const learningStage = this.determineLearningStage();
        if (learningStage === 'mastery') score += 10;
        else if (learningStage === 'proficiency') score += 5;
        
        return Math.max(0, Math.min(100, score));
    }

    // ==================== 数据更新方法 ====================

    /**
     * 更新交易数据
     * @param {object} newTrade 新交易数据
     */
    updateWithTrade(newTrade) {
        this.totalTrades += 1;
        this.totalVolume += newTrade.volume || 0;
        
        if (newTrade.profit > 0) {
            this.winningTrades += 1;
        } else {
            this.losingTrades += 1;
        }
        
        this.totalProfit += newTrade.profit || 0;
        this.averageReturn = this.totalProfit / this.totalTrades;
        
        // 更新日期范围
        if (!this.firstTradeDate || newTrade.date < this.firstTradeDate) {
            this.firstTradeDate = newTrade.date;
        }
        if (!this.lastTradeDate || newTrade.date > this.lastTradeDate) {
            this.lastTradeDate = newTrade.date;
        }
        
        // 更新交易天数（简化计算）
        if (this.firstTradeDate && this.lastTradeDate) {
            const daysDiff = Math.ceil((new Date(this.lastTradeDate) - new Date(this.firstTradeDate)) / (1000 * 60 * 60 * 24));
            this.tradingDays = Math.max(this.tradingDays, daysDiff + 1);
        }
        
        // 清空缓存
        this._cache = {
            performanceSummary: null,
            riskAssessment: null,
            behaviorPatterns: null,
            lastCalculated: null
        };
    }

    /**
     * 批量更新交易数据
     * @param {array} trades 交易数据数组
     */
    updateWithTrades(trades) {
        trades.forEach(trade => this.updateWithTrade(trade));
    }
}

module.exports = TradingStats;