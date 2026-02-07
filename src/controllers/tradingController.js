/**
 * 交易控制器 - 处理交易执行和账户管理
 * @fileoverview 提供交易相关的API接口，包括下单、查询、账户管理等
 */

const TradingAccount = require('../models/TradingAccount');
const TradingRecord = require('../models/TradingRecord');

/**
 * 获取用户交易账户信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getAccountInfo = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '用户ID不能为空'
            });
        }

        const account = await TradingAccount.findByUserId(userId);
        
        if (!account) {
            return res.status(404).json({
                success: false,
                message: '交易账户不存在'
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
 * 创建交易账户
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const createAccount = async (req, res) => {
    try {
        const { userId, initialBalance = 100000 } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '用户ID不能为空'
            });
        }

        // 检查是否已存在账户
        const existingAccount = await TradingAccount.findByUserId(userId);
        if (existingAccount) {
            return res.status(409).json({
                success: false,
                message: '交易账户已存在'
            });
        }

        const account = new TradingAccount({
            userId,
            balance: initialBalance,
            availableBalance: initialBalance,
            status: 'active'
        });

        await account.save();

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
 * 执行交易（买入/卖出）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const executeTrade = async (req, res) => {
    try {
        const { userId, symbol, quantity, price, type = 'buy' } = req.body;
        
        // 验证必填字段
        if (!userId || !symbol || !quantity || !price) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数：userId, symbol, quantity, price'
            });
        }

        if (quantity <= 0 || price <= 0) {
            return res.status(400).json({
                success: false,
                message: '数量和价格必须大于0'
            });
        }

        // 获取交易账户
        const account = await TradingAccount.findByUserId(userId);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: '交易账户不存在'
            });
        }

        // 检查账户状态
        if (account.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: '交易账户状态异常，无法执行交易'
            });
        }

        // 计算交易金额
        const tradeAmount = quantity * price;
        
        // 买入交易验证资金充足性
        if (type === 'buy' && account.availableBalance < tradeAmount) {
            return res.status(400).json({
                success: false,
                message: '可用资金不足'
            });
        }

        // 创建交易记录
        const tradeRecord = new TradingRecord({
            userId,
            symbol,
            type,
            quantity,
            price,
            amount: tradeAmount,
            status: 'executed'
        });

        await tradeRecord.save();

        // 更新账户余额
        if (type === 'buy') {
            account.balance -= tradeAmount;
            account.availableBalance -= tradeAmount;
        } else {
            account.balance += tradeAmount;
            account.availableBalance += tradeAmount;
        }

        await account.save();

        res.status(200).json({
            success: true,
            message: '交易执行成功',
            data: {
                tradeRecord,
                updatedAccount: account
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
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '用户ID不能为空'
            });
        }

        const positions = await TradingRecord.getPositionsByUserId(userId);

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
    createAccount,
    executeTrade,
    getTradeHistory,
    getPositions
};