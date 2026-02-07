/**
 * 排行榜控制器 - 处理用户排名和统计信息
 * @fileoverview 提供排行榜相关的API接口，包括排名查询、统计展示等
 */

const Leaderboard = require('../models/Leaderboard');
const TradingAccount = require('../models/TradingAccount');

/**
 * 获取排行榜数据
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getLeaderboard = async (req, res) => {
    try {
        const { type = 'profit', period = 'weekly', limit = 50 } = req.query;
        
        // 验证参数
        const validTypes = ['profit', 'winRate', 'sharpeRatio', 'totalTrades'];
        const validPeriods = ['daily', 'weekly', 'monthly', 'allTime'];
        
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: '不支持的排行榜类型'
            });
        }
        
        if (!validPeriods.includes(period)) {
            return res.status(400).json({
                success: false,
                message: '不支持的统计周期'
            });
        }
        
        const leaderboard = await Leaderboard.getRankings({
            type,
            period,
            limit: parseInt(limit)
        });
        
        res.status(200).json({
            success: true,
            data: {
                type,
                period,
                rankings: leaderboard,
                totalCount: leaderboard.length
            }
        });
    } catch (error) {
        console.error('获取排行榜错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 获取用户个人排名信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getUserRanking = async (req, res) => {
    try {
        const { userId } = req.params;
        const { type = 'profit', period = 'weekly' } = req.query;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '用户ID不能为空'
            });
        }
        
        const ranking = await Leaderboard.getUserRanking(userId, {
            type,
            period
        });
        
        res.status(200).json({
            success: true,
            data: ranking
        });
    } catch (error) {
        console.error('获取用户排名错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 获取排行榜统计概览
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getLeaderboardStats = async (req, res) => {
    try {
        const stats = await Leaderboard.getStatistics();
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('获取排行榜统计错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 更新排行榜缓存（管理员功能）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const updateLeaderboardCache = async (req, res) => {
    try {
        const { type, period } = req.body;
        
        await Leaderboard.refreshCache(type, period);
        
        res.status(200).json({
            success: true,
            message: '排行榜缓存更新成功'
        });
    } catch (error) {
        console.error('更新排行榜缓存错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 获取排行榜历史趋势
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getRankingTrend = async (req, res) => {
    try {
        const { userId, type = 'profit', days = 30 } = req.query;
        
        const trend = await Leaderboard.getRankingTrend(userId, {
            type,
            days: parseInt(days)
        });
        
        res.status(200).json({
            success: true,
            data: trend
        });
    } catch (error) {
        console.error('获取排名趋势错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

module.exports = {
    getLeaderboard,
    getUserRanking,
    getLeaderboardStats,
    updateLeaderboardCache,
    getRankingTrend
};