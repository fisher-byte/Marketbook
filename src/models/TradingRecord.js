/**
 * 交易记录模型 - MarketBook 模拟盘
 * 负责记录用户的模拟交易操作和结果
 * 
 * @version 1.0.0
 * @author MarketBook Team
 */

class TradingRecord {
    constructor(recordData = {}) {
        // 交易基本信息
        this.id = recordData.id || null;
        this.userId = recordData.userId || null;
        this.symbol = recordData.symbol || ''; // 交易标的
        this.assetType = recordData.assetType || 'stock'; // stock, forex, crypto, etc.
        
        // 交易详情
        this.action = recordData.action || 'buy'; // buy, sell
        this.quantity = recordData.quantity || 0;
        this.price = recordData.price || 0;
        this.totalAmount = recordData.totalAmount || 0;
        
        // 时间信息
        this.timestamp = recordData.timestamp || new Date();
        this.executedAt = recordData.executedAt || new Date();
        
        // 交易状态
        this.status = recordData.status || 'executed'; // pending, executed, cancelled, failed
        this.orderType = recordData.orderType || 'market'; // market, limit, stop
        
        // 风险管理
        this.stopLoss = recordData.stopLoss || null;
        this.takeProfit = recordData.takeProfit || null;
        this.riskLevel = recordData.riskLevel || 'medium'; // low, medium, high
        
        // 交易结果
        this.profitLoss = recordData.profitLoss || 0;
        this.profitLossPercentage = recordData.profitLossPercentage || 0;
        this.holdingPeriod = recordData.holdingPeriod || 0; // 持仓天数
        
        // 分析数据
        this.strategyUsed = recordData.strategyUsed || '';
        this.tags = recordData.tags || [];
        this.notes = recordData.notes || '';
        
        // 性能指标
        this.performanceScore = recordData.performanceScore || 0;
        this.riskAdjustedReturn = recordData.riskAdjustedReturn || 0;
    }
    
    /**
     * 验证交易数据完整性
     */
    validate() {
        const errors = [];
        
        if (!this.userId) errors.push('用户ID不能为空');
        if (!this.symbol.trim()) errors.push('交易标的不能为空');
        if (this.quantity <= 0) errors.push('交易数量必须大于0');
        if (this.price <= 0) errors.push('交易价格必须大于0');
        if (!['buy', 'sell'].includes(this.action)) errors.push('交易操作类型无效');
        if (!['stock', 'forex', 'crypto', 'futures'].includes(this.assetType)) errors.push('资产类型无效');
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * 计算交易总金额
     */
    calculateTotalAmount() {
        this.totalAmount = this.quantity * this.price;
        return this.totalAmount;
    }
    
    /**
     * 计算盈亏
     * @param {number} currentPrice 当前价格
     */
    calculateProfitLoss(currentPrice) {
        if (this.action === 'buy') {
            this.profitLoss = (currentPrice - this.price) * this.quantity;
        } else {
            this.profitLoss = (this.price - currentPrice) * this.quantity;
        }
        
        this.profitLossPercentage = (this.profitLoss / this.totalAmount) * 100;
        return this.profitLoss;
    }
    
    /**
     * 计算持仓天数
     */
    calculateHoldingPeriod() {
        const now = new Date();
        const executedDate = new Date(this.executedAt);
        this.holdingPeriod = Math.floor((now - executedDate) / (1000 * 60 * 60 * 24));
        return this.holdingPeriod;
    }
    
    /**
     * 评估交易表现
     */
    evaluatePerformance() {
        // 基础评分（0-100）
        let score = 50;
        
        // 盈亏表现加分/减分
        if (this.profitLossPercentage > 10) score += 20;
        else if (this.profitLossPercentage > 5) score += 10;
        else if (this.profitLossPercentage < -10) score -= 20;
        else if (this.profitLossPercentage < -5) score -= 10;
        
        // 风险控制加分
        if (this.stopLoss && this.takeProfit) score += 15;
        else if (this.stopLoss || this.takeProfit) score += 5;
        
        // 持仓时间合理性加分
        if (this.holdingPeriod > 0 && this.holdingPeriod <= 30) score += 10;
        
        this.performanceScore = Math.max(0, Math.min(100, score));
        return this.performanceScore;
    }
    
    /**
     * 计算风险调整后收益
     */
    calculateRiskAdjustedReturn() {
        if (this.riskLevel === 'low') {
            this.riskAdjustedReturn = this.profitLossPercentage * 1.2;
        } else if (this.riskLevel === 'medium') {
            this.riskAdjustedReturn = this.profitLossPercentage;
        } else {
            this.riskAdjustedReturn = this.profitLossPercentage * 0.8;
        }
        return this.riskAdjustedReturn;
    }
    
    /**
     * 获取交易摘要信息
     */
    getSummary() {
        return {
            id: this.id,
            symbol: this.symbol,
            action: this.action,
            quantity: this.quantity,
            price: this.price,
            totalAmount: this.totalAmount,
            profitLoss: this.profitLoss,
            profitLossPercentage: this.profitLossPercentage,
            executedAt: this.executedAt,
            status: this.status,
            performanceScore: this.performanceScore
        };
    }
    
    /**
     * 获取详细交易分析
     */
    getDetailedAnalysis() {
        return {
            ...this.getSummary(),
            holdingPeriod: this.holdingPeriod,
            riskLevel: this.riskLevel,
            riskAdjustedReturn: this.riskAdjustedReturn,
            strategyUsed: this.strategyUsed,
            tags: this.tags,
            notes: this.notes,
            stopLoss: this.stopLoss,
            takeProfit: this.takeProfit,
            orderType: this.orderType
        };
    }
    
    /**
     * 更新交易状态
     * @param {string} newStatus 新状态
     * @param {string} notes 备注
     */
    updateStatus(newStatus, notes = '') {
        const validStatuses = ['pending', 'executed', 'cancelled', 'failed'];
        if (validStatuses.includes(newStatus)) {
            this.status = newStatus;
            if (notes) this.notes += `\n状态更新: ${notes}`;
            return true;
        }
        return false;
    }
    
    /**
     * 添加交易标签
     * @param {string} tag 标签
     */
    addTag(tag) {
        if (tag && !this.tags.includes(tag)) {
            this.tags.push(tag);
        }
    }
    
    /**
     * 添加交易备注
     * @param {string} note 备注
     */
    addNote(note) {
        if (note) {
            this.notes += this.notes ? `\n${note}` : note;
        }
    }
}

module.exports = TradingRecord;