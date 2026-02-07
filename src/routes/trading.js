const express = require('express');
const router = express.Router();
const tradingController = require('../controllers/tradingController');
const tradingEngineController = require('../controllers/TradingEngineController');
const leaderboardController = require('../controllers/LeaderboardController');
const auth = require('../middleware/auth');

/**
 * 交易功能路由模块
 * 提供交易账户管理、交易执行、持仓查询等功能
 */

// 交易账户相关路由
router.get('/accounts', auth, tradingController.getUserAccounts);
router.post('/accounts', auth, tradingController.createAccount);
router.get('/accounts/:accountId', auth, tradingController.getAccountDetails);
router.put('/accounts/:accountId', auth, tradingController.updateAccount);
router.delete('/accounts/:accountId', auth, tradingController.closeAccount);

// 交易执行相关路由
router.post('/orders/buy', auth, tradingController.placeBuyOrder);
router.post('/orders/sell', auth, tradingController.placeSellOrder);
router.post('/orders/cancel/:orderId', auth, tradingController.cancelOrder);
router.get('/orders', auth, tradingController.getOrderHistory);
router.get('/orders/:orderId', auth, tradingController.getOrderDetails);

// 高级交易引擎路由
router.post('/engine/execute', auth, tradingEngineController.executeAdvancedTrade);
router.post('/engine/backtest', auth, tradingEngineController.runBacktest);
router.get('/engine/performance/:accountId', auth, tradingEngineController.getPerformanceMetrics);
router.post('/engine/risk-check', auth, tradingEngineController.performRiskCheck);

// 排行榜相关路由
router.get('/leaderboard/global', auth, leaderboardController.getGlobalLeaderboard);
router.get('/leaderboard/weekly', auth, leaderboardController.getWeeklyLeaderboard);
router.get('/leaderboard/monthly', auth, leaderboardController.getMonthlyLeaderboard);
router.get('/leaderboard/user/:userId', auth, leaderboardController.getUserRanking);
router.get('/leaderboard/categories', auth, leaderboardController.getLeaderboardCategories);

// 持仓和资产相关路由
router.get('/positions', auth, tradingController.getPositions);
router.get('/portfolio', auth, tradingController.getPortfolioSummary);
router.get('/balance', auth, tradingController.getAccountBalance);

// 行情数据相关路由
router.get('/quotes/:symbol', auth, tradingController.getQuote);
router.get('/market-data', auth, tradingController.getMarketData);

module.exports = router;