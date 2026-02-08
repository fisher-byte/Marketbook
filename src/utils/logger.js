/**
 * 结构化日志系统
 * 
 * 基于 winston 实现的生产级日志系统
 * 支持：文件轮转、日志级别、上下文信息、错误追踪
 * 
 * @module logger
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

/**
 * 确保日志目录存在
 */
const logDir = config.logging.file.dirname;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * 自定义日志格式
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    // 添加元数据
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    // 添加错误堆栈
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

/**
 * JSON 格式（生产环境推荐）
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * 选择日志格式
 */
const logFormat = config.logging.format === 'json' ? jsonFormat : customFormat;

/**
 * 传输配置
 */
const transports = [];

// 控制台输出
if (config.logging.console.enabled) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        config.logging.console.colorize ? winston.format.colorize() : winston.format.uncolorize(),
        customFormat
      ),
    })
  );
}

// 文件输出：综合日志
if (config.logging.file.enabled) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: config.logging.file.maxSize,
      maxFiles: config.logging.file.maxFiles,
      format: logFormat,
    })
  );
}

// 文件输出：错误日志
if (config.logging.error.enabled) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, config.logging.error.filename),
      level: 'error',
      maxsize: config.logging.file.maxSize,
      maxFiles: config.logging.file.maxFiles,
      format: logFormat,
    })
  );
}

/**
 * 创建 Winston logger 实例
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  // 未捕获异常处理
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
    }),
  ],
  // 未处理的 Promise rejection
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
    }),
  ],
});

/**
 * 创建子日志器（带上下文）
 * @param {string} context - 上下文标识（如模块名）
 * @returns {Object} 带上下文的日志器
 */
function createChildLogger(context) {
  return {
    debug: (message, meta = {}) => logger.debug(message, { context, ...meta }),
    info: (message, meta = {}) => logger.info(message, { context, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { context, ...meta }),
    error: (message, meta = {}) => logger.error(message, { context, ...meta }),
  };
}

/**
 * HTTP 请求日志中间件
 * 记录请求方法、路径、状态码、响应时间
 */
function httpLogger(req, res, next) {
  const startTime = Date.now();
  
  // 响应完成后记录
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      userId: req.userId, // 如果有认证信息
    });
  });
  
  next();
}

/**
 * 错误日志工具
 * 记录错误堆栈和上下文
 */
function logError(error, context = {}) {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    statusCode: error.statusCode,
    type: error.type,
    ...context,
  });
}

/**
 * 审计日志（敏感操作记录）
 * 用于记录用户关键操作（登录、交易、权限变更等）
 */
function auditLog(action, userId, details = {}) {
  logger.info('Audit Log', {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * 性能日志
 * 记录慢查询、慢接口等性能指标
 */
function performanceLog(operation, duration, threshold = 1000) {
  if (duration > threshold) {
    logger.warn('Slow Operation Detected', {
      operation,
      duration: `${duration}ms`,
      threshold: `${threshold}ms`,
    });
  }
}

/**
 * 调试日志（仅开发环境）
 */
function debug(message, meta = {}) {
  if (config.isDevelopment()) {
    logger.debug(message, meta);
  }
}

/**
 * 导出日志器和工具方法
 */
module.exports = {
  // Winston 原生实例
  logger,
  
  // 基础日志方法
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  
  // 工具方法
  createChildLogger,
  httpLogger,
  logError,
  auditLog,
  performanceLog,
  debugLog: debug,
  
  // 快捷方法
  logRequest: httpLogger,
};
