/**
 * 交易控制器 - 处理交易执行和账户管理
 * @fileoverview 提供交易相关的API接口，包括下单、查询、账户管理等
 */

const TradingAccount = require('../models/TradingAccount');
const TradingAccountStore = require('../models/TradingAccountStore');
const TradingRecord = require('../models/TradingRecord');

/**
 * 获取用户交易账户信息（通过accountId）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getAccountInfo = async (req, res) => {
    try {
        const userId = req.userId; // 从认证中间件获取
        const { accountId } = req.params;
        
        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: '账户ID不能为空'
            });
        }

        const account = TradingAccountStore.findById(accountId);
        
        if (!account) {
            return res.status(404).json({
                success: false,
                message: '交易账户不存在'
            });
        }

        // 验证账户所有权
        if (account.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: '无权访问该交易账户'
            });
        }

        res.status(200).json({
            success: true,
            data: account
        });
    } catch (error) {
        console.error('获取交易账户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 获取用户所有交易账户
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getUserAccounts = async (req, res) => {
    try {
        const userId = req.userId; // 从认证中间件获取
        
        const accounts = TradingAccountStore.findByUserId(userId);
        
        res.status(200).json({
            success: true,
            data: accounts ? [accounts] : [] // 目前一个用户只有一个账户
        });
    } catch (error) {
        console.error('获取用户交易账户错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 创建交易账户
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const createAccount = async (req, res) => {
    try {
        // 从认证中间件注入的userId获取用户ID
        const userId = req.userId;
        const { initialBalance = 100000 } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '用户ID不能为空'
            });
        }

        // 检查是否已存在账户
        const existingAccount = TradingAccountStore.findByUserId(userId);
        if (existingAccount) {
            return res.status(409).json({
                success: false,
                message: '交易账户已存在'
            });
        }

        const account = new TradingAccount({
            userId,
            initialBalance: initialBalance,
            currentBalance: initialBalance,
            availableBalance: initialBalance,
            status: 'active'
        });

        TradingAccountStore.save(account);

        res.status(201).json({
            success: true,
            message: '交易账户创建成功',
            data: account
        });
    } catch (error) {
        console.error('创建交易账户错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 执行交易（买入/卖出）- 通用方法
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const executeTrade = async (req, res) => {
    try {
        const userId = req.userId; // 从认证中间件获取
        const { accountId, symbol, quantity, price, type = 'buy' } = req.body;
        
        // 验证必填字段
        if (!userId || !accountId || !symbol || !quantity) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数：accountId, symbol, quantity'
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: '数量必须大于0'
            });
        }

        // 获取交易账户
        const account = TradingAccountStore.findById(accountId);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: '交易账户不存在'
            });
        }

        // 验证账户所有权
        if (account.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: '无权访问该交易账户'
            });
        }

        // 检查账户状态
        if (account.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: '交易账户状态异常，无法执行交易'
            });
        }

        // 使用市场价（模拟）或指定价格
        const tradePrice = price || 150; // 模拟市场价
        const tradeAmount = quantity * tradePrice;
        
        // 买入交易验证资金充足性
        if (type === 'buy' && account.availableBalance < tradeAmount) {
            return res.status(400).json({
                success: false,
                message: '可用资金不足'
            });
        }

        // 创建交易记录（模拟，暂不保存）
        const tradeRecord = {
            userId,
            accountId,
            symbol,
            type,
            quantity,
            price: tradePrice,
            amount: tradeAmount,
            status: 'executed',
            timestamp: new Date()
        };

        // 更新账户余额
        if (type === 'buy') {
            account.currentBalance -= tradeAmount;
            account.availableBalance -= tradeAmount;
        } else {
            account.currentBalance += tradeAmount;
            account.availableBalance += tradeAmount;
        }

        TradingAccountStore.save(account);

        res.status(200).json({
            success: true,
            message: '交易执行成功',
            data: {
                order: tradeRecord,
                account: account
            }
        });
    } catch (error) {
        console.error('执行交易错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

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
const getTradeHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20, type, symbol } = req.query;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '用户ID不能为空'
            });
        }

        const filter = { userId };
        if (type) filter.type = type;
        if (symbol) filter.symbol = symbol;

        const trades = await TradingRecord.findByUserId(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            filter
        });

        const totalCount = await TradingRecord.countByUserId(userId, filter);

        res.status(200).json({
            success: true,
            data: {
                trades,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取交易记录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 获取持仓信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getPositions = async (req, res) => {
    try {
        const userId = req.userId; // 从认证中间件获取
        const { accountId } = req.params;
        
        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: '账户ID不能为空'
            });
        }

        const account = TradingAccountStore.findById(accountId);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: '交易账户不存在'
            });
        }

        // 验证账户所有权
        if (account.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: '无权访问该交易账户'
            });
        }

        // TODO: 实现真实的持仓查询（从TradingRecord聚合）
        // 目前返回模拟数据
        const positions = [];

        res.status(200).json({
            success: true,
            data: positions
        });
    } catch (error) {
        console.error('获取持仓信息错误:', error);
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
    getPositions
};