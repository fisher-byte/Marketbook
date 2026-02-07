/**
 * 交易引擎控制器 - 增强的交易执行和风险管理
 * 提供高级交易功能：限价单、止损单、批量交易、风险控制等
 */

const TradingEngine = require('../models/TradingEngine');
const TradingAccount = require('../models/TradingAccount');
const TradingRecord = require('../models/TradingRecord');

/**
 * 执行限价单交易
 */
const executeLimitOrder = async (req, res) => {
    try {
        const { userId, symbol, quantity, limitPrice, type = 'buy', expiration = 'GTC' } = req.body;
        
        if (!userId || !symbol || !quantity || !limitPrice) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数：userId, symbol, quantity, limitPrice'
            });
        }

        const engine = new TradingEngine();
        const result = await engine.executeLimitOrder({
            userId,
            symbol,
            quantity,
            limitPrice,
            type,
            expiration
        });

        res.status(200).json({
            success: true,
            message: '限价单提交成功',
            data: result
        });
    } catch (error) {
        console.error('执行限价单错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '服务器内部错误'
        });
    }
};

/**
 * 执行止损单交易
 */
const executeStopOrder = async (req, res) => {
    try {
        const { userId, symbol, quantity, stopPrice, type = 'sell', triggerType = 'market' } = req.body;
        
        if (!userId || !symbol || !quantity || !stopPrice) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数：userId, symbol, quantity, stopPrice'
            });
        }

        const engine = new TradingEngine();
        const result = await engine.executeStopOrder({
            userId,
            symbol,
            quantity,
            stopPrice,
            type,
            triggerType
        });

        res.status(200).json({
            success: true,
            message: '止损单提交成功',
            data: result
        });
    } catch (error) {
        console.error('执行止损单错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '服务器内部错误'
        });
    }
};

/**
 * 批量交易执行
 */
const executeBatchTrades = async (req, res) => {
    try {
        const { userId, trades } = req.body;
        
        if (!userId || !Array.isArray(trades) || trades.length === 0) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数：userId, trades（交易数组）'
            });
        }

        const engine = new TradingEngine();
        const results = await engine.executeBatchTrades(userId, trades);

        res.status(200).json({
            success: true,
            message: `批量交易执行完成，成功${results.successCount}笔，失败${results.failureCount}笔`,
            data: results
        });
    } catch (error) {
        console.error('批量交易执行错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '服务器内部错误'
        });
    }
};

/**
 * 获取待处理订单列表
 */
const getPendingOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20, orderType } = req.query;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '用户ID不能为空'
            });
        }

        const engine = new TradingEngine();
        const orders = await engine.getPendingOrders(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            orderType
        });

        res.status(200).json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('获取待处理订单错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 取消待处理订单
 */
const cancelPendingOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: '订单ID不能为空'
            });
        }

        const engine = new TradingEngine();
        const result = await engine.cancelPendingOrder(orderId);

        res.status(200).json({
            success: true,
            message: '订单取消成功',
            data: result
        });
    } catch (error) {
        console.error('取消订单错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '服务器内部错误'
        });
    }
};

/**
 * 风险控制检查
 */
const riskCheck = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '用户ID不能为空'
            });
        }

        const engine = new TradingEngine();
        const riskReport = await engine.performRiskCheck(userId);

        res.status(200).json({
            success: true,
            data: riskReport
        });
    } catch (error) {
        console.error('风险检查错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 获取交易引擎状态
 */
const getEngineStatus = async (req, res) => {
    try {
        const engine = new TradingEngine();
        const status = await engine.getEngineStatus();

        res.status(200).json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('获取引擎状态错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

module.exports = {
    executeLimitOrder,
    executeStopOrder,
    executeBatchTrades,
    getPendingOrders,
    cancelPendingOrder,
    riskCheck,
    getEngineStatus
};