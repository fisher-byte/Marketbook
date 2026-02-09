/**
 * Sentry 错误监控配置
 * 
 * 功能：
 * - 自动捕获未处理的异常和Promise拒绝
 * - 追踪错误上下文（用户、请求、环境）
 * - 性能监控（可选）
 * - 环境分离（development/staging/production）
 * 
 * 使用：
 * 1. 在 .env 设置 SENTRY_DSN
 * 2. app.js 最顶部引入：require('./config/sentry')
 * 3. 错误处理中间件前注册 Sentry handlers
 * 
 * 文档：https://docs.sentry.io/platforms/node/
 */

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const logger = require('../utils/logger');

/**
 * 初始化 Sentry
 * @param {Express} app - Express应用实例
 */
function initSentry(app) {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  
  // 开发环境不启用 Sentry（避免日志干扰）
  if (!dsn) {
    if (environment === 'production') {
      logger.warn('⚠️ SENTRY_DSN 未配置，生产环境错误监控已禁用');
    } else {
      logger.info('ℹ️ Sentry 未配置（开发环境可选）');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment,
    
    // 性能监控采样率（10%减少开销）
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Profiling（性能分析）
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    integrations: [
      new ProfilingIntegration(),
    ],
    
    // 自动捕获未处理的Promise拒绝
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
    
    // 过滤敏感信息（密码、token等）
    beforeSend(event, hint) {
      // 脱敏用户数据
      if (event.user) {
        delete event.user.password;
        delete event.user.token;
      }
      
      // 脱敏请求体中的敏感字段
      if (event.request && event.request.data) {
        const data = event.request.data;
        if (typeof data === 'object') {
          ['password', 'token', 'jwt', 'secret'].forEach(field => {
            if (data[field]) {
              data[field] = '[已过滤]';
            }
          });
        }
      }
      
      return event;
    },
    
    // 忽略预期错误（非bug）
    ignoreErrors: [
      // 用户主动取消请求
      'AbortError',
      'CancelledError',
      // 网络问题（非后端bug）
      'NetworkError',
      'Network request failed',
      // 第三方脚本错误
      /^Non-Error/,
    ],
  });

  logger.info(`✅ Sentry 错误监控已启用（环境：${environment}）`);
}

/**
 * Sentry 请求处理器（必须在所有路由之前）
 */
function requestHandler() {
  return Sentry.Handlers.requestHandler();
}

/**
 * Sentry 错误处理器（必须在所有路由之后、自定义错误处理器之前）
 */
function errorHandler() {
  return Sentry.Handlers.errorHandler();
}

/**
 * 手动捕获错误
 * @param {Error} error - 错误对象
 * @param {Object} context - 额外上下文信息
 */
function captureError(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * 手动记录消息
 * @param {string} message - 消息内容
 * @param {string} level - 日志级别（info/warning/error）
 */
function captureMessage(message, level = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * 设置用户上下文（用于追踪错误关联的用户）
 * @param {Object} user - 用户信息
 */
function setUser(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  
  Sentry.setUser({
    id: user.id || user._id,
    email: user.email,
    username: user.username,
  });
}

/**
 * 添加面包屑（记录错误发生前的用户操作）
 * @param {Object} breadcrumb - 面包屑数据
 */
function addBreadcrumb(breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}

module.exports = {
  initSentry,
  requestHandler,
  errorHandler,
  captureError,
  captureMessage,
  setUser,
  addBreadcrumb,
  Sentry, // 导出原始实例（高级用法）
};
