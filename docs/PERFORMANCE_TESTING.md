# 性能测试指南

> MarketBook 项目性能测试完整文档  
> 基于 Artillery 负载测试框架

---

## 📋 目录

1. [快速开始](#快速开始)
2. [测试套件说明](#测试套件说明)
3. [测试指标解读](#测试指标解读)
4. [性能基准](#性能基准)
5. [常见问题](#常见问题)
6. [高级用法](#高级用法)

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install --save-dev artillery
```

### 2. 准备测试环境

确保 MarketBook 服务运行在 `http://localhost:3000`：

```bash
# 启动应用
npm start

# 或使用 pm2
pm2 start ecosystem.config.js
```

### 3. 创建测试用户（首次运行）

```bash
# 使用 curl 创建测试账户
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test1234",
    "username": "loadtest_user"
  }'
```

### 4. 运行测试

```bash
# 负载测试（推荐作为日常测试）
npm run test:load

# 压力测试（找到系统极限）
npm run test:stress

# 或直接使用 Artillery
artillery run tests/performance/load-test.yml
artillery run tests/performance/stress-test.yml
```

---

## 📊 测试套件说明

### Load Test (负载测试)

**文件**: `tests/performance/load-test.yml`

**目标**: 验证系统在正常、高峰负载下的表现

**测试阶段**:
| 阶段 | 持续时间 | 并发数 | 说明 |
|------|----------|--------|------|
| Warm-up | 10秒 | 5 req/s | 预热阶段，让系统稳定 |
| Normal Load | 30秒 | 20 req/s | 模拟正常业务流量 |
| Peak Load | 30秒 | 50 req/s | 模拟高峰时段流量 |
| Stress Test | 20秒 | 100 req/s | 压力测试，观察系统边界 |

**测试场景**:
- **健康检查** (10% 流量): `GET /health`
- **用户注册+登录** (20% 流量): 完整认证流程
- **模拟盘完整流程** (40% 流量): 创建账户→查询行情→下单→查持仓
- **高频行情查询** (30% 流量): 批量行情、股票搜索

**性能目标**:
- 错误率 < 1%
- P95 响应时间 < 500ms
- P99 响应时间 < 1000ms

---

### Stress Test (压力测试)

**文件**: `tests/performance/stress-test.yml`

**目标**: 找到系统的极限并发能力和崩溃点

**测试阶段**:
| 阶段 | 持续时间 | 并发数 | 说明 |
|------|----------|--------|------|
| Warm-up | 10秒 | 10 req/s | 预热 |
| Ramp-up | 60秒 | 10→100 req/s | 逐步增加负载 |
| Extreme Load | 60秒 | 200 req/s | 极限负载持续测试 |
| Spike Test | 30秒 | 500 req/s | 突发流量冲击 |
| Recovery | 30秒 | 500→10 req/s | 系统恢复能力测试 |

**测试场景**:
- **核心 API 压力** (50%): 登录+行情查询
- **数据库写入压力** (30%): 大量用户注册
- **复杂查询压力** (20%): 批量行情查询

**性能目标**:
- 错误率 < 5% (压力测试放宽限制)
- 观察系统在极限负载下的降级表现

---

## 📈 测试指标解读

### 运行测试后的输出示例

```bash
Summary report @ 14:32:15(+0800)
  Scenarios launched:  1000
  Scenarios completed: 998
  Requests completed:  4990
  Mean response/sec:   55.44
  Response time (msec):
    min: 12
    max: 1523
    median: 145.2
    p95: 486.3
    p99: 891.7
  Scenario counts:
    Health Check: 100 (10%)
    Trading Simulation Flow: 400 (40%)
    ...
  Codes:
    200: 4950
    201: 30
    500: 10
  Errors:
    ETIMEDOUT: 2
```

### 关键指标说明

| 指标 | 说明 | 健康标准 |
|------|------|----------|
| **Scenarios completed** | 完成的场景数 | >99% |
| **Mean response/sec** | 平均每秒处理请求数 | 越高越好 |
| **Response time - median** | 中位数响应时间 | <200ms |
| **Response time - p95** | 95%请求响应时间 | <500ms |
| **Response time - p99** | 99%请求响应时间 | <1000ms |
| **Error rate** | 错误率 | <1% (负载测试) <5% (压力测试) |
| **Codes 500/502/503** | 服务器错误数量 | 0 |

### 性能等级划分

| 等级 | P95响应时间 | P99响应时间 | 错误率 |
|------|-------------|-------------|--------|
| 🟢 优秀 | <200ms | <500ms | <0.1% |
| 🟡 良好 | 200-500ms | 500-1000ms | 0.1-1% |
| 🟠 可接受 | 500-1000ms | 1000-2000ms | 1-3% |
| 🔴 需优化 | >1000ms | >2000ms | >3% |

---

## 🎯 性能基准

### 预期性能指标（单机部署，4核8G）

| 场景 | 并发数 | P95响应时间 | 吞吐量 | 错误率 |
|------|--------|-------------|--------|--------|
| 健康检查 | 100 req/s | <50ms | ~100 req/s | 0% |
| 用户登录 | 50 req/s | <200ms | ~50 req/s | <0.5% |
| 行情查询 | 80 req/s | <150ms | ~80 req/s | <0.1% |
| 模拟盘下单 | 30 req/s | <300ms | ~30 req/s | <1% |
| 批量行情 | 50 req/s | <250ms | ~50 req/s | <0.5% |

### 压力测试极限值

- **最大并发**: ~200 req/s（4核8G服务器）
- **突发流量**: 可承受 500 req/s 持续 30秒
- **系统崩溃点**: >800 req/s（预期）

---

## ⚠️ 常见问题

### 1. 测试启动失败：`Connection refused`

**原因**: 应用未启动或端口不正确

**解决**:
```bash
# 检查应用是否运行
curl http://localhost:3000/health

# 启动应用
npm start
```

---

### 2. 大量 `ETIMEDOUT` 错误

**原因**: 服务器处理能力不足，请求堆积超时

**解决**:
- 降低并发数（修改 `arrivalRate`）
- 检查服务器资源（CPU/内存/磁盘IO）
- 优化慢查询（查看日志中的慢请求）

---

### 3. 测试中途崩溃：`ECONNRESET`

**原因**: 服务器进程崩溃或重启

**解决**:
- 查看应用日志：`pm2 logs` 或 `npm start` 输出
- 检查内存泄漏：`node --max-old-space-size=4096 app.js`
- 检查未捕获异常（应启用错误监控）

---

### 4. 401 Unauthorized 错误大量出现

**原因**: 测试用户不存在或token过期

**解决**:
```bash
# 重新创建测试用户
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test1234",
    "username": "loadtest_user"
  }'
```

---

### 5. 响应时间突然飙升

**可能原因**:
- 数据库查询未索引（内存存储不影响）
- JWT token验证性能瓶颈
- 行情数据刷新锁争用
- Node.js 单线程阻塞（CPU密集计算）

**排查方法**:
```bash
# 使用 Artillery 内置性能分析
artillery run --output report.json tests/performance/load-test.yml
artillery report report.json  # 生成 HTML 报告

# 使用 clinic.js 诊断
npm install -g clinic
clinic doctor -- node app.js  # CPU 诊断
clinic bubbleprof -- node app.js  # 异步性能诊断
```

---

## 🔧 高级用法

### 1. 自定义测试目标

修改 YAML 文件的 `config.target`：

```yaml
config:
  target: "https://staging.marketbook.com"  # 测试环境
  # 或
  target: "https://api.marketbook.com"      # 生产环境（慎用！）
```

---

### 2. 生成 HTML 报告

```bash
# 运行测试并保存结果
artillery run --output report.json tests/performance/load-test.yml

# 生成可视化报告
artillery report report.json

# 在浏览器打开 report.json.html
```

---

### 3. 分布式负载测试

使用 Artillery 的 Fargate/Lambda 分布式运行：

```bash
# 安装 Artillery Pro（付费功能）
npm install -g artillery-pro

# AWS Lambda 分布式测试（需配置 AWS 凭证）
artillery run-fargate \
  --region us-east-1 \
  --count 10 \
  tests/performance/load-test.yml
```

---

### 4. 集成到 CI/CD

**.github/workflows/performance-test.yml**:
```yaml
name: Performance Test

on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点运行
  workflow_dispatch:      # 手动触发

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start application
        run: |
          npm start &
          sleep 10  # 等待应用启动
      
      - name: Run load test
        run: npm run test:load
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: report.json.html
```

---

### 5. 自定义场景

编辑 `load-test.yml` 添加新场景：

```yaml
scenarios:
  - name: "Custom Scenario"
    weight: 10
    flow:
      - post:
          url: "/api/custom-endpoint"
          json:
            data: "{{ $randomString() }}"
          expect:
            - statusCode: 200
          capture:
            - json: "$.result"
              as: "customResult"
      
      - think: 2  # 模拟用户思考时间（2秒）
      
      - get:
          url: "/api/another-endpoint/{{ customResult }}"
```

---

### 6. 环境变量配置

```bash
# 使用环境变量覆盖配置
TARGET=https://staging.marketbook.com \
RATE=50 \
DURATION=60 \
artillery run tests/performance/load-test.yml
```

在 YAML 中引用：
```yaml
config:
  target: "{{ $processEnvironment.TARGET }}"
  phases:
    - duration: "{{ $processEnvironment.DURATION }}"
      arrivalRate: "{{ $processEnvironment.RATE }}"
```

---

## 📝 NPM Scripts 配置

在 `package.json` 中添加：

```json
{
  "scripts": {
    "test:load": "artillery run tests/performance/load-test.yml",
    "test:stress": "artillery run tests/performance/stress-test.yml",
    "test:perf": "npm run test:load && npm run test:stress",
    "test:perf:report": "artillery run --output report.json tests/performance/load-test.yml && artillery report report.json"
  }
}
```

---

## 🎓 性能优化建议

### 如果测试结果不理想，可以尝试：

1. **启用 Node.js Cluster 模式**（多核利用）
   ```javascript
   // app.js
   const cluster = require('cluster');
   const os = require('os');
   
   if (cluster.isMaster) {
     const cpuCount = os.cpus().length;
     for (let i = 0; i < cpuCount; i++) {
       cluster.fork();
     }
   } else {
     // 启动应用
     app.listen(3000);
   }
   ```

2. **引入 Redis 缓存**
   - 行情数据缓存（TTL 5秒）
   - JWT token 黑名单缓存
   - 用户会话缓存

3. **数据库查询优化**
   - 为常用查询字段添加索引
   - 使用连接池管理数据库连接
   - 批量查询代替单条查询

4. **限流与降级**
   - 使用 `express-rate-limit` 保护 API
   - 返回缓存数据代替实时计算
   - 熔断机制：错误率超阈值时返回默认值

5. **CDN与静态资源优化**
   - 前端静态资源托管到 CDN
   - Gzip/Brotli 压缩
   - HTTP/2 启用

---

## 📚 参考资料

- [Artillery 官方文档](https://www.artillery.io/docs)
- [性能测试最佳实践](https://www.artillery.io/docs/guides/guides/test-script-reference)
- [Node.js 性能优化指南](https://nodejs.org/en/docs/guides/simple-profiling/)

---

**最后更新**: 2026-02-09  
**维护者**: MarketBook 团队
