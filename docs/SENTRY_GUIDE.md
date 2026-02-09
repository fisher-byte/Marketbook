# Sentry 错误监控集成指南 🔍

> 本指南介绍如何为 MarketBook 配置 Sentry 错误监控，实时追踪生产环境的异常和性能问题。

---

## 📋 目录

1. [为什么需要错误监控](#为什么需要错误监控)
2. [快速开始](#快速开始)
3. [配置详解](#配置详解)
4. [功能特性](#功能特性)
5. [最佳实践](#最佳实践)
6. [常见问题](#常见问题)

---

## 为什么需要错误监控

### 生产环境的挑战

- **用户不报告错误**：大部分用户遇到错误会直接离开，不会主动反馈
- **难以复现**：生产环境的错误往往无法在开发环境复现
- **影响范围未知**：不知道有多少用户受影响
- **性能问题隐蔽**：慢接口和内存泄漏很难察觉

### Sentry 能做什么

- ✅ **自动捕获未处理的异常**（包括Promise拒绝）
- ✅ **追踪错误上下文**（用户信息、请求数据、环境变量）
- ✅ **错误分组与去重**（相同错误自动聚合）
- ✅ **实时报警**（通过邮件/Slack/PagerDuty）
- ✅ **性能监控**（接口响应时间、数据库查询）
- ✅ **Release追踪**（快速定位哪个版本引入了bug）

---

## 快速开始

### 1. 注册 Sentry 账号

1. 访问 [https://sentry.io/](https://sentry.io/)
2. 点击 **Sign Up** 注册免费账号
3. 创建新项目：
   - Platform: **Node.js**
   - Alert frequency: **On every new issue**（每个新错误立即通知）

### 2. 获取 DSN

项目创建后，Sentry 会显示 DSN（Data Source Name）：

```
https://[public_key]@[organization].ingest.sentry.io/[project_id]
```

复制这个 DSN。

### 3. 配置环境变量

在项目根目录创建 `.env` 文件（如果已存在则追加）：

```bash
# Sentry 配置
SENTRY_DSN=https://your-actual-dsn@sentry.io/123456
SENTRY_ENVIRONMENT=production  # 或 staging/development
```

### 4. 启动应用

```bash
npm start
```

现在所有错误都会自动上报到 Sentry！

### 5. 测试错误捕获

访问一个不存在的API端点：

```bash
curl http://localhost:3000/api/test-error
```

然后登录 Sentry 查看错误报告。

---

## 配置详解

### 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `SENTRY_DSN` | Sentry项目DSN（必填） | `https://...@sentry.io/123456` |
| `SENTRY_ENVIRONMENT` | 当前环境 | `production` / `staging` / `development` |
| `NODE_ENV` | 应用环境（自动使用） | `production` / `development` |

### 采样率配置

编辑 `src/config/sentry.js`：

```javascript
Sentry.init({
  // ... 其他配置
  
  // 性能监控采样率（0.0 - 1.0）
  tracesSampleRate: 0.1,  // 10%的请求会被追踪（生产环境推荐）
  
  // Profiling采样率（0.0 - 1.0）
  profilesSampleRate: 0.1,  // 10%的请求会启用性能分析
});
```

**推荐值**：
- **开发环境**：`1.0`（100%，便于调试）
- **生产环境**：`0.1`（10%，减少性能开销和流量成本）
- **高流量应用**：`0.01`（1%）

### 敏感信息过滤

MarketBook 已自动过滤以下敏感字段：
- `password`
- `token`
- `jwt`
- `secret`

如需自定义，编辑 `src/config/sentry.js` 的 `beforeSend` 函数。

---

## 功能特性

### 1. 自动错误捕获

所有未处理的异常都会自动上报：

```javascript
// ❌ 这个错误会被 Sentry 捕获
app.get('/api/test', async (req, res) => {
  throw new Error('未处理的错误！');
});

// ❌ Promise拒绝也会被捕获
app.get('/api/async-error', async (req, res) => {
  await Promise.reject(new Error('异步错误！'));
});
```

### 2. 手动错误捕获

有时需要主动上报非异常的错误信息：

```javascript
const { captureError, captureMessage } = require('./src/config/sentry');

// 捕获错误对象
try {
  await riskyOperation();
} catch (error) {
  captureError(error, { 
    context: '用户下单',
    orderId: 12345 
  });
  // 继续处理...
}

// 捕获消息（警告级别）
captureMessage('数据库连接慢', 'warning');
```

### 3. 用户追踪

追踪错误关联的用户：

```javascript
const { setUser } = require('./src/config/sentry');

// 用户登录后设置
app.post('/api/auth/login', async (req, res) => {
  const user = await authenticateUser(req.body);
  
  // 设置用户上下文（后续错误会自动关联此用户）
  setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
  
  res.json({ token: generateToken(user) });
});

// 用户退出后清除
app.post('/api/auth/logout', (req, res) => {
  setUser(null);
  res.json({ message: '已退出' });
});
```

### 4. 面包屑（Breadcrumbs）

记录错误发生前的用户操作：

```javascript
const { addBreadcrumb } = require('./src/config/sentry');

app.post('/api/trading/orders/buy', async (req, res) => {
  addBreadcrumb({
    category: 'trading',
    message: '用户发起买入订单',
    level: 'info',
    data: {
      symbol: req.body.symbol,
      quantity: req.body.quantity,
    },
  });
  
  // ... 处理买入逻辑
});
```

### 5. 忽略预期错误

某些错误是用户主动触发的，不应视为bug：

编辑 `src/config/sentry.js`：

```javascript
Sentry.init({
  // ...
  ignoreErrors: [
    'AbortError',          // 用户取消请求
    'NetworkError',        // 网络问题（非后端bug）
    'Insufficient Balance', // 业务逻辑错误（余额不足）
  ],
});
```

---

## 最佳实践

### 1. 环境隔离

为不同环境创建独立的 Sentry 项目：

- **Production** → `marketbook-production`
- **Staging** → `marketbook-staging`
- **Development** → 不配置（或使用独立项目）

在 `.env` 中设置不同的 `SENTRY_DSN`。

### 2. Release 追踪

每次部署时标记版本：

```bash
# 在 CI/CD 中设置
export SENTRY_RELEASE="marketbook@1.0.0"

# Sentry CLI 上传 source maps
sentry-cli releases files $SENTRY_RELEASE upload-sourcemaps ./dist
```

### 3. 错误分组

为错误添加标签，方便分类：

```javascript
Sentry.withScope((scope) => {
  scope.setTag('feature', 'trading');
  scope.setTag('priority', 'high');
  captureError(error);
});
```

### 4. 性能监控

追踪关键操作的性能：

```javascript
const transaction = Sentry.startTransaction({
  op: 'trading',
  name: '用户下单流程',
});

// ... 执行下单逻辑

transaction.finish();
```

### 5. 错误通知配置

在 Sentry 项目设置中配置通知：

1. **Email**：每个新错误立即发邮件
2. **Slack**：集成Slack通知（Settings → Integrations → Slack）
3. **PagerDuty**：生产环境严重错误自动创建事件

---

## 常见问题

### Q1: 开发环境要配置 Sentry 吗？

**A**: 不强制。开发环境可以不配置 `SENTRY_DSN`，应用会正常运行并在控制台输出提示：

```
ℹ️ Sentry 未配置（开发环境可选）
```

如果想在开发环境测试 Sentry 集成，可以配置一个独立的 Sentry 项目。

---

### Q2: 会泄露用户隐私吗？

**A**: 不会。MarketBook 已配置敏感信息过滤：

- 密码字段自动替换为 `[已过滤]`
- Token、JWT、Secret 等自动脱敏
- 用户 ID 和邮箱会记录（用于追踪），但不会记录密码

---

### Q3: Sentry 会影响性能吗？

**A**: 影响极小：

- 默认仅采样 10% 的请求（`tracesSampleRate: 0.1`）
- 错误上报是异步的，不阻塞主线程
- 高流量应用可降低采样率至 1%

---

### Q4: 如何查看错误详情？

**A**: 登录 Sentry 后：

1. **Issues** 页面：显示所有错误
2. 点击某个错误查看：
   - **Stack Trace**：错误堆栈
   - **Breadcrumbs**：错误发生前的操作记录
   - **Tags**：环境、版本、用户等标签
   - **Request Data**：HTTP请求信息
   - **Device/OS**：用户设备信息

---

### Q5: 如何解决 "DSN not configured" 警告？

**A**: 这是正常提示，说明 `.env` 中未配置 `SENTRY_DSN`。

**解决方法**：
1. 注册 Sentry 账号并创建项目
2. 复制 DSN 到 `.env` 文件：
   ```bash
   SENTRY_DSN=https://your-dsn@sentry.io/123456
   ```
3. 重启应用

---

### Q6: 如何测试 Sentry 是否正常工作？

**A**: 创建测试端点：

```javascript
// app.js
app.get('/test-error', () => {
  throw new Error('Sentry 测试错误');
});
```

访问 `http://localhost:3000/test-error`，然后登录 Sentry 查看是否收到错误报告。

---

### Q7: Sentry 免费吗？

**A**: 有免费计划：

- **免费版**：5,000 errors/月 + 10,000 transactions/月
- **超出后**：付费升级或降低采样率

对于中小型项目，免费版通常够用。

---

## 相关资源

- [Sentry 官方文档](https://docs.sentry.io/)
- [Node.js 集成指南](https://docs.sentry.io/platforms/node/)
- [Express 集成示例](https://docs.sentry.io/platforms/node/guides/express/)
- [性能监控文档](https://docs.sentry.io/product/performance/)
- [错误分组规则](https://docs.sentry.io/product/data-management-settings/event-grouping/)

---

## 下一步

- ✅ Sentry 已集成（自动捕获错误）
- 📝 配置 `.env` 中的 `SENTRY_DSN`
- 🔔 配置 Sentry 项目的通知方式
- 📊 查看 Sentry Dashboard 监控应用健康度

祝你的应用零bug！🚀
