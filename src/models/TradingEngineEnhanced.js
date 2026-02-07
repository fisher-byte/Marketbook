/**
 * 增强版模拟盘交易引擎 - MarketBook 平台
 * 在原有基础上增加高级功能：智能止损、策略回测、批量操作等
 * 
 * @version 2.0.0
 * @author MarketBook Team
 * @description 增强版模拟交易引擎，支持智能风控和策略分析
 */

class TradingEngineEnhanced {
    constructor(userId, initialCapital = 100000) {
        this.userId = userId;
        this.initialCapital = initialCapital;
        this.currentCapital = initialCapital;
        this.positions = new Map();
        this.orderHistory = [];
        this.transactionHistory = [];
        this.performanceMetrics = {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalProfitLoss: 0,
            maxDrawdown: 0,
            sharpeRatio: 0,
            winRate: 0,
            avgProfitPerTrade: 0,
            avgLossPerTrade: 0,
            profitFactor: 0,
            expectancy: 0
        };
        
        // 增强的风险控制参数
        this.riskParams = {
            maxPositionSize: 0.1,
            maxDailyLoss: 0.05,
            stopLossPercent: 0.02,
            takeProfitPercent: 0.05,
            trailingStopPercent: 0.03,
            volatilityThreshold: 0.08,
            maxConsecutiveLosses: 3,
            // 新增参数
            smartStopLoss: true, // 智能止损
            dynamicPositionSizing: true, // 动态仓位调整
            correlationLimit: 0.7, // 相关性限制
            sectorDiversification: true // 行业分散
        };
        
        this.marketData = new Map();
        this.isRunning = false;
        this.lastUpdateTime = new Date();
        
        // 新增功能：策略回测数据
        this.strategyData = {
            backtestResults: [],
            strategyPerformance: {},
            optimizationHistory: []
        };
        
        // 新增功能：批量操作队列
        this.batchQueue = [];
        this.batchProcessing = false;
        
        // 新增：性能监控
        this.performanceMonitor = {
            startTime: new Date(),
            uptime: 0,
            processedOrders: 0,
            errors: 0
        };
    }

    // ==================== 新增：智能止损功能 ====================

    /**
     * 智能止损检查
     * @param {string} symbol 交易品种
     * @param {number} currentPrice 当前价格
     * @returns {object} 止损建议
     */
    checkSmartStopLoss(symbol, currentPrice) {
        const position = this.positions.get(symbol);
        if (!position) return { action: 'none', reason: '无持仓' };
        
        const unrealizedPL = position.unrealizedPL;
        const unrealizedPLPercent = (unrealizedPL / position.totalCost) * 100;
        
        // 基于波动率的智能止损
        const volatility = this.calculateSymbolVolatility(symbol);
        const dynamicStopLoss = Math.max(
            this.riskParams.stopLossPercent,
            volatility * 0.5 // 止损随波动率调整
        );
        
        if (unrealizedPLPercent < -dynamicStopLoss * 100) {
            return {
                action: 'sell',
                reason: `智能止损触发：亏损超过${dynamicStopLoss * 100}%`,
                suggestedQuantity: position.quantity
            };
        }
        
        // 基于时间的止损（持仓超过一定时间仍亏损）
        const holdingDays = this.getHoldingDays(symbol);
        if (holdingDays > 5 && unrealizedPL < 0) {
            return {
                action: 'sell',
                reason: `时间止损：持仓${holdingDays}天仍亏损`,
                suggestedQuantity: position.quantity * 0.5 // 减半持仓
            };
        }
        
        // 新增：移动止损功能
        if (this.riskParams.trailingStopPercent > 0) {
            const trailingStopResult = this.checkTrailingStopLoss(symbol, currentPrice);
            if (trailingStopResult.action === 'sell') {
                return trailingStopResult;
            }
        }
        
        return { action: 'hold', reason: '符合持有条件' };
    }
    
