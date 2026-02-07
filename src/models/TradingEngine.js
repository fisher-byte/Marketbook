/**
 * 模拟盘交易引擎 - MarketBook 平台
 * 负责处理模拟交易订单、资金管理、风险控制等核心功能
 * 
 * @version 1.0.0
 * @author MarketBook Team
 * @description 模拟交易核心引擎，支持多种交易品种和策略
 */

class TradingEngine {
    constructor(userId, initialCapital = 100000) {
        this.userId = userId;
        this.initialCapital = initialCapital;
        this.currentCapital = initialCapital;
        this.positions = new Map(); // 持仓记录
        this.orderHistory = []; // 订单历史
        this.transactionHistory = []; // 交易历史
        this.performanceMetrics = {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalProfitLoss: 0,
            maxDrawdown: 0,
            sharpeRatio: 0,
            winRate: 0,
            avgProfitPerTrade: 0,
            avgLossPerTrade: 0
        };
        
        // 风险控制参数
        this.riskParams = {
            maxPositionSize: 0.1, // 单笔最大仓位比例
            maxDailyLoss: 0.05, // 单日最大亏损比例
            stopLossPercent: 0.02, // 止损比例
            takeProfitPercent: 0.05, // 止盈比例
            trailingStopPercent: 0.03, // 移动止损比例
            volatilityThreshold: 0.08, // 波动率阈值
            maxConsecutiveLosses: 3 // 最大连续亏损次数
        };
        
        // 市场数据缓存
        this.marketData = new Map();
        
        // 引擎状态
        this.isRunning = false;
        this.lastUpdateTime = new Date();
    }

    // ==================== 核心交易方法 ====================

    /**
     * 执行买入订单
     * @param {string} symbol 交易品种
     * @param {number} quantity 数量
     * @param {number} price 价格
     * @param {string} orderType 订单类型（market/limit）
     * @returns {object} 订单执行结果
     */
    async executeBuyOrder(symbol, quantity, price, orderType = 'market') {
        if (!this.isRunning) {
            throw new Error('交易引擎未启动');
        }

        // 验证订单参数
        const validation = this.validateOrder(symbol, quantity, price, 'buy');
        if (!validation.isValid) {
            throw new Error(`订单验证失败: ${validation.errors.join(', ')}`);
        }

        // 计算订单总金额
        const totalCost = quantity * price;
        const commission = this.calculateCommission(totalCost);
        const totalAmount = totalCost + commission;

        // 检查资金是否充足
        if (totalAmount > this.currentCapital) {
            throw new Error('资金不足，无法执行买入订单');
        }

        // 执行订单
        const order = {
            id: this.generateOrderId(),
            userId: this.userId,
            symbol: symbol,
            type: 'buy',
            orderType: orderType,
            quantity: quantity,
            price: price,
            totalCost: totalCost,
            commission: commission,
            totalAmount: totalAmount,
            status: 'executed',
            timestamp: new Date(),
            executedPrice: price
        };

        // 更新资金和持仓
        this.currentCapital -= totalAmount;
        this.updatePosition(symbol, quantity, price, 'buy');
        
        // 记录订单历史
        this.orderHistory.push(order);
        
        // 记录交易历史
        this.recordTransaction(order);
        
        // 更新性能指标
        this.updatePerformanceMetrics();

        return {
            success: true,
            order: order,
            remainingCapital: this.currentCapital
        };
    }

