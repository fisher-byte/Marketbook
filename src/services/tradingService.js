/**
 * Trading Service - 交易业务逻辑服务
 * 处理交易执行、账户管理、风险控制等核心交易功能
 */

const TradingAccount = require('../models/TradingAccount');
const TradingRecord = require('../models/TradingRecord');

class TradingService {
  constructor() {
    this.marketData = new Map(); // 模拟市场数据缓存
  }

  /**
   * 获取用户交易账户信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 交易账户信息
   */
  async getUserAccount(userId) {
    try {
      const account = await TradingAccount.findByUserId(userId);
      if (!account) {
        // 如果账户不存在，创建默认账户
        return await this.createDefaultAccount(userId);
      }
      return account;
    } catch (error) {
      throw new Error(`获取交易账户失败: ${error.message}`);
    }
  }

  /**
   * 创建默认交易账户
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 新创建的账户
   */
  async createDefaultAccount(userId) {
    const defaultAccount = {
      userId,
      accountNumber: this.generateAccountNumber(),
      balance: 100000, // 默认初始资金10万
      availableBalance: 100000,
      margin: 0,
      leverage: 10,
      riskLevel: 'medium',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await TradingAccount.create(defaultAccount);
  }

  /**
   * 执行买入交易
   * @param {string} userId - 用户ID
   * @param {Object} tradeData - 交易数据
   * @returns {Promise<Object>} 交易结果
   */
  async executeBuyOrder(userId, tradeData) {
    const { symbol, quantity, price, orderType = 'market' } = tradeData;
    
    try {
      // 获取账户信息
      const account = await this.getUserAccount(userId);
      
      // 验证账户状态
      if (account.status !== 'active') {
        throw new Error('账户状态异常，无法交易');
      }

      // 计算交易金额
      const totalAmount = quantity * price;
      const marginRequired = totalAmount / account.leverage;

      // 验证资金充足性
      if (account.availableBalance < marginRequired) {
        throw new Error('保证金不足，无法执行交易');
      }

      // 执行交易逻辑
      const tradeRecord = await TradingRecord.create({
        userId,
        accountId: account.id,
        symbol,
        action: 'buy',
        quantity,
        price,
        totalAmount,
        marginUsed: marginRequired,
        orderType,
        status: 'executed',
        executedAt: new Date()
      });

      // 更新账户余额
      await TradingAccount.updateBalance(
        account.id,
        account.availableBalance - marginRequired,
        account.margin + marginRequired
      );

      return {
        success: true,
        tradeId: tradeRecord.id,
        message: '买入交易执行成功',
        tradeDetails: tradeRecord
      };

    } catch (error) {
      throw new Error(`买入交易失败: ${error.message}`);
    }
  }

  /**
   * 执行卖出交易
   * @param {string} userId - 用户ID
   * @param {Object} tradeData - 交易数据
   * @returns {Promise<Object>} 交易结果
   */
  async executeSellOrder(userId, tradeData) {
    const { symbol, quantity, price, orderType = 'market' } = tradeData;
    
    try {
      const account = await this.getUserAccount(userId);
      
      // 验证持仓
      const positions = await TradingRecord.getOpenPositions(userId, symbol);
      const totalPosition = positions.reduce((sum, pos) => sum + pos.quantity, 0);
      
      if (totalPosition < quantity) {
        throw new Error('持仓数量不足，无法卖出');
      }

      // 计算盈亏
      const totalAmount = quantity * price;
      const avgCost = this.calculateAverageCost(positions);
      const profitLoss = (price - avgCost) * quantity;

      const tradeRecord = await TradingRecord.create({
        userId,
        accountId: account.id,
        symbol,
        action: 'sell',
        quantity,
        price,
        totalAmount,
        profitLoss,
        orderType,
        status: 'executed',
        executedAt: new Date()
      });

      // 更新账户余额
      const newBalance = account.availableBalance + totalAmount + profitLoss;
      const newMargin = account.margin - (totalAmount / account.leverage);
      
      await TradingAccount.updateBalance(account.id, newBalance, newMargin);

      return {
        success: true,
        tradeId: tradeRecord.id,
        message: '卖出交易执行成功',
        profitLoss,
        tradeDetails: tradeRecord
      };

    } catch (error) {
      throw new Error(`卖出交易失败: ${error.message}`);
    }
  }

  /**
   * 获取用户持仓信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 持仓列表
   */
  async getUserPositions(userId) {
    try {
      const positions = await TradingRecord.getOpenPositions(userId);
      return positions.map(position => ({
        symbol: position.symbol,
        quantity: position.quantity,
        avgCost: this.calculateAverageCost([position]),
        currentPrice: this.getCurrentPrice(position.symbol),
        marketValue: position.quantity * this.getCurrentPrice(position.symbol),
        profitLoss: (this.getCurrentPrice(position.symbol) - position.price) * position.quantity
      }));
    } catch (error) {
      throw new Error(`获取持仓信息失败: ${error.message}`);
    }
  }

  /**
   * 获取交易历史
   * @param {string} userId - 用户ID
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} 交易历史
   */
  async getTradeHistory(userId, filters = {}) {
    try {
      return await TradingRecord.getTradeHistory(userId, filters);
    } catch (error) {
      throw new Error(`获取交易历史失败: ${error.message}`);
    }
  }

  /**
   * 风险控制检查
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 风险检查结果
   */
  async riskControlCheck(userId) {
    try {
      const account = await this.getUserAccount(userId);
      const positions = await this.getUserPositions(userId);
      
      const totalExposure = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
      const marginRatio = totalExposure / account.balance;
      
      return {
        marginRatio,
        riskLevel: marginRatio > 0.8 ? 'high' : marginRatio > 0.5 ? 'medium' : 'low',
        warning: marginRatio > 0.8 ? '保证金比例过高，建议减仓' : null
      };
    } catch (error) {
      throw new Error(`风险检查失败: ${error.message}`);
    }
  }

  /**
   * 生成账户号码
   * @returns {string} 账户号码
   */
  generateAccountNumber() {
    return 'MB' + Date.now().toString().slice(-8) + Math.random().toString().slice(2, 6);
  }

  /**
   * 计算平均成本
   * @param {Array} positions - 持仓列表
   * @returns {number} 平均成本
   */
  calculateAverageCost(positions) {
    if (positions.length === 0) return 0;
    const totalCost = positions.reduce((sum, pos) => sum + (pos.price * pos.quantity), 0);
    const totalQuantity = positions.reduce((sum, pos) => sum + pos.quantity, 0);
    return totalCost / totalQuantity;
  }

  /**
   * 获取当前价格（模拟）
   * @param {string} symbol - 交易品种
   * @returns {number} 当前价格
   */
  getCurrentPrice(symbol) {
    // 模拟价格数据
    const basePrices = {
      'AAPL': 150.25,
      'GOOGL': 2800.50,
      'TSLA': 850.75,
      'BTC': 45000.00,
      'ETH': 3000.00
    };
    
    return basePrices[symbol] || 100.00;
  }

  /**
   * 更新市场数据
   * @param {string} symbol - 交易品种
   * @param {number} price - 最新价格
   */
  updateMarketData(symbol, price) {
    this.marketData.set(symbol, {
      price,
      timestamp: new Date(),
      volume: Math.random() * 1000000
    });
  }
}

module.exports = new TradingService();