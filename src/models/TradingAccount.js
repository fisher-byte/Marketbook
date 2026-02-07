/**
 * TradingAccount 模型 - 模拟交易账户管理
 * 负责管理用户的虚拟交易账户信息
 */

class TradingAccount {
    /**
     * 创建交易账户实例
     * @param {Object} options 账户配置选项
     */
    constructor(options = {}) {
        this.accountId = options.accountId || this.generateAccountId();
        this.userId = options.userId;
        this.accountName = options.accountName || '默认交易账户';
        this.currency = options.currency || 'CNY';
        this.initialBalance = options.initialBalance || 100000; // 默认初始资金10万
        this.currentBalance = options.currentBalance || this.initialBalance;
        this.availableBalance = options.availableBalance || this.initialBalance;
        this.margin = options.margin || 0; // 保证金
        this.leverage = options.leverage || 1; // 杠杆倍数
        this.riskLevel = options.riskLevel || 'medium'; // 风险等级: low/medium/high
        this.status = options.status || 'active'; // 账户状态: active/suspended/closed
        this.createdAt = options.createdAt || new Date();
        this.updatedAt = options.updatedAt || new Date();
        this.lastTradeTime = options.lastTradeTime || null;
        
        // 持仓信息
        this.positions = options.positions || [];
        
        // 交易统计
        this.totalTrades = options.totalTrades || 0;
        this.winningTrades = options.winningTrades || 0;
        this.losingTrades = options.losingTrades || 0;
        this.totalProfit = options.totalProfit || 0;
        this.totalLoss = options.totalLoss || 0;
        this.maxDrawdown = options.maxDrawdown || 0; // 最大回撤
        this.sharpeRatio = options.sharpeRatio || 0; // 夏普比率
    }
    
    /**
     * 生成唯一的账户ID
     * @returns {string} 账户ID
     */
    generateAccountId() {
        return 'TA_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 验证账户信息完整性
     * @returns {Object} 验证结果
     */
    validate() {
        const errors = [];
        
        if (!this.userId) {
            errors.push('用户ID不能为空');
        }
        
        if (this.initialBalance <= 0) {
            errors.push('初始资金必须大于0');
        }
        
        if (this.currentBalance < 0) {
            errors.push('当前余额不能为负数');
        }
        
        if (this.leverage < 1 || this.leverage > 100) {
            errors.push('杠杆倍数必须在1-100之间');
        }
        
        if (!['low', 'medium', 'high'].includes(this.riskLevel)) {
            errors.push('风险等级必须是low/medium/high');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * 更新账户余额
     * @param {number} amount 金额变化
     * @param {string} type 类型: deposit/withdraw/profit/loss
     * @returns {boolean} 更新是否成功
     */
    updateBalance(amount, type = 'profit') {
        if (typeof amount !== 'number' || !isFinite(amount)) {
            throw new Error('金额必须是有效数字');
        }
        
        const oldBalance = this.currentBalance;
        
        switch (type) {
            case 'deposit':
            case 'profit':
                this.currentBalance += amount;
                this.availableBalance += amount;
                break;
            case 'withdraw':
            case 'loss':
                if (this.availableBalance < amount) {
                    throw new Error('可用余额不足');
                }
                this.currentBalance -= amount;
                this.availableBalance -= amount;
                break;
            default:
                throw new Error('不支持的操作类型');
        }
        
        this.updatedAt = new Date();
        
        // 更新最大回撤
        const drawdown = (oldBalance - this.currentBalance) / oldBalance;
        if (drawdown > this.maxDrawdown) {
            this.maxDrawdown = drawdown;
        }
        
        return true;
    }
    
    /**
     * 计算账户统计信息
     */
    calculateStatistics() {
        const totalTrades = this.winningTrades + this.losingTrades;
        
        if (totalTrades > 0) {
            this.winRate = (this.winningTrades / totalTrades) * 100;
            this.averageProfit = this.totalProfit / this.winningTrades;
            this.averageLoss = this.totalLoss / this.losingTrades;
            this.profitFactor = this.totalProfit / (this.totalLoss || 1);
        }
        
        // 计算夏普比率（简化版）
        if (totalTrades > 1) {
            const avgReturn = (this.totalProfit - this.totalLoss) / totalTrades;
            // 简化计算，实际需要更复杂的风险调整计算
            this.sharpeRatio = avgReturn / (this.maxDrawdown || 1);
        }
    }
    
    /**
     * 获取账户摘要信息
     * @returns {Object} 账户摘要
     */
    getSummary() {
        this.calculateStatistics();
        
        return {
            accountId: this.accountId,
            accountName: this.accountName,
            currency: this.currency,
            currentBalance: this.currentBalance,
            availableBalance: this.availableBalance,
            totalProfit: this.totalProfit,
            totalLoss: this.totalLoss,
            netProfit: this.totalProfit - this.totalLoss,
            winRate: this.winRate || 0,
            totalTrades: this.totalTrades,
            maxDrawdown: this.maxDrawdown,
            sharpeRatio: this.sharpeRatio,
            status: this.status
        };
    }
    
    /**
     * 转换为JSON格式
     * @returns {Object} JSON对象
     */
    toJSON() {
        return {
            accountId: this.accountId,
            userId: this.userId,
            accountName: this.accountName,
            currency: this.currency,
            initialBalance: this.initialBalance,
            currentBalance: this.currentBalance,
            availableBalance: this.availableBalance,
            margin: this.margin,
            leverage: this.leverage,
            riskLevel: this.riskLevel,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastTradeTime: this.lastTradeTime,
            positions: this.positions,
            totalTrades: this.totalTrades,
            winningTrades: this.winningTrades,
            losingTrades: this.losingTrades,
            totalProfit: this.totalProfit,
            totalLoss: this.totalLoss,
            maxDrawdown: this.maxDrawdown,
            sharpeRatio: this.sharpeRatio
        };
    }
}

module.exports = TradingAccount;