    /**
     * 检查移动止损
     * @param {string} symbol 交易品种
     * @param {number} currentPrice 当前价格
     * @returns {object} 移动止损建议
     */
    checkTrailingStopLoss(symbol, currentPrice) {
        const position = this.positions.get(symbol);
        if (!position || !position.highestPrice) return { action: 'hold' };
        
        const trailingStopPrice = position.highestPrice * (1 - this.riskParams.trailingStopPercent);
        
        if (currentPrice <= trailingStopPrice) {
            return {
                action: 'sell',
                reason: `移动止损触发：价格从最高点${position.highestPrice}回落超过${this.riskParams.trailingStopPercent * 100}%`,
                suggestedQuantity: position.quantity
            };
        }
        
        return { action: 'hold' };
    }
    
    /**
     * 更新最高价格记录（用于移动止损）
     * @param {string} symbol 交易品种
     * @param {number} currentPrice 当前价格
     */
    updateHighestPrice(symbol, currentPrice) {
        const position = this.positions.get(symbol);
        if (position) {
            if (!position.highestPrice || currentPrice > position.highestPrice) {
                position.highestPrice = currentPrice;
                this.positions.set(symbol, position);
            }
        }
    }

    /**
     * 计算品种波动率
     * @param {string} symbol 交易品种
     * @returns {number} 波动率
     */
    calculateSymbolVolatility(symbol) {
        const symbolTransactions = this.transactionHistory.filter(
            tx => tx.symbol === symbol
        );
        
        if (symbolTransactions.length < 5) return 0.05; // 默认波动率
        
        const prices = symbolTransactions.map(tx => tx.price);
        const returns = [];
        
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
        
        const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        
        return Math.sqrt(variance);
    }

