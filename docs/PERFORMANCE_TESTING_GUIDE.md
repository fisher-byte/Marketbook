# MarketBook 性能测试指南

## 📋 目录

- [概述](#概述)
- [测试工具](#测试工具)
- [测试类型](#测试类型)
- [快速开始](#快速开始)
- [测试配置详解](#测试配置详解)
- [测试场景](#测试场景)
- [性能指标解读](#性能指标解读)
- [性能优化建议](#性能优化建议)
- [故障排查](#故障排查)
- [最佳实践](#最佳实践)

---

## 概述

MarketBook 使用 [Artillery](https://www.artillery.io/) 作为性能测试工具，提供三种测试类型：

| 测试类型 | 目的 | 持续时间 | 并发用户 |
|---------|------|----------|----------|
| **负载测试** (Load Test) | 验证正常负载下的性能 | 45秒 | 2-50 |
| **压力测试** (Stress Test) | 找出系统性能瓶颈 | 210秒 | 1-200 |
| **耐久性测试** (Endurance Test) | 检测内存泄漏和长期稳定性 | 1小时 | 10 |

---

## 测试工具

### Artillery 简介

Artillery 是一个现代化的负载测试工具，特点：
- 基于 Node.js，易于集成
- 支持 HTTP/WebSocket/Socket.IO
- 可编写复杂的用户行为场景
- 内置性能指标统计
- 支持多种报告格式（JSON/HTML/CSV）

### 安装

```bash
# 项目依赖（已安装）
npm install --save-dev artillery

# 全局安装（可选）
npm install -g artillery
```

---

## 测试类型

### 1. 负载测试 (Load Test)

**目的**: 验证系统在预期负载下的性能表现

**测试阶段**:
1. **热身阶段** (5秒): 2个并发用户/秒
2. **持续负载** (30秒): 20个并发用户/秒
3. **压力冲击** (10秒): 50个并发用户/秒

**性能阈值**:
- 错误率 < 1%
- P95响应时间 < 500ms
- P99响应时间 < 1000ms

**适用场景**:
- 日常性能回归测试
- 新功能上线前验证
- CI/CD 流水线集成

---

### 2. 压力测试 (Stress Test)

**目的**: 找出系统的性能极限和瓶颈

**测试阶段**:
1. **渐进加压** (60秒): 从1个用户逐步增加到100个
2. **高负载维持** (120秒): 保持100个并发用户
3. **极限冲击** (30秒): 激增到200个并发用户

**性能阈值**:
- 错误率 < 5%
- P95响应时间 < 2秒
- P99响应时间 < 5秒

**适用场景**:
- 发现性能瓶颈
- 容量规划（需要多少服务器？）
- 确定系统的临界点

---

### 3. 耐久性测试 (Endurance Test / Soak Test)

**目的**: 检测内存泄漏和长期运行的稳定性

**测试阶段**:
1. **持续中等负载** (1小时): 10个并发用户/秒

**性能阈值**:
- 错误率 < 2%
- P95响应时间 < 1秒
- P99响应时间 < 3秒

**适用场景**:
- 生产环境上线前
- 重大版本发布前
- 排查内存泄漏问题

---

## 快速开始

### 前置条件

1. **启动服务器**
   ```bash
   npm start
   # 或使用开发模式
   npm run dev
   ```

2. **验证服务器运行**
   ```bash
   curl http://localhost:3000/health
   ```

---

### 运行测试

#### 方式1: 使用测试脚本（推荐）

```bash
# 查看帮助
./scripts/run-performance-tests.sh --help

# 运行负载测试
./scripts/run-performance-tests.sh --load

# 运行压力测试
./scripts/run-performance-tests.sh --stress

# 运行耐久性测试（需要1小时）
./scripts/run-performance-tests.sh --endurance

# 运行快速测试（简化版）
./scripts/run-performance-tests.sh --quick

# 运行所有测试（不包括耐久性测试）
./scripts/run-performance-tests.sh --all

# 运行完整测试（包括耐久性测试）
./scripts/run-performance-tests.sh --full

# 清理旧测试结果
./scripts/run-performance-tests.sh --cleanup
```

#### 方式2: 直接使用 Artillery

```bash
# 负载测试
artillery run tests/performance/load-test.yml

# 压力测试
artillery run tests/performance/stress-test.yml

# 耐久性测试
artillery run tests/performance/endurance-test.yml

# 生成HTML报告
artillery run tests/performance/load-test.yml --output report.json
artillery report report.json --output report.html
```

---

## 测试配置详解

### 配置文件结构

```yaml
config:
  target: "http://localhost:3000"  # 测试目标地址
  
  phases:                          # 测试阶段
    - duration: 10                 # 持续10秒
      arrivalRate: 5               # 每秒5个新用户
      name: "Warm up"
  
  timeout: 10                      # 请求超时时间（秒）
  
  ensure:                          # 性能断言
    maxErrorRate: 1                # 错误率阈值
    p95: 500                       # P95响应时间阈值（毫秒）

scenarios:                         # 测试场景
  - name: "User Flow"
    weight: 50                     # 场景权重（50%流量）
    flow:
      - post:                      # HTTP请求
          url: "/api/auth/login"
          json:
            email: "test@test.com"
            password: "password"
```

---

### 关键参数说明

#### 1. Phases（测试阶段）

- **duration**: 阶段持续时间（秒）
- **arrivalRate**: 每秒新增的虚拟用户数
- **rampTo**: 逐步增加到的目标用户数
- **name**: 阶段名称（用于日志）

```yaml
phases:
  # 固定速率
  - duration: 30
    arrivalRate: 10
  
  # 渐进增长（从10增长到50）
  - duration: 60
    arrivalRate: 10
    rampTo: 50
```

#### 2. Ensure（性能断言）

- **maxErrorRate**: 最大错误率（百分比）
- **p50/p95/p99**: 响应时间百分位数（毫秒）
- **median**: 中位数响应时间

```yaml
ensure:
  maxErrorRate: 1         # 错误率 < 1%
  median: 200             # 中位数 < 200ms
  p95: 500                # 95%请求 < 500ms
  p99: 1000               # 99%请求 < 1000ms
```

#### 3. Scenarios（测试场景）

- **name**: 场景名称
- **weight**: 场景权重（百分比，总和为100）
- **flow**: 请求流程

```yaml
scenarios:
  - name: "Login Flow"
    weight: 30              # 30%的流量
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ testEmail }}"
            password: "{{ testPassword }}"
          capture:          # 捕获响应数据
            - json: "$.token"
              as: "authToken"
          expect:           # 断言
            - statusCode: 200
            - hasProperty: token
```

---

## 测试场景

### 场景1: 用户注册流程

**描述**: 模拟新用户注册

**步骤**:
1. POST `/api/auth/register`
2. 捕获返回的 token

**权重**: 10%

---

### 场景2: 用户登录流程

**描述**: 模拟用户登录

**步骤**:
1. 先注册一个用户
2. 使用相同凭据登录
3. 捕获登录返回的 token

**权重**: 30%

---

### 场景3: 认证API访问

**描述**: 模拟已登录用户访问受保护的API

**步骤**:
1. 注册用户并获取token
2. 使用token查询账户列表

**权重**: 25%

---

### 场景4: 模拟盘完整交易流程

**描述**: 模拟真实交易流程

**步骤**:
1. 注册用户
2. 创建模拟盘账户
3. 查询股票实时行情
4. 买入股票
5. 查询持仓

**权重**: 20%

---

### 场景5: 高频行情查询

**描述**: 模拟高频行情数据查询

**步骤**:
1. 注册用户
2. 查询单个股票行情
3. 批量查询多个股票行情
4. 搜索股票

**权重**: 15%

---

### 场景6: 健康检查

**描述**: 轻量级健康检查

**步骤**:
1. GET `/health`

**权重**: 5%

---

## 性能指标解读

### 响应时间指标

| 指标 | 说明 | 目标值 |
|-----|------|--------|
| **min** | 最快响应时间 | - |
| **max** | 最慢响应时间 | - |
| **median (P50)** | 中位数，50%请求的响应时间 | < 200ms |
| **p95** | 95%请求的响应时间 | < 500ms |
| **p99** | 99%请求的响应时间 | < 1000ms |

**解读**:
- P50: 普通用户的体验
- P95: 绝大多数用户的体验
- P99: 极端情况下的用户体验

**示例**:
```
http.response_time:
  min: 12
  max: 1523
  median: 156        ✅ 优秀
  p95: 432           ✅ 优秀
  p99: 897           ✅ 优秀
```

---

### 请求统计指标

| 指标 | 说明 |
|-----|------|
| **scenarios.completed** | 完成的场景数 |
| **scenarios.failed** | 失败的场景数 |
| **http.requests** | 总请求数 |
| **http.responses** | 总响应数 |
| **http.codes.200** | HTTP 200响应数 |
| **http.codes.4xx** | 4xx错误数 |
| **http.codes.5xx** | 5xx错误数 |

**示例**:
```
scenarios.completed: 1250
scenarios.failed: 5           ⚠️ 错误率 0.4%
http.requests: 6320
http.codes.200: 6280          ✅ 99.4% 成功率
http.codes.500: 40            ⚠️ 需要关注
```

---

### 错误率

```
错误率 = (失败场景数 / 完成场景数) * 100%
```

**阈值**:
- 负载测试: < 1%
- 压力测试: < 5%
- 耐久性测试: < 2%

---

### 吞吐量

| 指标 | 说明 | 单位 |
|-----|------|-----|
| **http.request_rate** | 每秒请求数 (RPS) | requests/sec |
| **scenarios/sec** | 每秒完成的场景数 | scenarios/sec |

**示例**:
```
http.request_rate: 132/sec    # 服务器每秒处理132个HTTP请求
scenarios/sec: 25/sec         # 每秒完成25个用户场景
```

---

## 性能优化建议

### 后端优化

#### 1. 数据库优化

**问题**: 数据库查询慢

**优化方案**:
```javascript
// ❌ 不好：N+1查询
const users = await User.find();
for (const user of users) {
  const profile = await UserProfile.findOne({ userId: user.id });
}

// ✅ 好：使用聚合查询
const users = await User.aggregate([
  {
    $lookup: {
      from: 'userprofiles',
      localField: '_id',
      foreignField: 'userId',
      as: 'profile'
    }
  }
]);
```

**建议**:
- 添加索引（email、accountId等常用查询字段）
- 使用连接池
- 启用查询缓存
- 考虑使用 Redis 缓存热点数据

---

#### 2. 内存存储优化

**问题**: 内存存储在高并发下性能下降

**优化方案**:
```javascript
// ❌ 不好：遍历全部数据
findOne(query) {
  for (const item of this.items) {
    if (item.email === query.email) {
      return item;
    }
  }
}

// ✅ 好：使用 Map 索引
constructor() {
  this.items = new Map();
  this.emailIndex = new Map();
}

findOne(query) {
  if (query.email) {
    const id = this.emailIndex.get(query.email);
    return this.items.get(id);
  }
}
```

---

#### 3. 并发控制

**问题**: 同时处理太多请求导致服务崩溃

**优化方案**:
```javascript
// 使用队列限制并发
const pLimit = require('p-limit');
const limit = pLimit(10);  // 最多10个并发

const promises = requests.map(req => 
  limit(() => processRequest(req))
);
await Promise.all(promises);
```

---

#### 4. 响应压缩

```javascript
const compression = require('compression');
app.use(compression());
```

---

### 前端优化

#### 1. 减少HTTP请求

```javascript
// ❌ 不好：多次单独请求
const aapl = await fetch('/api/trading/quotes/AAPL');
const googl = await fetch('/api/trading/quotes/GOOGL');
const msft = await fetch('/api/trading/quotes/MSFT');

// ✅ 好：批量请求
const quotes = await fetch('/api/trading/quotes?symbols=AAPL,GOOGL,MSFT');
```

---

#### 2. 启用缓存

```javascript
// 设置缓存策略
app.get('/api/trading/quotes/:symbol', (req, res) => {
  res.set('Cache-Control', 'public, max-age=5');  // 缓存5秒
  // ...
});
```

---

### 架构优化

#### 1. 负载均衡

```
用户 → Nginx → [Node.js 实例1, 实例2, 实例3]
```

**Nginx 配置示例**:
```nginx
upstream marketbook {
  server 127.0.0.1:3000;
  server 127.0.0.1:3001;
  server 127.0.0.1:3002;
}

server {
  listen 80;
  location / {
    proxy_pass http://marketbook;
  }
}
```

---

#### 2. 缓存层

```
用户 → API → [Redis 缓存] → MongoDB
```

**实现**:
```javascript
async function getQuote(symbol) {
  // 先查缓存
  const cached = await redis.get(`quote:${symbol}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 查数据库
  const quote = await marketDataService.getQuote(symbol);
  
  // 写入缓存（5秒过期）
  await redis.setex(`quote:${symbol}`, 5, JSON.stringify(quote));
  
  return quote;
}
```

---

#### 3. CDN加速

- 静态资源（CSS/JS/图片）托管到CDN
- 使用 CloudFlare、阿里云CDN等

---

## 故障排查

### 问题1: 服务器无响应

**症状**:
```
Error: ECONNREFUSED 127.0.0.1:3000
```

**原因**: 服务器未启动

**解决**:
```bash
npm start
```

---

### 问题2: 高错误率

**症状**:
```
http.codes.500: 1200
scenarios.failed: 450
```

**排查步骤**:
1. 查看服务器日志: `tail -f logs/error.log`
2. 检查是否有异常堆栈
3. 确认是否触发了频率限制

**常见原因**:
- 数据库连接耗尽
- 内存不足
- 频率限制过严
- 业务逻辑错误

---

### 问题3: 响应时间过长

**症状**:
```
p95: 5200ms  ⚠️
p99: 12000ms ⚠️
```

**排查工具**:
```javascript
// 添加性能监控中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.url} - ${duration}ms`);
    }
  });
  next();
});
```

**优化方向**:
- 数据库查询优化
- 添加缓存
- 减少同步I/O操作

---

### 问题4: 内存泄漏

**症状**:
- 耐久性测试中内存持续增长
- 最终服务器崩溃

**排查工具**:
```bash
# 使用 node --inspect 启动
node --inspect src/index.js

# 使用 Chrome DevTools Memory Profiler
# 打开 chrome://inspect
```

**常见原因**:
- 全局变量累积
- 定时器未清理
- 事件监听器未移除
- 闭包持有大对象

---

## 最佳实践

### 1. 测试环境隔离

- 不要在生产环境运行性能测试
- 使用独立的测试数据库
- 使用 `.env.test` 配置测试环境

---

### 2. 测试前预热

```bash
# 发送少量请求让服务器预热
artillery quick --count 5 --num 10 http://localhost:3000/health
```

---

### 3. 渐进式测试

1. 先运行负载测试（低负载）
2. 如果通过，再运行压力测试（高负载）
3. 最后运行耐久性测试（长时间）

---

### 4. 监控服务器资源

```bash
# 监控CPU/内存
htop

# 监控网络连接
netstat -an | grep 3000 | wc -l

# 监控磁盘I/O
iostat -x 1
```

---

### 5. 建立性能基准

- 每次测试后保存结果
- 对比历史数据，发现性能退化
- 在 CI/CD 中设置性能门槛

```bash
# 保存基准
artillery run tests/performance/load-test.yml --output baseline.json

# 对比当前结果
artillery run tests/performance/load-test.yml --output current.json
# 手动对比或使用工具
```

---

### 6. 模拟真实用户行为

```yaml
flow:
  - think: 5    # 用户思考5秒
  - post:
      url: "/api/auth/login"
  - think: 10   # 登录后10秒才进行下一步
  - get:
      url: "/api/trading/accounts"
```

---

### 7. 定期运行性能测试

- 每周运行负载测试
- 每次重大版本发布前运行完整测试
- 集成到 CI/CD 流水线

---

### 8. 记录性能指标

创建性能日志:

```bash
# 追加到性能日志
./scripts/run-performance-tests.sh --load | tee -a performance-history.log
```

---

## 测试结果示例

### 成功的负载测试

```
Summary report @ 16:32:45(+0800)
--------------------------------

Scenarios launched:  1250
Scenarios completed: 1250
Requests completed:  6250

Response time (msec):
  min: 12
  max: 523
  median: 87
  p95: 234
  p99: 412

Scenario counts:
  User Registration Flow: 125 (10%)
  User Login Flow: 375 (30%)
  Authenticated API Access: 312 (25%)
  Trading Flow: 250 (20%)
  Market Data Queries: 188 (15%)

Codes:
  200: 6250

✅ 所有性能阈值通过
```

---

### 失败的压力测试

```
Summary report @ 17:15:33(+0800)
--------------------------------

Scenarios launched:  5000
Scenarios completed: 4523
Requests completed:  18234

Response time (msec):
  min: 23
  max: 15234  ⚠️
  median: 456
  p95: 3421   ❌ 超过阈值 (2000ms)
  p99: 8932   ❌ 超过阈值 (5000ms)

Codes:
  200: 17834
  500: 400    ⚠️ 服务器错误

❌ 错误率: 9.5% (超过阈值 5%)
❌ P95响应时间超标
❌ P99响应时间超标

建议:
- 检查服务器日志中的500错误
- 优化慢查询
- 增加服务器资源
```

---

## 附录

### 相关文件

```
tests/performance/
├── load-test.yml           # 负载测试配置
├── stress-test.yml         # 压力测试配置
├── endurance-test.yml      # 耐久性测试配置
└── results/                # 测试结果目录
    ├── load-test-20260209_161234.json
    ├── load-test-20260209_161234.log
    └── load-test-20260209_161234.html

scripts/
└── run-performance-tests.sh  # 测试运行脚本

docs/
└── PERFORMANCE_TESTING_GUIDE.md  # 本文档
```

---

### 参考链接

- [Artillery 官方文档](https://www.artillery.io/docs)
- [性能测试最佳实践](https://www.artillery.io/docs/guides/guides/test-script-reference)
- [Node.js 性能优化](https://nodejs.org/en/docs/guides/simple-profiling/)

---

**文档版本**: 1.0  
**最后更新**: 2026-02-09  
**维护者**: MarketBook Team
