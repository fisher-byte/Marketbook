# 功能规划：Alpaca 真实行情接入

## 现状
- 模拟交易使用 mock 固定价格（AAPL:185, GOOGL:140 等）
- TradingService.getPrice() 返回硬编码值

## 目标
- 接入 Alpaca Data API 获取美股实时/最新价格
- 未配置 Alpaca 或请求失败时回退到 mock

## 实施拆分表

| 步骤 | 内容 | 状态 |
|------|------|------|
| 1 | 创建 AlpacaPriceService，封装价格获取逻辑 | ✅ 已完成 |
| 2 | 使用 Alpaca REST API 获取 latest trade/quote | ✅ 已完成 |
| 3 | 无配置或失败时回退 mock | ✅ 已完成 |
| 4 | TradingService 与 LeaderboardService 接入新价格服务 | ✅ 已完成 |
| 5 | 更新 .env.example 与文档 | ✅ 已完成 |

## 涉及文件
- `packages/api/src/services/AlpacaPriceService.js`（新建）
- `packages/api/src/services/TradingService.js`
- `packages/api/src/services/LeaderboardService.js`
- `packages/api/.env.example`

## 完成标准
- 配置 ALPACA_API_KEY + ALPACA_API_SECRET 后，交易使用 Alpaca 价格
- 未配置时行为与现有一致（mock）