    /**
     * 执行卖出订单
     * @param {string} symbol 交易品种
     * @param {number} quantity 数量
     * @param {number} price 价格
     * @param {string} orderType 订单类型（market/limit）
     * @returns {object} 订单执行结果
     */
    async executeSellOrder(symbol, quantity, price, orderType = 'market') {
        if (!this.isRunning) {
            throw new Error('交易引擎未启动');
        }

        // 验证订单参数
        const validation = this.validateOrder(symbol, quantity, price, 'sell');
        if (!validation.isValid) {
            throw new Error(`订单验证失败: ${validation.errors.join(', ')}`);
        }

        // 检查持仓是否足够
        const position = this.positions.get(symbol);
        if (!position || position.quantity < quantity) {
            throw new Error('持仓不足，无法执行卖出订单');
        }

        // 计算订单总金额
        const totalValue = quantity * price;
        const commission = this.calculateCommission(totalValue);
        const netAmount = totalValue - commission;

        // 执行订单
        const order = {
            id: this.generateOrderId(),
            userId: this.userId,
            symbol: symbol,
            type: 'sell',
            orderType: orderType,
            quantity: quantity,
            price: price,
            totalValue: totalValue,
            commission: commission,
            netAmount: netAmount,
            status: 'executed',
            timestamp: new Date(),
            executedPrice: price
        };

        // 更新资金和持仓
        this.currentCapital += netAmount;
        this.updatePosition(symbol, quantity, price, 'sell');
        
        // 记录订单历史
        this.orderHistory.push(order);
        
        // 记录交易历史
        this.recordTransaction(order);
        
        // 更新性能指标
        this.updatePerformanceMetrics();

        return {
            success: true,
            order: order,
            remainingCapital: this.currentCapital,
            profitLoss: this.calculateTradeProfitLoss(order)
        };
    }

    // ==================== 持仓管理 ====================

    /**
     * 更新持仓信息
     * @param {string} symbol 交易品种
     * @param {number} quantity 数量
     * @param {number} price 价格
     * @param {string} action 操作类型（buy/sell）
     */
    updatePosition(symbol, quantity, price, action) {
        let position = this.positions.get(symbol) || {
            symbol: symbol,
            quantity: 0,
            avgCost: 0,
            totalCost: 0,
            currentValue: 0,
            unrealizedPL: 0,
            realizedPL: 0
        };

        if (action === 'buy') {
            // 买入：更新平均成本
            const newTotalCost = position.totalCost + (quantity * price);
            const newQuantity = position.quantity + quantity;
            position.avgCost = newTotalCost / newQuantity;
            position.quantity = newQuantity;
            position.totalCost = newTotalCost;
        } else if (action === 'sell') {
            // 卖出：计算已实现盈亏
            const realizedPL = quantity * (price - position.avgCost);
            position.quantity -= quantity;
            position.totalCost = position.quantity * position.avgCost;
            position.realizedPL += realizedPL;
        }

        // 更新当前价值和未实现盈亏
        if (this.marketData.has(symbol)) {
            const currentPrice = this.marketData.get(symbol);
            position.currentValue = position.quantity * currentPrice;
            position.unrealizedPL = position.currentValue - position.totalCost;
        }

        this.positions.set(symbol, position);
        
        // 如果持仓为0，移除该持仓记录
        if (position.quantity === 0) {
            this.positions.delete(symbol);
        }
    }

    /**
     * 获取持仓概览
     * @returns {object} 持仓统计信息
     */
    getPortfolioOverview() {
        const positionsArray = Array.from(this.positions.values());
        
        const totalCost = positionsArray.reduce((sum, pos) => sum + pos.totalCost, 0);
        const totalValue = positionsArray.reduce((sum, pos) => sum + pos.currentValue, 0);
        const totalUnrealizedPL = positionsArray.reduce((sum, pos) => sum + pos.unrealizedPL, 0);
        const totalRealizedPL = positionsArray.reduce((sum, pos) => sum + pos.realizedPL, 0);

        return {
            totalPositions: positionsArray.length,
            totalCost: totalCost,
            totalValue: totalValue,
            totalUnrealizedPL: totalUnrealizedPL,
            totalRealizedPL: totalRealizedPL,
            totalPL: totalUnrealizedPL + totalRealizedPL,
            returnRate: ((totalUnrealizedPL + totalRealizedPL) / this.initialCapital) * 100,
            positions: positionsArray
        };
    }

    // ==================== 风险控制 ====================

