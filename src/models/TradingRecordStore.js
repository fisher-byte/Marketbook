/**
 * TradingRecordStore - 交易记录存储适配层
 * 为 TradingRecord 模型提供内存存储接口，支持持仓聚合
 * 
 * @module TradingRecordStore
 */

const memoryStore = require('../db/memoryStore');
const TradingRecord = require('./TradingRecord');

/**
 * 保存交易记录
 * @param {TradingRecord|Object} record 交易记录实例或数据对象
 * @returns {TradingRecord} 保存后的记录实例
 */
function save(record) {
    // 如果传入的是普通对象，先创建 TradingRecord 实例
    const recordInstance = record instanceof TradingRecord 
        ? record 
        : new TradingRecord(record);
    
    // 验证记录信息
    const validation = recordInstance.validate();
    if (!validation.isValid) {
        throw new Error(`交易记录验证失败: ${validation.errors.join(', ')}`);
    }
    
    // 生成ID（如果没有）
    if (!recordInstance.id) {
        recordInstance.id = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // 计算总金额
    recordInstance.calculateTotalAmount();
    
    // 转换为普通对象保存
    const recordData = {
        id: recordInstance.id,
        userId: recordInstance.userId,
        symbol: recordInstance.symbol,
        assetType: recordInstance.assetType,
        action: recordInstance.action,
        quantity: recordInstance.quantity,
        price: recordInstance.price,
        totalAmount: recordInstance.totalAmount,
        timestamp: recordInstance.timestamp,
        executedAt: recordInstance.executedAt,
        status: recordInstance.status,
        orderType: recordInstance.orderType,
        stopLoss: recordInstance.stopLoss,
        takeProfit: recordInstance.takeProfit,
        riskLevel: recordInstance.riskLevel,
        profitLoss: recordInstance.profitLoss,
        profitLossPercentage: recordInstance.profitLossPercentage,
        holdingPeriod: recordInstance.holdingPeriod,
        strategyUsed: recordInstance.strategyUsed,
        tags: recordInstance.tags,
        notes: recordInstance.notes,
        performanceScore: recordInstance.performanceScore,
        riskAdjustedReturn: recordInstance.riskAdjustedReturn
    };
    
    const saved = memoryStore.save('tradingRecords', recordData);
    return new TradingRecord(saved);
}

/**
 * 根据ID查找交易记录
 * @param {string} recordId 记录ID
 * @returns {TradingRecord|null} 交易记录实例或null
 */
function findById(recordId) {
    const recordData = memoryStore.findOne('tradingRecords', { id: recordId });
    if (!recordData) {
        return null;
    }
    return new TradingRecord(recordData);
}

/**
 * 查找用户的所有交易记录
 * @param {string} userId 用户ID
 * @param {Object} options 查询选项
 * @param {string} options.symbol 可选：标的代码
 * @param {string} options.action 可选：交易类型 (buy/sell)
 * @param {number} options.limit 可选：返回数量限制
 * @returns {Array<TradingRecord>} 交易记录列表
 */
function findByUserId(userId, options = {}) {
    const filter = { userId };
    
    if (options.symbol) {
        filter.symbol = options.symbol;
    }
    if (options.action) {
        filter.action = options.action;
    }
    
    let records = memoryStore.find('tradingRecords', filter);
    
    // 按时间倒序排序
    records.sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt));
    
    // 限制返回数量
    if (options.limit) {
        records = records.slice(0, options.limit);
    }
    
    return records.map(data => new TradingRecord(data));
}

/**
 * 计算用户的持仓情况（聚合未平仓交易）
 * @param {string} userId 用户ID
 * @returns {Array<Object>} 持仓列表，每个标的一条记录
 */
function calculatePositions(userId) {
    // 获取用户所有已执行的交易记录
    const allRecords = findByUserId(userId);
    const executedRecords = allRecords.filter(r => r.status === 'executed');
    
    // 按标的分组统计
    const positionMap = new Map();
    
    for (const record of executedRecords) {
        const { symbol } = record;
        
        if (!positionMap.has(symbol)) {
            positionMap.set(symbol, {
                symbol,
                quantity: 0,
                totalCost: 0,
                totalIncome: 0,
                trades: []
            });
        }
        
        const position = positionMap.get(symbol);
        
        if (record.action === 'buy') {
            // 买入：增加持仓
            position.quantity += record.quantity;
            position.totalCost += record.totalAmount;
        } else if (record.action === 'sell') {
            // 卖出：减少持仓
            position.quantity -= record.quantity;
            position.totalIncome += record.totalAmount;
        }
        
        position.trades.push({
            id: record.id,
            action: record.action,
            quantity: record.quantity,
            price: record.price,
            executedAt: record.executedAt
        });
    }
    
    // 转换为持仓数组，过滤掉已平仓的（quantity=0）
    const positions = [];
    
    for (const [symbol, position] of positionMap) {
        if (position.quantity > 0) {
            // 计算平均持仓成本
            const avgCost = position.totalCost / position.quantity;
            
            // 计算当前市值（模拟：使用最后买入价作为当前价）
            const lastTrade = position.trades[position.trades.length - 1];
            const currentPrice = lastTrade.price; // 实际应该从市场获取
            const currentValue = position.quantity * currentPrice;
            
            // 计算盈亏
            const profitLoss = currentValue - position.totalCost;
            const profitLossPercentage = (profitLoss / position.totalCost) * 100;
            
            positions.push({
                symbol,
                quantity: position.quantity,
                avgCost: parseFloat(avgCost.toFixed(2)),
                currentPrice: parseFloat(currentPrice.toFixed(2)),
                currentValue: parseFloat(currentValue.toFixed(2)),
                profitLoss: parseFloat(profitLoss.toFixed(2)),
                profitLossPercentage: parseFloat(profitLossPercentage.toFixed(2)),
                totalCost: parseFloat(position.totalCost.toFixed(2)),
                trades: position.trades
            });
        }
    }
    
    return positions;
}

/**
 * 统计用户交易记录数量
 * @param {string} userId 用户ID
 * @param {Object} filter 可选：过滤条件
 * @returns {number} 记录数量
 */
function countByUserId(userId, filter = {}) {
    const query = { userId, ...filter };
    return memoryStore.count('tradingRecords', query);
}

/**
 * 删除交易记录
 * @param {string} recordId 记录ID
 * @returns {boolean} 删除是否成功
 */
function deleteById(recordId) {
    return memoryStore.delete('tradingRecords', { id: recordId });
}

/**
 * 获取用户的交易统计信息
 * @param {string} userId 用户ID
 * @returns {Object} 统计信息
 */
function getStatistics(userId) {
    const records = findByUserId(userId);
    const executedRecords = records.filter(r => r.status === 'executed');
    
    const stats = {
        totalTrades: executedRecords.length,
        buyTrades: executedRecords.filter(r => r.action === 'buy').length,
        sellTrades: executedRecords.filter(r => r.action === 'sell').length,
        totalVolume: 0,
        avgTradeSize: 0,
        symbols: new Set()
    };
    
    for (const record of executedRecords) {
        stats.totalVolume += record.totalAmount;
        stats.symbols.add(record.symbol);
    }
    
    stats.avgTradeSize = stats.totalTrades > 0 
        ? stats.totalVolume / stats.totalTrades 
        : 0;
    
    stats.uniqueSymbols = stats.symbols.size;
    delete stats.symbols; // 移除Set对象
    
    return stats;
}

module.exports = {
    save,
    findById,
    findByUserId,
    calculatePositions,
    countByUserId,
    deleteById,
    getStatistics
};
