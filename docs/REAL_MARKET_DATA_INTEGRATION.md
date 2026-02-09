# 真实行情 API 接入指南

> 本文档说明如何在 MarketBook 项目中启用 Yahoo Finance 真实行情数据

---

## 快速开始

### 1. 环境变量配置

在 `.env` 文件中添加：

```bash
# 行情数据模式
MARKET_DATA_MODE=real       # 使用真实 API（生产环境）
# MARKET_DATA_MODE=simulation  # 使用模拟数据（开发环境，默认）
```

### 2. 启动服务

```bash
# 开发环境（模拟模式）
npm run dev

# 生产环境（真实行情）
MARKET_DATA_MODE=real npm start
```

---

## 技术实现

### 核心架构

```
marketDataService.js (智能路由层)
    ├─ MODE=real   → yahooFinanceService.js (Yahoo Finance API)
    └─ MODE=simulation → 内存缓存 + 价格波动算法
```

### 智能降级机制

**真实模式（real）**：
1. 优先调用 Yahoo Finance API
2. API 失败或超时时，自动降级到模拟模式
3. 日志记录降级原因（便于调试）

**模拟模式（simulation）**：
- 直接使用内存缓存 + 随机价格波动
- 每 5 秒自动更新价格（±2% 波动）

---

## Yahoo Finance API 集成

### 依赖库

使用 `yahoo-finance2` v3.13.0（无需 API Key，免费使用）

```bash
npm install yahoo-finance2
```

### 核心代码示例

```javascript
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

// 获取单个股票行情
const quote = await yahooFinance.quote('AAPL');

// 搜索股票
const results = await yahooFinance.search('Tesla');
```

### 已实现功能

| 功能 | 文件 | 说明 |
|------|------|------|
| 单个股票行情查询 | `yahooFinanceService.js` | `getQuote(symbol)` |
| 批量股票查询 | `yahooFinanceService.js` | `getBatchQuotes([symbols])` |
| 股票搜索 | `yahooFinanceService.js` | `searchSymbols(keyword)` |
| 历史 K 线数据 | `yahooFinanceService.js` | `getHistoricalData(symbol, start, end)` |
| 缓存机制 | `yahooFinanceService.js` | 1 分钟缓存 TTL，减少 API 调用 |

---

## API 限流与最佳实践

### Yahoo Finance 限制

Yahoo Finance 对请求频率有限制：

| 限制类型 | 阈值 | 触发条件 |
|---------|------|---------|
| IP 限流 | ~2000 请求/小时 | 同一 IP 地址短时间大量请求 |
| 429 错误 | Too Many Requests | 触发限流后返回 429 状态码 |

### 应对策略

**1. 缓存优化**

```javascript
// 已实现：1 分钟缓存
const CACHE_TTL = 60 * 1000; // 可调整为 3-5 分钟

// 建议生产环境缓存策略：
// - 交易时段：1-3 分钟缓存
// - 盘后时段：5-10 分钟缓存
```

**2. 请求批量化**

```javascript
// ✅ 推荐：批量获取多个股票
const quotes = await marketDataService.getBatchQuotes(['AAPL', 'GOOGL', 'TSLA']);

// ❌ 避免：循环调用单个接口
for (const symbol of symbols) {
    await marketDataService.getQuote(symbol); // 会被限流
}
```

**3. 错误处理与降级**

```javascript
// 真实模式失败时自动降级
if (MODE === 'real') {
    try {
        return await yahooFinance.getQuote(symbol);
    } catch (error) {
        logger.warn('Real API failed, falling back to simulation');
        // 降级到模拟数据
    }
}
```

**4. 生产环境建议**

- **代理轮换**：使用多个 IP 代理（分散请求）
- **请求间隔**：单次请求后延迟 100-200ms
- **Redis 缓存**：跨服务器共享缓存（避免重复请求）
- **WebSocket 订阅**：考虑使用实时数据 WebSocket（如 Finnhub、IEX Cloud）

---

## 测试验证

### 单元测试

