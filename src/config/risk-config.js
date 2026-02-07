/**
 * 风险控制配置文件 - MarketBook 模拟盘交易平台
 * 提供可配置的风险参数和交易限制设置
 * 
 * @version 1.1.0
 * @author MarketBook Team
 */

module.exports = {
    // ==================== 基础风险参数 ====================
    
    /**
     * 仓位管理参数
     */
    positionManagement: {
        // 单笔最大仓位比例（相对于初始资金）
        maxPositionSize: 0.1, // 10%
        
        // 单日最大亏损比例
        maxDailyLoss: 0.05, // 5%
        
        // 总账户最大回撤限制
        maxDrawdown: 0.15, // 15%
        
        // 单一品种最大持仓比例
        maxSinglePosition: 0.3, // 30%
    },
    
    /**
     * 止损止盈参数
     */
    stopLossTakeProfit: {
        // 默认止损比例
        defaultStopLoss: 0.02, // 2%
        
        // 默认止盈比例
        defaultTakeProfit: 0.05, // 5%
        
        // 动态止损：基于ATR（平均真实波幅）的止损
        atrBasedStopLoss: {
            enabled: true,
            atrMultiplier: 2.0, // ATR倍数
            lookbackPeriod: 14 // 回溯周期
        },
        
        // 追踪止损
        trailingStop: {
            enabled: true,
            activationProfit: 0.03, // 激活盈利比例 3%
            trailingDistance: 0.015 // 追踪距离 1.5%
        }
    },
    
    /**
     * 交易频率限制
     */
    tradingFrequency: {
        // 每分钟最大交易次数
        maxTradesPerMinute: 5,
        
        // 每小时最大交易次数
        maxTradesPerHour: 20,
        
        // 每日最大交易次数
        maxTradesPerDay: 50,
        
        // 最小持仓时间（分钟）
        minHoldingTime: 1
    },
    
    /**
     * 市场波动性参数
     */
    volatility: {
        // 高波动性阈值（标准差）
        highVolatilityThreshold: 0.03, // 3%
        
        // 极高波动性阈值
        extremeVolatilityThreshold: 0.08, // 8%
        
        // 波动性调整因子（高波动时降低仓位）
        volatilityAdjustment: 0.5
    },
    
    /**
     * 风险等级配置
     */
    riskLevels: {
        low: {
            maxPositionSize: 0.05, // 5%
            maxDailyLoss: 0.02, // 2%
            description: '保守型 - 适合初学者'
        },
        medium: {
            maxPositionSize: 0.1, // 10%
            maxDailyLoss: 0.05, // 5%
            description: '平衡型 - 适合有经验交易者'
        },
        high: {
            maxPositionSize: 0.15, // 15%
            maxDailyLoss: 0.08, // 8%
            description: '激进型 - 适合专业交易者'
        }
    },
    
    /**
     * 智能风险监控
     */
    smartMonitoring: {
        // 实时风险检查间隔（毫秒）
        checkInterval: 30000, // 30秒
        
        // 风险预警阈值
        warningThresholds: {
            drawdown: 0.08, // 回撤8%预警
            dailyLoss: 0.03, // 日亏损3%预警
            concentration: 0.25, // 持仓集中度25%预警
            volatility: 0.05 // 波动率5%预警
        },
        
        // 自动风险缓解措施
        autoMitigation: {
            enabled: true,
            actions: [
                '强制部分平仓',
                '调整止损点位',
                '限制新开仓',
                '发送风险提醒'
            ]
        }
    },
    
    /**
     * 交易品种特定风险参数
     */
    symbolSpecific: {
        // 股票类
        stocks: {
            maxLeverage: 1, // 无杠杆
            commissionRate: 0.001, // 0.1%
            minTradeSize: 100 // 最小交易金额
        },
        
        // 外汇类
        forex: {
            maxLeverage: 50,
            commissionRate: 0.0002, // 0.02%
            minTradeSize: 1000
        },
        
        // 加密货币
        crypto: {
            maxLeverage: 10,
            commissionRate: 0.002, // 0.2%
            minTradeSize: 10,
            volatilityMultiplier: 1.5 // 波动性乘数
        }
    },
    
    /**
     * 性能监控参数
     */
    performance: {
        // 关键指标阈值
        keyMetrics: {
            minWinRate: 0.4, // 最低胜率40%
            maxDrawdown: 0.1, // 最大回撤10%
            minSharpeRatio: 0.5, // 最低夏普比率0.5
            maxVolatility: 0.08 // 最大波动率8%
        },
        
        // 自动策略评估
        strategyEvaluation: {
            enabled: true,
            evaluationPeriod: 30, // 30天评估周期
            minTradesForEvaluation: 10 // 最少10笔交易才评估
        }
    },
    
    /**
     * 用户行为分析
     */
    userBehavior: {
        // 异常交易行为检测
        anomalyDetection: {
            enabled: true,
            // 短时间内大量交易
            rapidTrading: {
                threshold: 10, // 10分钟内
                maxTrades: 5 // 最多5笔交易
            },
            // 大额亏损后报复性交易
            revengeTrading: {
                threshold: -0.05, // 亏损5%后
                timeWindow: 3600000 // 1小时内
            },
            // 过度交易（频繁开平仓）
            overtrading: {
                dailyThreshold: 30, // 日交易30笔以上
                holdingTimeThreshold: 300000 // 持仓少于5分钟
            }
        },
        
        // 风险教育提示
        riskEducation: {
            enabled: true,
            tips: [
                '建议设置止损止盈点位',
                '避免过度集中投资',
                '合理控制仓位大小',
                '关注市场波动性变化',
                '定期评估交易策略效果'
            ],
            triggerConditions: [
                '新用户首次交易',
                '连续亏损3次以上',
                '单日亏损超过3%',
                '持仓集中度超过20%'
            ]
        }
    }
};

