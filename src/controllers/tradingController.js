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
 * @route GET /api/trading/quotes/:symbol
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @throws {ApiError} 400 - 股票代码为空
 * @throws {ApiError} 404 - 股票不存在
 * @example 成功响应:
 * {
 *   success: true,
 *   data: {
 *     symbol: 'AAPL',
 *     name: 'Apple Inc.',
 *     currentPrice: 176.52,
 *     openPrice: 175.00,
 *     highPrice: 177.00,
 *     lowPrice: 174.50,
 *     change: 1.52,
 *     changePercent: 0.87,
 *     volume: 52847500,
 *     lastUpdated: '2026-02-08T07:53:30.357Z'
 *   }
 * }
 */
const getQuote = asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    
    // 输入验证
    validate.required(req.params, ['symbol']);
    validate.string(symbol, '股票代码', { maxLength: 10 });

    // 查询行情数据
    const quote = marketDataService.getQuote(symbol.toUpperCase());
    
    if (!quote) {
        throw createError.notFound(`股票 ${symbol.toUpperCase()}`);
    }

    res.status(200).json({
        success: true,
        data: quote,
        meta: {
            symbol: symbol.toUpperCase(),
            timestamp: new Date().toISOString()
        }
    });
});

/**
 * 批量获取股票行情
 * @route GET /api/trading/quotes?symbols=AAPL,GOOGL,MSFT
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @throws {ApiError} 400 - 股票代码列表为空或格式错误
 * @example 成功响应:
 * {
 *   success: true,
 *   data: [
 *     { symbol: 'AAPL', currentPrice: 176.52, ... },
 *     { symbol: 'GOOGL', currentPrice: 140.21, ... }
 *   ],
 *   meta: {
 *     totalRequested: 2,
 *     totalFound: 2,
 *     notFound: []
 *   }
 * }
 */
const getBatchQuotes = asyncHandler(async (req, res) => {
    const { symbols } = req.query; // ?symbols=AAPL,GOOGL,MSFT
    
    // 输入验证
    validate.required(req.query, ['symbols']);
    validate.string(symbols, '股票代码列表', { maxLength: 500 });

    // 解析并清理股票代码
    const symbolArray = symbols
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);

    if (symbolArray.length === 0) {
        throw createError.badRequest('股票代码列表不能为空');
    }

    // 限制批量查询数量（防止滥用）
    if (symbolArray.length > 50) {
        throw createError.badRequest('单次查询最多支持50个股票代码');
    }

    // 批量查询行情
    const quotesArray = marketDataService.getBatchQuotes(symbolArray);

    // 构建结果对象（方便查找已找到和未找到的）
    const quotesMap = {};
    quotesArray.forEach(quote => {
        if (quote) quotesMap[quote.symbol] = quote;
    });

    // 统计查询结果
    const foundSymbols = Object.keys(quotesMap);
    const notFoundSymbols = symbolArray.filter(s => !quotesMap[s]);

    res.status(200).json({
        success: true,
        data: quotesArray,  // 返回数组格式
        meta: {
            totalRequested: symbolArray.length,
            totalFound: foundSymbols.length,
            notFound: notFoundSymbols
        }
    });
});

/**
 * 搜索股票代码
 * @route GET /api/trading/market/symbols?keyword=apple
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @throws {ApiError} 400 - 搜索关键词为空或过短
 * @example 成功响应:
 * {
 *   success: true,
 *   data: [
 *     { symbol: 'AAPL', name: 'Apple Inc.', currentPrice: 176.52 },
 *     { symbol: 'MSFT', name: 'Microsoft Corporation', currentPrice: 385.23 }
 *   ],
 *   meta: {
 *     keyword: 'apple',
 *     totalResults: 1
 *   }
 * }
 */
const searchSymbols = asyncHandler(async (req, res) => {
    const { keyword } = req.query;
    
    // 输入验证
    if (keyword) {
        validate.string(keyword, '搜索关键词', { minLength: 1, maxLength: 50 });
    }

    // 允许空关键词（返回所有股票）
    const results = marketDataService.searchSymbols(keyword || '');

    res.status(200).json({
        success: true,
        data: results,
        meta: {
            keyword: keyword || '',
            totalResults: results.length
        }
    });
});

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