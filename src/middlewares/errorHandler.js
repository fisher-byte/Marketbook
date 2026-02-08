/**
 * 错误处理中间件 - 统一错误响应格式
 * @fileoverview 提供全局错误处理、统一响应格式、错误日志记录
 */

const { errorHandler: errorLogger } = require('../utils/ErrorHandler');

/**
 * 自定义API错误类
 */
class ApiError extends Error {
    constructor(statusCode, message, type = 'general', details = null) {
        super(message);
        this.statusCode = statusCode;
        this.type = type;
        this.details = details;
        this.isOperational = true; // 区分操作性错误和程序错误
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 创建特定类型的错误
 */
const createError = {
    badRequest: (message, details = null) => 
        new ApiError(400, message, 'validation', details),
    
    unauthorized: (message = '未授权访问') => 
        new ApiError(401, message, 'authentication'),
    
    forbidden: (message = '无权访问该资源') => 
        new ApiError(403, message, 'authorization'),
    
    notFound: (resource = '资源') => 
        new ApiError(404, `${resource}不存在`, 'not_found'),
    
    conflict: (message) => 
        new ApiError(409, message, 'conflict'),
    
    tooManyRequests: (message = '请求过于频繁') => 
        new ApiError(429, message, 'rate_limit'),
    
    internal: (message = '服务器内部错误') => 
        new ApiError(500, message, 'internal'),
};

/**
 * 错误响应格式化
 * @param {ApiError} error - 错误对象
 * @param {boolean} isDevelopment - 是否开发环境
 */
const formatErrorResponse = (error, isDevelopment = true) => {
    const response = {
        success: false,
        error: {
            type: error.type || 'general',
            message: error.message,
            statusCode: error.statusCode || 500,
        }
    };

    // 添加详细信息（如验证错误细节）
    if (error.details) {
        response.error.details = error.details;
    }

    // 开发环境下返回堆栈信息
    if (isDevelopment && error.stack) {
        response.error.stack = error.stack;
    }

    // 添加错误ID用于追踪
    if (error.errorId) {
        response.error.errorId = error.errorId;
    }

    return response;
};

/**
 * 全局错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - next函数
 */
const globalErrorHandler = (err, req, res, next) => {
    // 确保错误有statusCode
    err.statusCode = err.statusCode || 500;
    err.type = err.type || 'internal';

    // 记录错误到ErrorHandler
    const errorId = errorLogger.logError(
        err.type,
        err.message,
        {
            path: req.path,
            method: req.method,
            userId: req.userId,
            ip: req.ip,
            statusCode: err.statusCode,
        },
        err
    );

    // 添加错误ID到错误对象
    err.errorId = errorId;

    // 格式化并返回错误响应
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const errorResponse = formatErrorResponse(err, isDevelopment);

    res.status(err.statusCode).json(errorResponse);
};

/**
 * 异步路由处理器包装器 - 自动捕获异常
 * @param {Function} fn - 异步路由处理函数
 * @returns {Function} 包装后的函数
 * 
 * @example
 * router.get('/example', asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json({ success: true, data });
 * }));
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 404处理中间件
 */
const notFoundHandler = (req, res, next) => {
    const error = createError.notFound(`路由 ${req.path}`);
    next(error);
};

/**
 * 请求验证辅助函数
 */
const validate = {
    /**
     * 验证必需字段
     * @param {Object} data - 要验证的数据对象
     * @param {string[]} requiredFields - 必需字段列表
     * @throws {ApiError} 如果缺少必需字段
     */
    required: (data, requiredFields) => {
        const missing = requiredFields.filter(field => !data[field]);
        if (missing.length > 0) {
            throw createError.badRequest(
                '缺少必需参数',
                { missingFields: missing }
            );
        }
    },

    /**
     * 验证数字类型和范围
     * @param {*} value - 要验证的值
     * @param {string} fieldName - 字段名
     * @param {Object} options - 验证选项 {min, max}
     * @throws {ApiError} 如果验证失败
     */
    number: (value, fieldName, options = {}) => {
        const num = Number(value);
        if (isNaN(num)) {
            throw createError.badRequest(`${fieldName}必须是数字`);
        }
        if (options.min !== undefined && num < options.min) {
            throw createError.badRequest(`${fieldName}不能小于${options.min}`);
        }
        if (options.max !== undefined && num > options.max) {
            throw createError.badRequest(`${fieldName}不能大于${options.max}`);
        }
        return num;
    },

    /**
     * 验证字符串长度
     * @param {string} value - 要验证的值
     * @param {string} fieldName - 字段名
     * @param {Object} options - 验证选项 {minLength, maxLength}
     * @throws {ApiError} 如果验证失败
     */
    string: (value, fieldName, options = {}) => {
        if (typeof value !== 'string') {
            throw createError.badRequest(`${fieldName}必须是字符串`);
        }
        if (options.minLength && value.length < options.minLength) {
            throw createError.badRequest(`${fieldName}长度不能小于${options.minLength}`);
        }
        if (options.maxLength && value.length > options.maxLength) {
            throw createError.badRequest(`${fieldName}长度不能大于${options.maxLength}`);
        }
        return value;
    },

    /**
     * 验证枚举值
     * @param {*} value - 要验证的值
     * @param {string} fieldName - 字段名
     * @param {Array} allowedValues - 允许的值列表
     * @throws {ApiError} 如果验证失败
     */
    enum: (value, fieldName, allowedValues) => {
        if (!allowedValues.includes(value)) {
            throw createError.badRequest(
                `${fieldName}值无效`,
                { allowedValues }
            );
        }
        return value;
    }
};

module.exports = {
    ApiError,
    createError,
    globalErrorHandler,
    asyncHandler,
    notFoundHandler,
    validate,
};
