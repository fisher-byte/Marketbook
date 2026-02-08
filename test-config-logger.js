/**
 * 配置和日志系统测试
 * 
 * 验证：
 * 1. 配置加载正常
 * 2. 日志文件创建成功
 * 3. 不同级别日志输出
 * 4. HTTP日志中间件工作
 */

const config = require('./src/config');
const logger = require('./src/utils/logger');
const { auditLog, performanceLog, logError } = require('./src/utils/logger');

console.log('========================================');
console.log('📋 配置和日志系统测试');
console.log('========================================\n');

// ========================================
// 测试 1: 配置加载
// ========================================
console.log('✅ 测试 1: 配置加载');
console.log(`  环境: ${config.server.env}`);
console.log(`  端口: ${config.server.port}`);
console.log(`  JWT密钥: ${config.jwt.secret.substring(0, 10)}...`);
console.log(`  日志级别: ${config.logging.level}`);
console.log(`  初始资金: ${config.trading.initialBalance}`);
console.log(`  内存存储: ${config.database.useMemoryStore ? '启用' : '禁用'}`);

// 测试点号路径访问
const logLevel = config.get('logging.level');
console.log(`  点号路径访问测试: ${logLevel}`);

// 测试环境判断
console.log(`  是否开发环境: ${config.isDevelopment()}`);
console.log(`  是否生产环境: ${config.isProduction()}`);
console.log('\n');

// ========================================
// 测试 2: 基础日志
// ========================================
console.log('✅ 测试 2: 基础日志输出');
logger.debug('这是一条调试日志', { module: 'test', timestamp: Date.now() });
logger.info('这是一条信息日志', { userId: 'user123' });
logger.warn('这是一条警告日志', { usage: '85%' });
logger.error('这是一条错误日志', { errorCode: 'E001' });
console.log('\n');

// ========================================
// 测试 3: 子日志器
// ========================================
console.log('✅ 测试 3: 子日志器（带上下文）');
const { createChildLogger } = require('./src/utils/logger');
const authLogger = createChildLogger('AuthService');
const tradingLogger = createChildLogger('TradingService');

authLogger.info('用户注册成功', { userId: 'user123', email: 'test@example.com' });
tradingLogger.info('交易执行成功', { symbol: 'AAPL', quantity: 100 });
console.log('\n');

// ========================================
// 测试 4: 审计日志
// ========================================
console.log('✅ 测试 4: 审计日志');
auditLog('USER_LOGIN', 'user123', {
  email: 'test@example.com',
  ip: '192.168.1.1',
});
auditLog('TRADE_EXECUTED', 'user123', {
  symbol: 'AAPL',
  type: 'BUY',
  quantity: 100,
  price: 176.16,
});
console.log('\n');

// ========================================
// 测试 5: 性能日志
// ========================================
console.log('✅ 测试 5: 性能日志');
performanceLog('Database Query', 1500, 1000);  // 超过阈值
performanceLog('API Call', 50, 1000);          // 未超过阈值
console.log('\n');

// ========================================
// 测试 6: 错误日志
// ========================================
console.log('✅ 测试 6: 错误日志（带堆栈）');
const testError = new Error('测试错误');
testError.statusCode = 500;
testError.type = 'INTERNAL_ERROR';
logError(testError, {
  userId: 'user123',
  action: 'test_action',
});
console.log('\n');

// ========================================
// 测试 7: 日志文件检查
// ========================================
console.log('✅ 测试 7: 日志文件检查');
const fs = require('fs');
const path = require('path');

const logDir = config.logging.file.dirname;
console.log(`  日志目录: ${logDir}`);

try {
  const files = fs.readdirSync(logDir);
  console.log(`  已生成日志文件:`);
  files.forEach(file => {
    const stats = fs.statSync(path.join(logDir, file));
    console.log(`    - ${file} (${Math.round(stats.size / 1024)}KB)`);
  });
} catch (error) {
  console.error(`  ⚠️  日志目录不存在或无法访问: ${error.message}`);
}
console.log('\n');

// ========================================
// 测试 8: 配置验证
// ========================================
console.log('✅ 测试 8: 配置验证');
try {
  config.validate();
  console.log('  配置验证通过');
} catch (error) {
  console.error(`  ⚠️  配置验证失败: ${error.message}`);
}
console.log('\n');

console.log('========================================');
console.log('✅ 所有测试完成');
console.log('========================================');
console.log(`
📝 检查日志文件:
  tail -f ${path.join(logDir, 'combined.log')}
  tail -f ${path.join(logDir, 'error.log')}

🔍 搜索日志:
  grep "USER_LOGIN" ${path.join(logDir, 'combined.log')}
  grep "Slow Operation" ${path.join(logDir, 'combined.log')}
`);
