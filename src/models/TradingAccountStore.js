/**
 * TradingAccountStore - 交易账户存储适配层
 * 为 TradingAccount 模型提供内存存储接口
 * 
 * @module TradingAccountStore
 */

const memoryStore = require('../db/memoryStore');
const TradingAccount = require('./TradingAccount');

/**
 * 根据用户ID查找交易账户
 * @param {string} userId 用户ID
 * @returns {TradingAccount|null} 交易账户实例或null
 */
function findByUserId(userId) {
    const accountData = memoryStore.findOne('tradingAccounts', { userId });
    if (!accountData) {
        return null;
    }
    return new TradingAccount(accountData);
}

/**
 * 根据账户ID查找交易账户
 * @param {string} accountId 账户ID
 * @returns {TradingAccount|null} 交易账户实例或null
 */
function findById(accountId) {
    const accountData = memoryStore.findOne('tradingAccounts', { accountId });
    if (!accountData) {
        return null;
    }
    return new TradingAccount(accountData);
}

/**
 * 查找用户的所有交易账户
 * @param {string} userId 用户ID
 * @returns {Array<TradingAccount>} 交易账户列表
 */
function findAllByUserId(userId) {
    const accounts = memoryStore.find('tradingAccounts', { userId });
    return accounts.map(data => new TradingAccount(data));
}

/**
 * 保存交易账户
 * @param {TradingAccount} account 交易账户实例
 * @returns {TradingAccount} 保存后的账户实例
 */
function save(account) {
    // 验证账户信息
    const validation = account.validate();
    if (!validation.isValid) {
        throw new Error(`账户信息验证失败: ${validation.errors.join(', ')}`);
    }
    
    // 转换为普通对象保存
    const accountData = {
        accountId: account.accountId,
        userId: account.userId,
        accountName: account.accountName,
        currency: account.currency,
        initialBalance: account.initialBalance,
        currentBalance: account.currentBalance,
        availableBalance: account.availableBalance,
        margin: account.margin,
        leverage: account.leverage,
        riskLevel: account.riskLevel,
        status: account.status,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        lastTradeTime: account.lastTradeTime,
        positions: account.positions,
        totalTrades: account.totalTrades,
        winningTrades: account.winningTrades,
        losingTrades: account.losingTrades,
        totalProfit: account.totalProfit,
        totalLoss: account.totalLoss,
        maxDrawdown: account.maxDrawdown,
        sharpeRatio: account.sharpeRatio
    };
    
    const saved = memoryStore.save('tradingAccounts', accountData);
    return new TradingAccount(saved);
}

/**
 * 删除交易账户
 * @param {string} accountId 账户ID
 * @returns {boolean} 删除是否成功
 */
function deleteById(accountId) {
    return memoryStore.delete('tradingAccounts', { accountId });
}

/**
 * 获取所有交易账户（用于管理）
 * @returns {Array<TradingAccount>} 所有账户列表
 */
function findAll() {
    const accounts = memoryStore.find('tradingAccounts', {});
    return accounts.map(data => new TradingAccount(data));
}

/**
 * 统计用户的账户数量
 * @param {string} userId 用户ID
 * @returns {number} 账户数量
 */
function countByUserId(userId) {
    return memoryStore.count('tradingAccounts', { userId });
}

module.exports = {
    findByUserId,
    findById,
    findAllByUserId,
    save,
    deleteById,
    findAll,
    countByUserId
};
