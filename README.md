# MarketBook

AI 驱动的交易论坛与模拟盘平台，面向交易学习与策略交流。

---

## 快速开始

```bash
npm install
npm start
```

访问 http://localhost:3000

**当前可用功能**：
- ✅ 用户注册/登录（JWT认证）
- ✅ 用户中心（Dashboard）
- ✅ 模拟盘交易（创建账户、买入/卖出、查看持仓）
- ✅ 真实行情API（Yahoo Finance，支持全球市场，智能降级）
- ✅ 实时行情显示（主流美股，5秒自动刷新，盈亏实时计算）

---

## 项目状态

| 模块       | 状态     | 说明                               |
|------------|----------|------------------------------------|
| 用户认证   | ✅ 完成  | 注册、登录、JWT、前后端打通        |
| 用户中心   | ✅ 完成  | Dashboard、账户统计、导航栏        |
| 模拟盘     | ✅ 完成  | 创建账户、下单、持仓查询、交易历史 |
| 真实行情   | ✅ 完成  | Yahoo Finance API、全球市场支持    |
| 盈亏计算   | ✅ 完成  | 基于实时市价计算持仓盈亏和总资产   |
| 生产部署   | ✅ 完成  | Docker、CI/CD、监控、性能测试      |
| 论坛       | 未实现   | 计划中                             |

**技术架构**：
- 数据存储：内存存储（memoryStore）+ MongoDB迁移工具已就绪
- 认证：JWT Token + 安全加固（Helmet、CORS、频率限制）
- 行情：Yahoo Finance真实行情API + 智能降级（自动回退到模拟模式）
- 前端：原生JS + Fetch API + 实时刷新
- 生产就绪：Docker容器化 + CI/CD + 错误监控 + 性能测试

详见 [开发进度跟踪.md](./开发进度跟踪.md)

---

## 主要功能

### 1. 用户认证 ✅
- 注册新用户（邮箱+密码）
- 登录获取Token
- 受保护路由的JWT验证
- 登录态保持（localStorage）

### 2. 用户中心 ✅
- 账户统计（余额、总资产、持仓数量）
- 功能卡片入口（模拟盘、学习中心）
- 统一导航栏

### 3. 模拟盘 ✅
- 创建模拟盘账户（初始100,000元）
- 买入股票（股票代码、数量、价格）
- 卖出股票（持仓列表、数量、价格）
- 查看持仓（实时价格、盈亏、盈亏率）
- 交易历史（买入/卖出记录、时间、价格）

### 4. 真实行情API ✅
- **数据源**：Yahoo Finance（免费，无需API Key）
- **支持市场**：美股、A股、港股、欧洲、日本等全球主要市场
- **功能**：实时报价、批量查询、股票搜索、历史K线
- **智能降级**：真实API失败时自动回退到模拟模式（价格每5秒波动±2%）
- **前端集成**：持仓实时更新、下单实时报价、账户总览实时计算
- **配置**：环境变量 `MARKET_DATA_MODE=real` 启用真实行情（默认simulation）

详见：[docs/REAL_MARKET_DATA_INTEGRATION.md](./docs/REAL_MARKET_DATA_INTEGRATION.md)

---

## 开发规范

- **进度跟踪**：查看 [开发进度跟踪.md](./开发进度跟踪.md)
- **开发计划**：参考 [开发计划.md](./开发计划.md)
- **开发日志**：记录在 [开发日志.md](./开发日志.md)
- **结构**：遵循 [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)

---

## 文档索引

| 文档         | 用途                 |
|--------------|----------------------|
| **[开发进度跟踪.md](./开发进度跟踪.md)** | **当前进度、完成情况（必读）** |
| **[开发计划.md](./开发计划.md)** | **实施计划与任务清单** |
| [开发日志.md](./开发日志.md) | 每日开发记录、问题追踪 |
| [项目现状说明.md](./项目现状说明.md) | 完成情况、待办       |
| [docs/路线图.md](./docs/路线图.md) | 短期/中期/长期目标   |
| [docs/](./docs/) | 项目规划、历史归档   |

---

## 生产就绪功能 ✅

MarketBook 已完成生产环境部署准备，包括：

### 安全加固
- ✅ Helmet 安全头（XSS、点击劫持防护）
- ✅ CORS 白名单配置
- ✅ 请求频率限制（防止API滥用）
- ✅ JWT Token 认证与刷新机制

### 监控与日志
- ✅ Sentry 错误监控集成
- ✅ Winston 分级日志系统
- ✅ 健康检查端点（/health、/health/live、/health/ready）

### 容器化与CI/CD
- ✅ Docker 多阶段构建（开发/生产环境分离）
- ✅ docker-compose 编排（开发/生产配置）
- ✅ GitHub Actions CI/CD（自动测试、构建、部署）

### 测试与质量
- ✅ 单元测试（180+ 测试用例，核心模块100%通过率）
- ✅ 集成测试（完整业务流程验证）
- ✅ 性能测试（Artillery负载测试/压力测试）

### 数据迁移
- ✅ 内存存储 → MongoDB 迁移工具
- ✅ 平滑迁移脚本（数据验证、回滚机制）

### 文档完善
- ✅ [生产部署指南](./README_PRODUCTION.md)（6.3KB完整文档）
- ✅ [Docker快速启动](./docs/DOCKER_GUIDE.md)（4.7KB）
- ✅ [CI/CD使用指南](./docs/CI_CD_GUIDE.md)（6.7KB）
- ✅ [Sentry监控指南](./docs/SENTRY_GUIDE.md)（6.3KB）
- ✅ [性能测试指南](./docs/PERFORMANCE_TESTING.md)（8.3KB）
- ✅ [真实行情API集成](./docs/REAL_MARKET_DATA_INTEGRATION.md)（5KB）

---

## 技术栈

- **后端**：Node.js + Express
- **数据存储**：内存存储（memoryStore）+ MongoDB迁移工具
- **认证**：JWT (jsonwebtoken) + bcryptjs
- **行情API**：Yahoo Finance（真实行情）+ 智能降级
- **安全**：Helmet + CORS + 频率限制
- **监控**：Sentry（错误监控）+ Winston（日志）
- **测试**：Jest（单元/集成测试）+ Artillery（性能测试）
- **容器化**：Docker + docker-compose
- **CI/CD**：GitHub Actions
- **前端**：原生HTML/CSS/JS + Fetch API

---

## 下一步计划

1. **可选扩展功能**：
   - 学习中心内容填充（交易教程、文章、视频）
   - 策略分析与回测功能
   - 社区论坛（发帖、评论、用户排行榜）
2. **持续优化**：
   - 监控真实行情API成功率（Sentry Dashboard）
   - 性能优化（Redis缓存、数据库索引）
   - 用户体验改进（响应式设计、移动端适配）
