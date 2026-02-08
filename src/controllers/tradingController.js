/**
 * 交易控制器 - 处理交易执行和账户管理
 * @fileoverview 提供交易相关的API接口，包括下单、查询、账户管理等
 * @version 2.0.0 - 增强错误处理和输入验证
 */

const TradingAccount = require('../models/TradingAccount');
const TradingAccountStore = require('../models/TradingAccountStore');
const TradingRecord = require('../models/TradingRecord');
const TradingRecordStore = require('../models/TradingRecordStore');
const marketDataService = require('../services/marketDataService');
const { createError, validate, asyncHandler } = require('../middlewares/errorHandler');
const { errorHandler } = require('../utils/ErrorHandler');

/**
 * 获取用户交易账户信息（通过accountId）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getAccountInfo = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { accountId } = req.params;
    
    // 验证参数
    validate.required({ accountId }, ['accountId']);
    
    const account = TradingAccountStore.findById(accountId);
    
    if (!account) {
        throw createError.notFound('交易账户');
    }

    // 验证账户所有权
    if (account.userId !== userId) {
        throw createError.forbidden('无权访问该交易账户');
    }

    errorHandler.recordPerformance('databaseTime', 5); // 模拟数据库查询时间
    
    res.status(200).json({
        success: true,
        data: account
    });
});

/**
 * 获取用户所有交易账户
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getUserAccounts = asyncHandler(async (req, res) => {
    const userId = req.userId;
    
    const accounts = TradingAccountStore.findByUserId(userId);
    
    res.status(200).json({
        success: true,
        data: accounts ? [accounts] : []
    });
});

/**
 * 创建交易账户
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const createAccount = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { initialBalance = 100000 } = req.body;
    
    // 验证初始余额范围
    const validatedBalance = validate.number(initialBalance, '初始余额', { 
        min: 10000, 
        max: 10000000 
    });

    // 检查是否已存在账户
    const existingAccount = TradingAccountStore.findByUserId(userId);
    if (existingAccount) {
        throw createError.conflict('交易账户已存在，每个用户只能创建一个模拟账户');
    }

    const account = new TradingAccount({
        userId,
        initialBalance: validatedBalance,
        currentBalance: validatedBalance,
        availableBalance: validatedBalance,
        status: 'active'
    });

    TradingAccountStore.save(account);

    errorHandler.recordPerformance('databaseTime', 8);

    res.status(201).json({
        success: true,
        message: '交易账户创建成功',
        data: account
    });
});

/**
 * 执行交易（买入/卖出）- 通用方法
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const executeTrade = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { accountId, symbol, quantity, price, type = 'buy' } = req.body;
    
    // 验证参数
    validate.required({ accountId, symbol, quantity }, ['accountId', 'symbol', 'quantity']);
    const validQuantity = validate.number(quantity, '交易数量', { min: 1, max: 100000 });
    validate.enum(type, '交易类型', ['buy', 'sell']);

    // 获取并验证交易账户
    const account = TradingAccountStore.findById(accountId);
    if (!account) {
        throw createError.notFound('交易账户');
    }

    if (account.userId !== userId) {
        throw createError.forbidden('无权访问该交易账户');
    }

    if (account.status !== 'active') {
        throw createError.forbidden('交易账户状态异常，无法执行交易');
    }

    // 获取实时行情
    const quoteData = marketDataService.getQuote(symbol);
    if (!quoteData) {
        throw createError.badRequest(`无法获取 ${symbol} 的实时行情，股票代码可能不存在`);
    }
    
    const tradePrice = price || quoteData.currentPrice;
    const tradeAmount = validQuantity * tradePrice;
    
    // 买入时验证资金充足
    if (type === 'buy' && account.availableBalance < tradeAmount) {
        throw createError.badRequest(
            `可用资金不足。需要 $${tradeAmount.toFixed(2)}，可用 $${account.availableBalance.toFixed(2)}`
        );
    }

    // 卖出时验证持仓充足
    if (type === 'sell') {
        const positions = TradingRecordStore.getPositions(userId, accountId);
        const position = positions.find(p => p.symbol === symbol);
        
        if (!position || position.quantity < validQuantity) {
            throw createError.badRequest(
                `持仓数量不足。需要 ${validQuantity} 股，持有 ${position?.quantity || 0} 股`
            );
        }
    }

    // 创建交易记录
    const tradeRecord = new TradingRecord({
        userId,
        symbol,
        action: type,
        quantity: validQuantity,
        price: tradePrice,
        totalAmount: tradeAmount,
        status: 'executed',
        executedAt: new Date(),
        orderType: 'market'
    });

    const savedRecord = TradingRecordStore.save(tradeRecord);

    // 更新账户余额
    if (type === 'buy') {
        account.currentBalance -= tradeAmount;
        account.availableBalance -= tradeAmount;
    } else {
        account.currentBalance += tradeAmount;
        account.availableBalance += tradeAmount;
    }

    TradingAccountStore.save(account);

    errorHandler.recordPerformance('databaseTime', 12);

    res.status(200).json({
        success: true,
        message: `${type === 'buy' ? '买入' : '卖出'}订单执行成功`,
        data: {
            order: savedRecord,
            account: account,
            executionPrice: tradePrice,
            totalCost: tradeAmount
        }
    });
});

/**
 * 买入（做多）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const placeBuyOrder = async (req, res) => {
    req.body.type = 'buy';
    return executeTrade(req, res);
};

/**
 * 卖出（做空）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const placeSellOrder = async (req, res) => {
    req.body.type = 'sell';
    return executeTrade(req, res);
};

/**
 * 获取用户交易记录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getTradeHistory = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { accountId } = req.params;
    const { symbol, action, limit = 50 } = req.query;
    
    // 验证参数
    validate.required({ accountId }, ['accountId']);
    const validLimit = validate.number(limit, '查询数量', { min: 1, max: 200 });
    
    // 验证账户存在性和所有权
    const account = TradingAccountStore.findById(accountId);
    if (!account) {
        throw createError.notFound('交易账户');
    }
    
    if (account.userId !== userId) {
        throw createError.forbidden('无权访问该交易账户');
    }

    // 构建查询选项
    const options = { limit: validLimit };
    if (symbol) {
        options.symbol = validate.string(symbol, '股票代码').toUpperCase();
    }
    if (action) {
        validate.enum(action, '交易类型', ['buy', 'sell']);
        options.action = action;
    }

    const trades = TradingRecordStore.findByUserId(userId, options);
    const totalCount = TradingRecordStore.countByUserId(userId);

    errorHandler.recordPerformance('databaseTime', 8);

    res.status(200).json({
        success: true,
        data: {
            trades,
            total: totalCount,
            filters: { symbol, action, limit: validLimit }
        }
    });
});

/**
 * 获取持仓信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getPositions = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { accountId } = req.params;
    
    // 验证参数
    validate.required({ accountId }, ['accountId']);

    // 验证账户存在性和所有权
    const account = TradingAccountStore.findById(accountId);
    if (!account) {
        throw createError.notFound('交易账户');
    }

    if (account.userId !== userId) {
        throw createError.forbidden('无权访问该交易账户');
    }

    // 从交易记录聚合计算持仓
    const positions = TradingRecordStore.calculatePositions(userId);

    errorHandler.recordPerformance('databaseTime', 10);

    res.status(200).json({
        success: true,
        data: positions,
        meta: {
            totalPositions: positions.length,
            accountId: accountId
        }
    });
});

/**
 * 获取单个股票实时行情
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getQuote = async (req, res) => {
    try {
        const { symbol } = req.params;
        
        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: '股票代码不能为空'
            });
        }

        const quote = marketDataService.getQuote(symbol);
        
        if (!quote) {
            return res.status(404).json({
                success: false,
                message: `未找到股票 ${symbol} 的行情数据`
            });
        }

        res.status(200).json({
            success: true,
            data: quote
        });
    } catch (error) {
        console.error('获取行情数据错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 批量获取股票行情
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getBatchQuotes = async (req, res) => {
    try {
        const { symbols } = req.query; // ?symbols=AAPL,GOOGL,MSFT
        
        if (!symbols) {
            return res.status(400).json({
                success: false,
                message: '请提供股票代码列表（用逗号分隔）'
            });
        }

        const symbolArray = symbols.split(',').map(s => s.trim()).filter(Boolean);
        const quotes = marketDataService.getBatchQuotes(symbolArray);

        res.status(200).json({
            success: true,
            data: quotes
        });
    } catch (error) {
        console.error('批量获取行情数据错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 搜索股票代码
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const searchSymbols = async (req, res) => {
    try {
        const { keyword } = req.query;
        
        const results = marketDataService.searchSymbols(keyword);

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('搜索股票错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

module.exports = {
    getAccountInfo,
    getUserAccounts,
    createAccount,
    executeTrade,
    placeBuyOrder,
    placeSellOrder,
    getTradeHistory,
    getPositions,
    getQuote,
    getBatchQuotes,
    searchSymbols
};