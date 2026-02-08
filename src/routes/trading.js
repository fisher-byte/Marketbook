const express = require('express');
const router = express.Router();
const tradingController = require('../controllers/tradingController');
const { authenticateToken } = require('../middleware/auth');
const { rateLimitPresets } = require('../middlewares/rateLimiter');

/**
 * 交易功能路由模块
 * 提供交易账户管理、交易执行、持仓查询等功能
 * 
 * 频率限制策略:
 * - 交易操作: 1分钟内最多30次请求
 * - 查询操作: 1分钟内最多60次请求
 * - 行情查询: 1分钟内最多120次请求
 */

// 交易账户相关路由（查询限流）
router.post('/accounts', authenticateToken, rateLimitPresets.trading, tradingController.createAccount);
router.get('/accounts', authenticateToken, rateLimitPresets.query, tradingController.getUserAccounts);
router.get('/accounts/:accountId', authenticateToken, rateLimitPresets.query, tradingController.getAccountInfo);

// 交易执行相关路由（交易限流）
router.post('/orders/buy', authenticateToken, rateLimitPresets.trading, tradingController.placeBuyOrder);
router.post('/orders/sell', authenticateToken, rateLimitPresets.trading, tradingController.placeSellOrder);
router.post('/orders/execute', authenticateToken, rateLimitPresets.trading, tradingController.executeTrade);

// 持仓相关路由（查询限流）
router.get('/accounts/:accountId/positions', authenticateToken, rateLimitPresets.query, tradingController.getPositions);

// 交易历史相关路由（查询限流）
router.get('/accounts/:accountId/history', authenticateToken, rateLimitPresets.query, tradingController.getTradeHistory);

// 行情数据相关路由（行情限流 - 最宽松，支持实时刷新）
router.get('/quotes/:symbol', rateLimitPresets.market, tradingController.getQuote);
router.get('/quotes', rateLimitPresets.market, tradingController.getBatchQuotes);
router.get('/market/symbols', rateLimitPresets.market, tradingController.searchSymbols);

// 暂时注释未实现的路由
/*
// router.get('/accounts', auth, tradingController.getUserAccounts);
// router.get('/accounts/:accountId', auth, tradingController.getAccountDetails);
// router.put('/accounts/:accountId', auth, tradingController.updateAccount);
// router.delete('/accounts/:accountId', auth, tradingController.closeAccount);

// router.post('/orders/buy', auth, tradingController.placeBuyOrder);
// router.post('/orders/sell', auth, tradingController.placeSellOrder);
// router.post('/orders/cancel/:orderId', auth, tradingController.cancelOrder);
// router.get('/orders', auth, tradingController.getOrderHistory);
// router.get('/orders/:orderId', auth, tradingController.getOrderDetails);

// 高级交易引擎路由
// router.post('/engine/execute', auth, tradingEngineController.executeAdvancedTrade);
// router.post('/engine/backtest', auth, tradingEngineController.runBacktest);
// router.get('/engine/performance/:accountId', auth, tradingEngineController.getPerformanceMetrics);
// router.post('/engine/risk-check', auth, tradingEngineController.performRiskCheck);

// 排行榜相关路由
// router.get('/leaderboard/global', auth, leaderboardController.getGlobalLeaderboard);
// router.get('/leaderboard/weekly', auth, leaderboardController.getWeeklyLeaderboard);
// router.get('/leaderboard/monthly', auth, leaderboardController.getMonthlyLeaderboard);
// router.get('/leaderboard/user/:userId', auth, leaderboardController.getUserRanking);
// router.get('/leaderboard/categories', auth, leaderboardController.getLeaderboardCategories);

// router.get('/positions', auth, tradingController.getPositions);
// router.get('/portfolio', auth, tradingController.getPortfolioSummary);
// router.get('/balance', auth, tradingController.getAccountBalance);

// 行情数据相关路由
// router.get('/quotes/:symbol', auth, tradingController.getQuote);
// router.get('/market-data', auth, tradingController.getMarketData);
*/

module.exports = router;