    /**
     * 获取持仓天数
     * @param {string} symbol 交易品种
     * @returns {number} 持仓天数
     */
    getHoldingDays(symbol) {
        const buyOrders = this.orderHistory.filter(
            order => order.symbol === symbol && order.type === 'buy' && order.status === 'executed'
        );
        
        if (buyOrders.length === 0) return 0;
        
        const firstBuyDate = new Date(Math.min(...buyOrders.map(order => order.timestamp.getTime())));
        const today = new Date();
        const diffTime = Math.abs(today - firstBuyDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // ==================== 新增：批量操作功能 ====================

    /**
     * 添加批量订单
     * @param {array} orders 订单数组
     * @returns {object} 批量操作结果
     */
    async addBatchOrders(orders) {
        if (this.batchProcessing) {
            throw new Error('批量处理正在进行中，请稍后再试');
        }
        
        const validationResults = orders.map(order => 
            this.validateOrder(order.symbol, order.quantity, order.price, order.type)
        );
        
        const invalidOrders = validationResults.filter(result => !result.isValid);
        if (invalidOrders.length > 0) {
            return {
                success: false,
                error: `部分订单验证失败：${invalidOrders.map(r => r.errors.join(', ')).join('; ')}`
            };
        }
        
        this.batchQueue.push(...orders);
        return {
            success: true,
            message: `已添加${orders.length}个订单到批量队列`,
            queueSize: this.batchQueue.length
        };
    }

    /**
     * 执行批量处理
     * @returns {object} 批量执行结果
     */
    async processBatchOrders() {
        if (this.batchProcessing) {
            throw new Error('批量处理正在进行中');
        }
        
        if (this.batchQueue.length === 0) {
            return { success: true, message: '批量队列为空' };
        }
        
        this.batchProcessing = true;
        const results = [];
        
        try {
            for (const order of this.batchQueue) {
                try {
                    let result;
                    if (order.type === 'buy') {
                        result = await this.executeBuyOrder(order.symbol, order.quantity, order.price, order.orderType);
                    } else {
                        result = await this.executeSellOrder(order.symbol, order.quantity, order.price, order.orderType);
                    }
                    results.push({
                        orderId: order.id || this.generateOrderId(),
                        success: true,
                        result: result
                    });
                } catch (error) {
                    results.push({
                        orderId: order.id || this.generateOrderId(),
                        success: false,
                        error: error.message
                    });
                }
                
                // 添加小延迟避免过快执行
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            this.batchQueue = [];
            return {
                success: true,
                processed: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                details: results
            };
            
        } finally {
            this.batchProcessing = false;
        }
    }

    // ==================== 新增：策略回测功能 ====================

    /**
     * 执行策略回测
     * @param {object} strategy 策略配置
     * @param {array} historicalData 历史数据
     * @returns {object} 回测结果
     */
    async backtestStrategy(strategy, historicalData) {
        const backtestId = `BACKTEST_${Date.now()}`;
        const results = {
            id: backtestId,
            strategy: strategy,
            startDate: historicalData[0]?.date,
            endDate: historicalData[historicalData.length - 1]?.date,
            trades: [],
            performance: {}
        };
        
        // 模拟交易执行
        let capital = this.initialCapital;
        let positions = new Map();
        
        for (let i = 0; i < historicalData.length; i++) {
            const data = historicalData[i];
            const signal = this.generateSignal(strategy, data, positions);
            
            if (signal.action !== 'hold') {
                const tradeResult = this.executeBacktestTrade(signal, data, capital, positions);
                if (tradeResult) {
                    results.trades.push(tradeResult);
                    capital = tradeResult.capitalAfter;
                }
            }
        }
        
        // 计算回测性能指标
        results.performance = this.calculateBacktestPerformance(results.trades);
        
        // 保存回测结果
        this.strategyData.backtestResults.push(results);
        
        return results;
    }

    /**
     * 生成交易信号
     * @param {object} strategy 策略
     * @param {object} data 市场数据
     * @param {Map} positions 持仓
     * @returns {object} 交易信号
     */
    generateSignal(strategy, data, positions) {
        // 简化版信号生成逻辑
        const position = positions.get(data.symbol);
        
        if (!position && data.price < data.movingAverage) {
            return { action: 'buy', symbol: data.symbol, quantity: 100 };
        }
        
        if (position && data.price > data.movingAverage * 1.05) {
            return { action: 'sell', symbol: data.symbol, quantity: position.quantity };
        }
        
        return { action: 'hold' };
    }

    /**
     * 执行回测交易
     * @param {object} signal 交易信号
     * @param {object} data 市场数据
     * @param {number} capital 当前资金
     * @param {Map} positions 持仓
     * @returns {object} 交易结果
     */
    executeBacktestTrade(signal, data, capital, positions) {
        const commission = data.price * signal.quantity * 0.001;
        
        if (signal.action === 'buy') {
            const cost = data.price * signal.quantity + commission;
            if (cost > capital) return null;
            
            positions.set(data.symbol, {
                quantity: signal.quantity,
                cost: data.price,
                timestamp: data.date
            });
            
            return {
                action: 'buy',
                symbol: data.symbol,
                quantity: signal.quantity,
                price: data.price,
                commission: commission,
                capitalBefore: capital,
                capitalAfter: capital - cost,
                timestamp: data.date
            };
        }
        
        if (signal.action === 'sell') {
            const position = positions.get(data.symbol);
            if (!position) return null;
            
            const revenue = data.price * signal.quantity - commission;
            const profit = (data.price - position.cost) * signal.quantity - commission;
            
            positions.delete(data.symbol);
            
            return {
                action: 'sell',
                symbol: data.symbol,
                quantity: signal.quantity,
                price: data.price,
                commission: commission,
                profit: profit,
                capitalBefore: capital,
                capitalAfter: capital + revenue,
                timestamp: data.date
            };
        }
        
        return null;
    }

    /**
     * 计算回测性能指标
     * @param {array} trades 交易记录
     * @returns {object} 性能指标
     */
    calculateBacktestPerformance(trades) {
        if (trades.length === 0) return {};
        
        const profitableTrades = trades.filter(t => t.profit > 0);
        const losingTrades = trades.filter(t => t.profit < 0);
        
        return {
            totalTrades: trades.length,
            winningTrades: profitableTrades.length,
            losingTrades: losingTrades.length,
            winRate: profitableTrades.length / trades.length,
            totalProfit: trades.reduce((sum, t) => sum + (t.profit || 0), 0),
            avgProfit: profitableTrades.length > 0 ? 
                profitableTrades.reduce((sum, t) => sum + t.profit, 0) / profitableTrades.length : 0,
            avgLoss: losingTrades.length > 0 ? 
                losingTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.length : 0,
            profitFactor: profitableTrades.reduce((sum, t) => sum + Math.abs(t.profit), 0) / 
                         losingTrades.reduce((sum, t) => sum + Math.abs(t.profit), 0)
        };
    }

    // ==================== 增强的性能分析方法 ====================

    /**
     * 计算期望值（新增指标）
     * @returns {number} 期望值
     */
    calculateExpectancy() {
        if (this.performanceMetrics.totalTrades === 0) return 0;
        
        const winRate = this.performanceMetrics.winRate / 100;
        const avgWin = this.performanceMetrics.avgProfitPerTrade;
        const avgLoss = this.performanceMetrics.avgLossPerTrade;
        
        return (winRate * avgWin) - ((1 - winRate) * Math.abs(avgLoss));
    }

    /**
     * 计算盈利因子（新增指标）
     * @returns {number} 盈利因子
     */
    calculateProfitFactor() {
        if (this.performanceMetrics.losingTrades === 0) return Infinity;
        
        const totalProfit = this.performanceMetrics.winningTrades * this.performanceMetrics.avgProfitPerTrade;
        const totalLoss = this.performanceMetrics.losingTrades * Math.abs(this.performanceMetrics.avgLossPerTrade);
        
        return totalProfit / totalLoss;
    }

    /**
     * 获取高级分析报告
     * @returns {object} 高级分析报告
     */
    getAdvancedAnalysis() {
        const basicReport = this.getTradingReport();
        
        return {
            ...basicReport,
            advancedMetrics: {
                expectancy: this.calculateExpectancy(),
                profitFactor: this.calculateProfitFactor(),
                kellyCriterion: this.calculateKellyCriterion(),
                var95: this.calculateValueAtRisk(0.95),
                maximumFavorableExcursion: this.calculateMFE(),
                maximumAdverseExcursion: this.calculateMAE()
            },
            strategyAnalysis: this.analyzeTradingStrategy(),
            riskAdjustedReturns: this.calculateRiskAdjustedReturns(),
            batchProcessing: {
                queueSize: this.batchQueue.length,
                isProcessing: this.batchProcessing
            }
        };
    }

    // ==================== 工具方法 ====================

    /**
     * 计算凯利准则
     * @returns {number} 凯利比例
     */
    calculateKellyCriterion() {
        const winRate = this.performanceMetrics.winRate / 100;
        const avgWin = this.performanceMetrics.avgProfitPerTrade;
        const avgLoss = Math.abs(this.performanceMetrics.avgLossPerTrade);
        
        if (avgLoss === 0) return 0;
        
        return winRate - ((1 - winRate) / (avgWin / avgLoss));
    }

    /**
     * 计算风险价值（VaR）
     * @param {number} confidence 置信水平
     * @returns {number} VaR值
     */
    calculateValueAtRisk(confidence = 0.95) {
        // 简化版VaR计算
        const returns = this.transactionHistory
            .filter(tx => tx.type === 'sell')
            .map(tx => tx.profitLoss / this.initialCapital);
        
        if (returns.length === 0) return 0;
        
        returns.sort((a, b) => a - b);
        const index = Math.floor(returns.length * (1 - confidence));
        
        return returns[index] * this.currentCapital;
    }

    /**
     * 分析交易策略
     * @returns {object} 策略分析
     */
    analyzeTradingStrategy() {
        const trades = this.orderHistory.filter(order => order.status === 'executed');
        
        return {
            tradeFrequency: trades.length / (this.getOperatingDays() || 1),
            holdingPeriod: this.calculateAverageHoldingPeriod(),
            concentration: this.calculatePortfolioConcentration(),
            style: this.detectTradingStyle()
        };
    }

    /**
     * 计算平均持仓周期
     * @returns {number} 平均持仓天数
     */
    calculateAverageHoldingPeriod() {
        const sellOrders = this.orderHistory.filter(order => 
            order.type === 'sell' && order.status === 'executed'
        );
        
        if (sellOrders.length === 0) return 0;
        
        let totalDays = 0;
        
        for (const sellOrder of sellOrders) {
            const buyOrders = this.orderHistory.filter(order => 
                order.symbol === sellOrder.symbol && 
                order.type === 'buy' && 
                order.status === 'executed' &&
                order.timestamp < sellOrder.timestamp
            );
            
            if (buyOrders.length > 0) {
                const lastBuy = buyOrders.reduce((latest, order) => 
                    order.timestamp > latest.timestamp ? order : latest
                );
                
                const diffTime = sellOrder.timestamp - lastBuy.timestamp;
                totalDays += diffTime / (1000 * 60 * 60 * 24);
            }
        }
        
        return totalDays / sellOrders.length;
    }

    // ==================== 性能监控方法 ====================

    /**
     * 获取引擎性能统计
     * @returns {object} 性能统计
     */
    getPerformanceStats() {
        const now = new Date();
        const uptime = (now - this.performanceMonitor.startTime) / 1000; // 秒
        
        return {
            uptime: uptime,
            processedOrders: this.performanceMonitor.processedOrders,
            errors: this.performanceMonitor.errors,
            ordersPerSecond: this.performanceMonitor.processedOrders / uptime,
            errorRate: this.performanceMonitor.errors / this.performanceMonitor.processedOrders
        };
    }

    /**
     * 记录订单处理
     */
    recordOrderProcessed() {
        this.performanceMonitor.processedOrders++;
    }

    /**
     * 记录错误
     */
    recordError() {
        this.performanceMonitor.errors++;
    }

    // 基础方法（需要与原有TradingEngine保持一致）
    validateOrder(symbol, quantity, price, type) {
        // 简化验证逻辑
        if (!symbol || quantity <= 0 || price <= 0) {
            return { isValid: false, errors: ['无效的订单参数'] };
        }
        return { isValid: true, errors: [] };
    }

    generateOrderId() {
        return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getOperatingDays() {
        return Math.ceil((new Date() - this.performanceMonitor.startTime) / (1000 * 60 * 60 * 24));
    }

    // 占位方法（需要在实际实现中完善）
    executeBuyOrder(symbol, quantity, price, orderType = 'market') {
        this.recordOrderProcessed();
        return {
            orderId: this.generateOrderId(),
            symbol: symbol,
            quantity: quantity,
            price: price,
            type: 'buy',
            status: 'executed',
            timestamp: new Date()
        };
    }

    executeSellOrder(symbol, quantity, price, orderType = 'market') {
        this.recordOrderProcessed();
        return {
            orderId: this.generateOrderId(),
            symbol: symbol,
            quantity: quantity,
            price: price,
            type: 'sell',
            status: 'executed',
            timestamp: new Date()
        };
    }

    getTradingReport() {
        return {
            userId: this.userId,
            currentCapital: this.currentCapital,
            totalPositions: this.positions.size,
            performance: this.performanceMetrics
        };
    }

    calculateMFE() { return 0; }
    calculateMAE() { return 0; }
    calculateRiskAdjustedReturns() { return {}; }
    calculatePortfolioConcentration() { return 0; }
    detectTradingStyle() { return 'unknown'; }
}

module.exports = TradingEngineEnhanced;