    /**
     * 验证订单参数
     * @param {string} symbol 交易品种
     * @param {number} quantity 数量
     * @param {number} price 价格
     * @param {string} orderType 订单类型
     * @returns {object} 验证结果
     */
    validateOrder(symbol, quantity, price, orderType) {
        const errors = [];

        // 基础验证
        if (!symbol || typeof symbol !== 'string') {
            errors.push('交易品种不能为空且必须是字符串');
        }

        if (typeof quantity !== 'number' || quantity <= 0) {
            errors.push('数量必须是大于0的数字');
        }

        if (typeof price !== 'number' || price <= 0) {
            errors.push('价格必须是大于0的数字');
        }

        // 风险控制验证
        if (orderType === 'buy') {
            const totalCost = quantity * price;
            const maxPositionValue = this.initialCapital * this.riskParams.maxPositionSize;
            
            if (totalCost > maxPositionValue) {
                errors.push(`单笔订单金额超过最大仓位限制（${maxPositionValue}）`);
            }

            // 检查单日亏损限制
            const dailyPL = this.calculateDailyProfitLoss();
            const maxDailyLoss = this.initialCapital * this.riskParams.maxDailyLoss;
            if (dailyPL < -maxDailyLoss) {
                errors.push('已达到单日最大亏损限制，无法继续交易');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 计算单日盈亏
     * @returns {number} 当日盈亏金额
     */
    calculateDailyProfitLoss() {
        const today = new Date().toDateString();
        const todayTransactions = this.transactionHistory.filter(tx => 
            new Date(tx.timestamp).toDateString() === today
        );
        
        return todayTransactions.reduce((sum, tx) => sum + tx.profitLoss, 0);
    }

    /**
     * 自动风险检查
     * @returns {object} 风险检查结果
     */
    performRiskCheck() {
        const portfolio = this.getPortfolioOverview();
        const dailyPL = this.calculateDailyProfitLoss();
        
        const warnings = [];
        
        // 检查最大回撤
        if (portfolio.totalPL < -this.initialCapital * 0.1) {
            warnings.push('账户回撤超过10%，建议降低风险');
        }
        
        // 检查单日亏损
        const maxDailyLoss = this.initialCapital * this.riskParams.maxDailyLoss;
        if (dailyPL < -maxDailyLoss) {
            warnings.push('已达到单日最大亏损限制，建议暂停交易');
        }
        
        // 检查持仓集中度
        const positionsArray = Array.from(this.positions.values());
        if (positionsArray.length > 0) {
            const largestPosition = Math.max(...positionsArray.map(p => p.totalCost));
            if (largestPosition > this.initialCapital * 0.3) {
                warnings.push('单一持仓占比过高，建议分散投资');
            }
        }

        return {
            hasWarnings: warnings.length > 0,
            warnings: warnings,
            riskLevel: this.calculateRiskLevel(portfolio, dailyPL),
            suggestedActions: this.getRiskMitigationActions(warnings)
        };
    }

    // ==================== 性能指标计算 ====================

    /**
     * 更新性能指标
     */
    updatePerformanceMetrics() {
        const completedTrades = this.orderHistory.filter(order => 
            order.status === 'executed' && order.type === 'sell'
        );
        
        this.performanceMetrics.totalTrades = completedTrades.length;
        
        if (completedTrades.length > 0) {
            const profitableTrades = completedTrades.filter(trade => 
                this.calculateTradeProfitLoss(trade) > 0
            );
            
            this.performanceMetrics.winningTrades = profitableTrades.length;
            this.performanceMetrics.losingTrades = completedTrades.length - profitableTrades.length;
            this.performanceMetrics.winRate = (profitableTrades.length / completedTrades.length) * 100;
            
            this.performanceMetrics.totalProfitLoss = completedTrades.reduce((sum, trade) => 
                sum + this.calculateTradeProfitLoss(trade), 0
            );
            
            this.performanceMetrics.avgProfitPerTrade = profitableTrades.length > 0 ?
                profitableTrades.reduce((sum, trade) => sum + this.calculateTradeProfitLoss(trade), 0) / profitableTrades.length : 0;
            
            this.performanceMetrics.avgLossPerTrade = this.performanceMetrics.losingTrades > 0 ?
                (this.performanceMetrics.totalProfitLoss - 
                 profitableTrades.reduce((sum, trade) => sum + this.calculateTradeProfitLoss(trade), 0)) / 
                this.performanceMetrics.losingTrades : 0;
        }
        
        // 计算夏普比率（简化版）
        this.performanceMetrics.sharpeRatio = this.calculateSharpeRatio();
        
        // 计算最大回撤
        this.performanceMetrics.maxDrawdown = this.calculateMaxDrawdown();
    }

    /**
     * 计算单笔交易盈亏
     * @param {object} order 订单信息
     * @returns {number} 盈亏金额
     */
    calculateTradeProfitLoss(order) {
        if (order.type === 'sell') {
            const buyOrders = this.orderHistory.filter(buy => 
                buy.symbol === order.symbol && buy.type === 'buy' && buy.status === 'executed'
            );
            
            if (buyOrders.length > 0) {
                const avgBuyPrice = buyOrders.reduce((sum, buy) => sum + buy.price, 0) / buyOrders.length;
                return (order.price - avgBuyPrice) * order.quantity - order.commission;
            }
        }
        return 0;
    }

    // ==================== 工具方法 ====================

    /**
     * 生成唯一订单ID
     * @returns {string} 订单ID
     */
    generateOrderId() {
        return `ORDER_${this.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 计算交易佣金
     * @param {number} amount 交易金额
     * @returns {number} 佣金金额
     */
    calculateCommission(amount) {
        // 简化佣金计算：0.1%的交易佣金
        return amount * 0.001;
    }

    /**
     * 记录交易历史
     * @param {object} order 订单信息
     */
    recordTransaction(order) {
        const transaction = {
            id: `TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            orderId: order.id,
            userId: this.userId,
            symbol: order.symbol,
            type: order.type,
            quantity: order.quantity,
            price: order.price,
            amount: order.type === 'buy' ? order.totalAmount : order.netAmount,
            commission: order.commission,
            profitLoss: order.type === 'sell' ? this.calculateTradeProfitLoss(order) : 0,
            timestamp: order.timestamp
        };

        this.transactionHistory.push(transaction);
    }

    /**
     * 启动交易引擎
     */
    start() {
        this.isRunning = true;
        this.lastUpdateTime = new Date();
        console.log(`交易引擎已启动 - 用户: ${this.userId}`);
    }

    /**
     * 停止交易引擎
     */
    stop() {
        this.isRunning = false;
        console.log(`交易引擎已停止 - 用户: ${this.userId}`);
    }

    // ==================== 高级分析方法 ====================

    /**
     * 计算夏普比率（简化版）
     * @returns {number} 夏普比率
     */
    calculateSharpeRatio() {
        if (this.transactionHistory.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < this.transactionHistory.length; i++) {
            const prevValue = this.transactionHistory[i-1].amount;
            const currValue = this.transactionHistory[i].amount;
            returns.push((currValue - prevValue) / prevValue);
        }
        
        const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const stdDev = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length);
        
        return stdDev > 0 ? avgReturn / stdDev : 0;
    }

    /**
     * 计算最大回撤
     * @returns {number} 最大回撤百分比
     */
    calculateMaxDrawdown() {
        if (this.transactionHistory.length === 0) return 0;
        
        let peak = this.transactionHistory[0].amount;
        let maxDrawdown = 0;
        
        for (const tx of this.transactionHistory) {
            if (tx.amount > peak) {
                peak = tx.amount;
            }
            const drawdown = (peak - tx.amount) / peak;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
        
        return maxDrawdown * 100; // 转换为百分比
    }

    /**
     * 计算风险等级
     * @param {object} portfolio 投资组合
     * @param {number} dailyPL 当日盈亏
     * @returns {string} 风险等级
     */
    calculateRiskLevel(portfolio, dailyPL) {
        const drawdown = Math.abs(portfolio.totalPL / this.initialCapital);
        const volatility = this.calculateVolatility();
        
        if (drawdown > 0.15 || volatility > 0.1) return 'high';
        if (drawdown > 0.08 || volatility > 0.05) return 'medium';
        return 'low';
    }

    /**
     * 计算波动率
     * @returns {number} 波动率
     */
    calculateVolatility() {
        if (this.transactionHistory.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < this.transactionHistory.length; i++) {
            const prevValue = this.transactionHistory[i-1].amount;
            const currValue = this.transactionHistory[i].amount;
            returns.push((currValue - prevValue) / prevValue);
        }
        
        return Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / returns.length);
    }

    /**
     * 获取风险缓解建议
     * @param {array} warnings 警告信息
     * @returns {array} 建议行动
     */
    getRiskMitigationActions(warnings) {
        const actions = [];
        
        if (warnings.some(w => w.includes('回撤超过'))) {
            actions.push('考虑减少高风险仓位');
            actions.push('设置更严格的止损点');
        }
        
        if (warnings.some(w => w.includes('单日最大亏损'))) {
            actions.push('暂停今日交易');
            actions.push('重新评估交易策略');
        }
        
        if (warnings.some(w => w.includes('持仓占比过高'))) {
            actions.push('分散投资到不同品种');
            actions.push('降低单一品种的仓位比例');
        }
        
        return actions.length > 0 ? actions : ['当前风险可控，继续监控'];
    }

    // ==================== 数据导出方法 ====================

    /**
     * 获取交易报告
     * @returns {object} 完整交易报告
     */
    getTradingReport() {
        return {
            userInfo: {
                userId: this.userId,
                initialCapital: this.initialCapital,
                currentCapital: this.currentCapital,
                totalReturn: this.currentCapital - this.initialCapital,
                returnRate: ((this.currentCapital - this.initialCapital) / this.initialCapital) * 100
            },
            portfolio: this.getPortfolioOverview(),
            performance: this.performanceMetrics,
            riskAnalysis: this.performRiskCheck(),
            tradingHistory: {
                totalOrders: this.orderHistory.length,
                recentOrders: this.orderHistory.slice(-10),
                recentTransactions: this.transactionHistory.slice(-10)
            },
            summary: this.generateSummary()
        };
    }

    /**
     * 生成交易总结
     * @returns {object} 交易总结
     */
    generateSummary() {
        const portfolio = this.getPortfolioOverview();
        const riskCheck = this.performRiskCheck();
        
        return {
            overallPerformance: portfolio.totalPL >= 0 ? '盈利' : '亏损',
            riskAssessment: riskCheck.riskLevel,
            recommendation: this.getTradingRecommendation(),
            keyMetrics: {
                totalReturn: portfolio.totalPL,
                returnRate: portfolio.returnRate,
                winRate: this.performanceMetrics.winRate,
                sharpeRatio: this.performanceMetrics.sharpeRatio,
                maxDrawdown: this.performanceMetrics.maxDrawdown
            }
        };
    }

    /**
     * 获取交易建议
     * @returns {string} 交易建议
     */
    getTradingRecommendation() {
        const portfolio = this.getPortfolioOverview();
        const riskCheck = this.performRiskCheck();
        
        if (riskCheck.riskLevel === 'high') {
            return '高风险状态，建议立即降低仓位并重新评估策略';
        }
        
        if (portfolio.returnRate < -5) {
            return '当前亏损，建议暂停交易并分析原因';
        }
        
        if (this.performanceMetrics.winRate < 40) {
            return '胜率较低，建议优化交易策略';
        }
        
        return '当前表现良好，可继续执行现有策略';
    }
}

module.exports = TradingEngine;