/**
 * 获取用户风险等级配置
 * @param {string} riskLevel 风险等级（low/medium/high）
 * @returns {object} 风险等级配置
 */
module.exports.getRiskLevelConfig = function(riskLevel) {
    return this.riskLevels[riskLevel] || this.riskLevels.medium;
};

/**
 * 根据市场波动性调整风险参数
 * @param {number} volatility 当前波动性
 * @param {object} baseConfig 基础配置
 * @returns {object} 调整后的配置
 */
module.exports.adjustForVolatility = function(volatility, baseConfig) {
    const adjustedConfig = { ...baseConfig };
    
    if (volatility > this.volatility.highVolatilityThreshold) {
        // 高波动性时降低风险参数
        adjustedConfig.maxPositionSize *= this.volatility.volatilityAdjustment;
        adjustedConfig.maxDailyLoss *= this.volatility.volatilityAdjustment;
    }
    
    return adjustedConfig;
};

/**
 * 验证交易参数是否符合风险限制
 * @param {object} tradeParams 交易参数
 * @param {object} currentState 当前状态
 * @returns {object} 验证结果
 */
module.exports.validateTradeRisk = function(tradeParams, currentState) {
    const errors = [];
    const warnings = [];
    
    // 检查仓位大小
    const positionSize = tradeParams.quantity * tradeParams.price / currentState.initialCapital;
    if (positionSize > this.positionManagement.maxPositionSize) {
        errors.push(`仓位大小超过限制: ${(positionSize * 100).toFixed(1)}% > ${(this.positionManagement.maxPositionSize * 100).toFixed(1)}%`);
    }
    
    // 检查单日亏损
    if (currentState.dailyLoss > this.positionManagement.maxDailyLoss * currentState.initialCapital) {
        warnings.push('今日已接近最大亏损限制，建议谨慎交易');
    }
    
    // 检查交易频率
    const recentTrades = currentState.recentTrades || [];
    const lastMinuteTrades = recentTrades.filter(t => 
        Date.now() - t.timestamp < 60000
    ).length;
    
    if (lastMinuteTrades >= this.tradingFrequency.maxTradesPerMinute) {
        warnings.push('交易频率过高，建议放缓交易节奏');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings,
        recommendations: this.getRiskRecommendations(tradeParams, currentState)
    };
};

/**
 * 获取风险建议
 * @param {object} tradeParams 交易参数
 * @param {object} currentState 当前状态
 * @returns {array} 建议列表
 */
module.exports.getRiskRecommendations = function(tradeParams, currentState) {
    const recommendations = [];
    
    // 根据波动性建议
    if (currentState.volatility > this.volatility.highVolatilityThreshold) {
        recommendations.push('市场波动性较高，建议减小仓位');
    }
    
    // 根据持仓集中度建议
    const concentration = this.calculateConcentration(currentState.positions);
    if (concentration > this.smartMonitoring.warningThresholds.concentration) {
        recommendations.push('持仓集中度较高，建议分散投资');
    }
    
    // 根据交易表现建议
    if (currentState.winRate < this.performance.keyMetrics.minWinRate) {
        recommendations.push('近期胜率较低，建议优化交易策略');
    }
    
    return recommendations;
};

/**
 * 计算持仓集中度
 * @param {array} positions 持仓列表
 * @returns {number} 集中度比例
 */
module.exports.calculateConcentration = function(positions) {
    if (positions.length === 0) return 0;
    
    const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const maxPositionValue = Math.max(...positions.map(pos => pos.currentValue));
    
    return maxPositionValue / totalValue;
};