```bash
# 测试真实行情 API
cd /root/.openclaw/workspace
MARKET_DATA_MODE=real node -e "
const marketDataService = require('./src/services/marketDataService');
marketDataService.getQuote('AAPL').then(quote => {
    console.log('Apple 当前价格:', quote.currentPrice);
});
"
```

### 集成测试

```bash
# 启动服务（真实模式）
MARKET_DATA_MODE=real npm start

# 访问行情查询 API
curl http://localhost:3000/api/trading/quotes/AAPL

# 批量查询
curl "http://localhost:3000/api/trading/quotes?symbols=AAPL,GOOGL,TSLA"
```

---

## 监控与日志

### 日志级别

```javascript
// 真实模式日志示例
[INFO]: [YahooFinance] Fetching quote: AAPL
[INFO]: [YahooFinance] Quote fetched successfully: AAPL @ $175.50
[WARN]: [MarketData] Real API failed for AAPL, falling back to simulation
[ERROR]: [YahooFinance] Failed to fetch quote for AAPL: 429 Too Many Requests
```

### 关键指标

在生产环境应监控：

1. **API 成功率**：真实 API 调用成功次数 / 总调用次数
2. **降级频率**：模拟模式降级次数
3. **缓存命中率**：缓存命中 / 总查询次数
4. **响应时间**：API 平均响应时间

---

## 常见问题

### Q1: 遇到 429 错误怎么办？

**原因**：短时间内请求过多，触发 Yahoo Finance 限流。

**解决方案**：
1. 等待 5-10 分钟后重试
2. 增加缓存时间（修改 `CACHE_TTL`）
3. 降低请求频率（批量查询 + 增加间隔）
4. 临时切换到模拟模式：`MARKET_DATA_MODE=simulation`

### Q2: 如何扩展到其他数据源？

在 `yahooFinanceService.js` 中添加其他 API（如 Alpha Vantage、IEX Cloud）：

```javascript
// 示例：Alpha Vantage 备用数据源
if (yahooFinanceFailed) {
    return await alphaVantageService.getQuote(symbol);
}
```

### Q3: 模拟模式的价格准确吗？

**不准确**。模拟模式仅用于开发和演示：
- 基础价格固定（如 AAPL $175.50）
- 价格每 5 秒随机波动 ±2%
- 不反映真实市场情况

**生产环境必须使用真实模式（`MARKET_DATA_MODE=real`）**。

### Q4: 支持哪些股票市场？

Yahoo Finance 支持：
- 🇺🇸 美国股票（NASDAQ、NYSE）：如 AAPL、GOOGL、TSLA
- 🇨🇳 中国 A 股：需添加后缀（如 600519.SS 茅台）
- 🇭🇰 香港股票：需添加后缀（如 0700.HK 腾讯）
- 🇬🇧 英国、🇩🇪 德国、🇯🇵 日本等全球主要市场

---

## 附录

### 相关文件

| 文件 | 说明 |
|------|------|
| `src/services/marketDataService.js` | 行情数据智能路由层（200+ 行）|
| `src/services/yahooFinanceService.js` | Yahoo Finance API 封装（225+ 行）|
| `src/routes/trading.js` | 行情查询路由（3 个端点）|
| `docs/REAL_MARKET_DATA_INTEGRATION.md` | 本文档 |

### API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/trading/quotes/:symbol` | 查询单个股票行情 |
| GET | `/api/trading/quotes?symbols=A,B,C` | 批量查询行情 |
| GET | `/api/trading/market/symbols?keyword=apple` | 搜索股票 |

### 环境变量完整清单

```bash
# .env 文件
NODE_ENV=production
MARKET_DATA_MODE=real

# 可选：缓存配置（需自行实现 Redis）
REDIS_URL=redis://localhost:6379
MARKET_CACHE_TTL=180000  # 3 分钟
```

---

## 更新日志

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-02-09 | v1.0.0 | 🎉 初始版本，完成 Yahoo Finance API 集成 |

---

## 联系与支持

- **项目仓库**: https://github.com/fisher-byte/Marketbook
- **问题反馈**: 提交 GitHub Issue
- **技术支持**: MarketBook 开发团队

---

**祝开发顺利！📈**
