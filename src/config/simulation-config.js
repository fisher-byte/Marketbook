/**
 * 模拟盘功能增强配置 - MarketBook 平台
 * 提供智能风险控制、批量操作和策略回测的配置参数
 * 
 * @version 2.0.0
 * @author MarketBook Team
 */

module.exports = {
    // ==================== 风险控制配置 ====================
    riskManagement: {
        // 基础风险参数
        maxPositionSize: 0.1,           // 单笔最大仓位比例（10%）
        maxDailyLoss: 0.05,             // 单日最大亏损比例（5%）
        stopLossPercent: 0.02,          // 基础止损比例（2%）
        takeProfitPercent: 0.05,        // 止盈比例（5%）
        trailingStopPercent: 0.03,      // 移动止损比例（3%）
        
        // 智能风险控制
        smartStopLoss: {
            enabled: true,
            volatilityMultiplier: 0.5,   // 波动率乘数
            timeBasedStop: true,        // 启用时间止损
            maxHoldingDays: 5           // 最大持仓天数
        },
        
        // 相关性限制
        correlationLimit: 0.7,          // 最大相关性系数
        sectorDiversification: true,    // 行业分散控制
        
        // 动态仓位调整
        dynamicPositionSizing: {
            enabled: true,
            volatilityWeight: 0.3,       // 波动率权重
            confidenceWeight: 0.7        // 信心权重
        }
    },
    
    // ==================== 批量操作配置 ====================
    batchOperations: {
        maxBatchSize: 10,               // 最大批量订单数
        processingDelay: 100,           // 处理延迟（毫秒）
        validationStrictness: 'strict', // 验证严格度：strict|moderate|lenient
        
        // 批量操作类型
        supportedTypes: [
            'market',                   // 市价单
            'limit',                    // 限价单
            'stop',                     // 止损单
            'stop_limit'                // 止损限价单
        ]
    },
    
    // ==================== 策略回测配置 ====================
    backtesting: {
        // 回测数据配置
        dataSources: {
            historicalBars: 100,        // 历史K线数量
            resolution: '1d',           // 数据分辨率：1d|1h|15m|5m|1m
            includeVolume: true,       // 包含成交量数据
            includeIndicators: true     // 包含技术指标
        },
        
        // 回测参数
        initialCapital: 100000,         // 初始资金
        commissionRate: 0.001,          // 手续费率（0.1%）
        slippageModel: 'fixed',         // 滑点模型：fixed|percentage|adaptive
        
        // 性能指标计算
        metrics: [
            'totalReturn',              // 总收益率
            'annualReturn',             // 年化收益率
            'sharpeRatio',              // 夏普比率
            'maxDrawdown',              // 最大回撤
            'winRate',                  // 胜率
            'profitFactor',             // 盈利因子
            'calmarRatio',              // 卡玛比率
            'sortinoRatio',             // 索提诺比率
            'var95'                     // 95%置信水平VaR
        ]
    },
    
    // ==================== 性能分析配置 ====================
    performanceAnalysis: {
        // 统计周期
        periods: {
            daily: true,                // 日度统计
            weekly: true,               // 周度统计
            monthly: true,              // 月度统计
            quarterly: true,            // 季度统计
            yearly: true                // 年度统计
        },
        
        // 高级分析指标
        advancedMetrics: {
            kellyCriterion: true,        // 凯利准则
            valueAtRisk: true,          // 风险价值
            mfeMaeAnalysis: true,       // MFE/MAE分析
            monteCarloSim: false        // 蒙特卡洛模拟（高级功能）
        },
        
        // 报告生成
        reportGeneration: {
            autoGenerate: true,         // 自动生成报告
            format: 'pdf',              // 报告格式：pdf|html|json
            retentionDays: 90          // 报告保留天数
        }
    },
    
    // ==================== 用户体验配置 ====================
    userExperience: {
        // 界面设置
        defaultView: 'dashboard',       // 默认视图：dashboard|portfolio|analysis
        chartTheme: 'light',           // 图表主题：light|dark
        
        // 通知设置
        notifications: {
            riskAlerts: true,           // 风险预警
            tradeConfirmations: true,   // 交易确认
            performanceUpdates: true,   // 业绩更新
            batchCompletion: true       // 批量完成通知
        },
        
        // 个性化功能
        personalization: {
            favoriteSymbols: true,     // 收藏品种
            customIndicators: true,     // 自定义指标
            templateStrategies: true    // 策略模板
        }
    },
    
    // ==================== 系统配置 ====================
    system: {
        // 性能优化
        cacheEnabled: true,             // 启用缓存
        cacheTTL: 300,                  // 缓存TTL（秒）
        maxConcurrentBacktests: 3,      // 最大并发回测数
        
        // 数据限制
        maxPositionsPerUser: 20,        // 用户最大持仓数
        maxOrdersPerDay: 100,          // 每日最大订单数
        maxHistoricalDataDays: 365      // 最大历史数据天数
    }
};