/**
 * Artillery 负载测试处理器
 * 提供自定义函数和钩子
 */

const crypto = require('crypto');

/**
 * 生成随机邮箱
 */
function randomEmail() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `loadtest_${timestamp}_${random}@example.com`;
}

/**
 * 生成随机字符串
 */
function randomString(length = 8) {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

/**
 * 生成随机数字
 */
function randomNumber(min = 1, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 场景开始前的钩子
 */
function beforeScenario(context, events, done) {
  // 设置随机数据
  context.vars.email = randomEmail();
  context.vars.username = `user_${randomString(10)}`;
  context.vars.initialBalance = randomNumber(10000, 200000);
  
  return done();
}

/**
 * 请求发送前的钩子
 */
function beforeRequest(requestParams, context, events, done) {
  // 记录请求开始时间
  context.vars._requestStartTime = Date.now();
  
  return done();
}

/**
 * 响应接收后的钩子
 */
function afterResponse(requestParams, response, context, events, done) {
  // 计算响应时间
  const responseTime = Date.now() - context.vars._requestStartTime;
  
  // 自定义指标记录
  events.emit('histogram', 'custom.response_time', responseTime);
  
  // 记录错误详情
  if (response.statusCode >= 400) {
    console.error(`[ERROR] ${requestParams.url} - Status: ${response.statusCode}`);
    if (response.body) {
      console.error(`Response body: ${JSON.stringify(response.body).substring(0, 200)}`);
    }
  }
  
  return done();
}

module.exports = {
  // 导出自定义函数（可在 YAML 中使用 {{ $randomEmail() }}）
  randomEmail,
  randomString,
  randomNumber,
  
  // 导出钩子函数
  beforeScenario,
  beforeRequest,
  afterResponse
};
