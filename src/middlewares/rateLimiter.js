/**
 * API 请求频率限制中间件
 * @fileoverview 防止API滥用和DDoS攻击，为不同类型API提供差异化限流策略
 * @version 1.0.0
 * @date 2026-02-08
 */

const { createError } = require('./errorHandler');

/**
 * 内存存储请求记录（生产环境建议使用Redis）
 * @type {Map<string, {count: number, resetTime: number}>}
 */
const requestStore = new Map();

/**
 * 清理过期记录定时器（每分钟清理一次）
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestStore.entries()) {
        if (now > value.resetTime) {
            requestStore.delete(key);
        }
    }
}, 60000); // 每60秒清理一次

/**
 * 创建频率限制中间件
 * @param {Object} options - 配置选项
 * @param {number} options.windowMs - 时间窗口（毫秒），默认15分钟
 * @param {number} options.maxRequests - 最大请求次数，默认100次
 * @param {string} options.message - 超限提示消息
 * @param {function} options.keyGenerator - 生成限流键的函数（默认使用IP）
 * @returns {Function} Express中间件
 * 
 * @example
 * // 基础用法：限制每个IP 15分钟内最多100次请求
 * app.use(rateLimiter());
 * 
 * @example
 * // 自定义配置：1分钟内最多10次请求
 * app.use('/api/auth', rateLimiter({
 *   windowMs: 60000,
 *   maxRequests: 10,
 *   message: '登录请求过于频繁，请稍后再试'
 * }));
 * 
 * @example
 * // 基于用户ID限流（已登录用户）
 * app.use('/api/trading', rateLimiter({
 *   keyGenerator: (req) => req.userId || req.ip
 * }));
 */
function rateLimiter(options = {}) {
    const {
        windowMs = 15 * 60 * 1000,  // 默认15分钟
        maxRequests = 100,           // 默认100次请求
        message = '请求过于频繁，请稍后再试',
        keyGenerator = (req) => req.ip || req.connection.remoteAddress
    } = options;

    return (req, res, next) => {
        const key = `rate_limit:${keyGenerator(req)}`;
        const now = Date.now();
        
        // 获取或初始化请求记录
        let record = requestStore.get(key);
        
        if (!record || now > record.resetTime) {
            // 创建新的时间窗口
            record = {
                count: 1,
                resetTime: now + windowMs
            };
            requestStore.set(key, record);
        } else {
            // 增加请求计数
            record.count += 1;
        }

        // 设置响应头（标准限流响应头）
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
        res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

        // 检查是否超限
        if (record.count > maxRequests) {
            const retryAfter = Math.ceil((record.resetTime - now) / 1000); // 秒
            res.setHeader('Retry-After', retryAfter);
            
            throw createError.tooManyRequests(message, {
                retryAfter,
                limit: maxRequests,
                windowMs
            });
        }

        next();
    };
}

/**
 * 预定义的限流策略
 */
const rateLimitPresets = {
    /**
     * 严格限流：用于敏感操作（注册、登录、密码重置等）
     * 1分钟内最多5次请求
     */
    strict: rateLimiter({
        windowMs: 60 * 1000,      // 1分钟
        maxRequests: 5,
        message: '操作过于频繁，请1分钟后再试'
    }),

    /**
     * 认证限流：用于登录/注册接口
     * 15分钟内最多20次请求
     */
    auth: rateLimiter({
        windowMs: 15 * 60 * 1000, // 15分钟
        maxRequests: 20,
        message: '认证请求过于频繁，请稍后再试'
    }),

    /**
     * 交易限流：用于下单等交易操作
     * 1分钟内最多30次请求
     */
    trading: rateLimiter({
        windowMs: 60 * 1000,      // 1分钟
        maxRequests: 30,
        message: '交易请求过于频繁，请稍后再试'
    }),

    /**
     * 查询限流：用于查询类API（持仓、历史等）
     * 1分钟内最多60次请求
     */
    query: rateLimiter({
        windowMs: 60 * 1000,      // 1分钟
        maxRequests: 60,
        message: '查询请求过于频繁，请稍后再试'
    }),

    /**
     * 行情限流：用于行情查询API
     * 1分钟内最多120次请求（支持实时刷新）
     */
    market: rateLimiter({
        windowMs: 60 * 1000,      // 1分钟
        maxRequests: 120,
        message: '行情查询过于频繁，请稍后再试'
    }),

    /**
     * 通用限流：用于一般API
     * 15分钟内最多100次请求
     */
    general: rateLimiter({
        windowMs: 15 * 60 * 1000, // 15分钟
        maxRequests: 100,
        message: '请求过于频繁，请稍后再试'
    }),

    /**
     * 按用户ID限流（已登录用户）
     * 适用于需要区分用户的场景
     */
    perUser: (options = {}) => rateLimiter({
        ...options,
        keyGenerator: (req) => req.userId || req.ip
    })
};

/**
 * 获取限流统计信息（用于监控和调试）
 * @returns {Object} 统计信息
 */
function getRateLimitStats() {
    const stats = {
        totalKeys: requestStore.size,
        records: []
    };

    for (const [key, value] of requestStore.entries()) {
        stats.records.push({
            key,
            count: value.count,
            resetTime: new Date(value.resetTime).toISOString(),
            remainingMs: Math.max(0, value.resetTime - Date.now())
        });
    }

    return stats;
}

/**
 * 清空所有限流记录（仅用于测试环境）
 */
function clearRateLimitStore() {
    requestStore.clear();
}

module.exports = {
    rateLimiter,
    rateLimitPresets,
    getRateLimitStats,
    clearRateLimitStore
};
