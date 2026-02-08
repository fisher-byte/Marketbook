# API 错误处理最佳实践

> **版本**: 2.0.0  
> **日期**: 2026-02-08  
> **作者**: MarketBook Team

本文档定义了MarketBook项目的统一错误处理规范和最佳实践。

---

## 📋 目录

1. [错误处理中间件](#错误处理中间件)
2. [Controller最佳实践](#controller最佳实践)
3. [输入验证规范](#输入验证规范)
4. [错误响应格式](#错误响应格式)
5. [迁移指南](#迁移指南)

---

## 🛡️ 错误处理中间件

### 核心组件

文件位置: `src/middlewares/errorHandler.js`

**主要功能**:
- ✅ 统一错误响应格式
- ✅ 自动错误日志记录
- ✅ 异步错误自动捕获
- ✅ 输入验证辅助函数
- ✅ 错误追踪ID生成

### 关键API

```javascript
const { 
    createError,      // 创建标准化错误对象
    asyncHandler,     // 异步路由包装器
    validate,         // 输入验证工具
} = require('../middlewares/errorHandler');
```

---

## 🎯 Controller最佳实践

### ❌ 旧写法（不推荐）

```javascript
const getAccountInfo = async (req, res) => {
    try {
        const { accountId } = req.params;
        
        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: '账户ID不能为空'
            });
        }

        const account = findAccount(accountId);
        
        if (!account) {
            return res.status(404).json({
                success: false,
                message: '账户不存在'
            });
        }

        res.status(200).json({
            success: true,
            data: account
        });
    } catch (error) {
        console.error('错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};
```

**问题**:
- ❌ 大量重复的try-catch代码
- ❌ 错误响应格式不统一
- ❌ 缺少错误追踪和日志
- ❌ 验证逻辑分散
- ❌ 错误类型不明确

---

### ✅ 新写法（推荐）

```javascript
const { createError, asyncHandler, validate } = require('../middlewares/errorHandler');
const { errorHandler } = require('../utils/ErrorHandler');

const getAccountInfo = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { accountId } = req.params;
    
    // 1️⃣ 统一的输入验证
    validate.required({ accountId }, ['accountId']);
    
    // 2️⃣ 业务逻辑
    const account = findAccount(accountId);
    
    if (!account) {
        throw createError.notFound('交易账户');  // 自动记录日志
    }

    // 3️⃣ 权限验证
    if (account.userId !== userId) {
        throw createError.forbidden('无权访问该交易账户');
    }

    // 4️⃣ 性能监控（可选）
    errorHandler.recordPerformance('databaseTime', 5);
    
    // 5️⃣ 正常响应
    res.status(200).json({
        success: true,
        data: account
    });
});
```

**优势**:
- ✅ 代码简洁清晰（无try-catch）
- ✅ 错误自动捕获和记录
- ✅ 统一的错误响应格式
- ✅ 内置性能监控
- ✅ 错误可追踪（errorId）

---

## 🔍 输入验证规范

### 必填字段验证

```javascript
// 验证单个字段
validate.required({ accountId }, ['accountId']);

// 验证多个字段
validate.required(req.body, ['symbol', 'quantity', 'accountId']);
```

### 数字验证

```javascript
// 基础验证
const quantity = validate.number(req.body.quantity, '交易数量');

// 带范围验证
const price = validate.number(req.body.price, '价格', { 
    min: 0.01, 
    max: 1000000 
});

// 整数验证
const shares = validate.number(req.body.shares, '股数', { 
    min: 1,
    max: 100000 
});
```

### 字符串验证

```javascript
// 长度验证
const symbol = validate.string(req.body.symbol, '股票代码', {
    minLength: 1,
    maxLength: 10
});

// 邮箱验证（结合express-validator）
const email = validate.string(req.body.email, '邮箱', {
    maxLength: 100
});
```

### 枚举验证

```javascript
// 交易类型验证
const type = validate.enum(req.body.type, '交易类型', ['buy', 'sell']);

// 订单状态验证
const status = validate.enum(req.query.status, '订单状态', 
    ['pending', 'executed', 'cancelled']
);
```

---

## 📦 错误响应格式

### 标准成功响应

```json
{
  "success": true,
  "data": {
    "accountId": "123",
    "balance": 100000
  }
}
```

### 标准错误响应

```json
{
  "success": false,
  "error": {
    "type": "validation",
    "message": "缺少必需参数",
    "statusCode": 400,
    "details": {
      "missingFields": ["accountId", "symbol"]
    },
    "errorId": "err_1707368419362_x9k2m4b3"
  }
}
```

### 错误类型分类

| HTTP状态码 | 错误类型 | 创建方法 | 示例 |
|-----------|---------|---------|------|
| 400 | validation | `createError.badRequest()` | 参数缺失、格式错误 |
| 401 | authentication | `createError.unauthorized()` | token失效、未登录 |
| 403 | authorization | `createError.forbidden()` | 无权限访问 |
| 404 | not_found | `createError.notFound()` | 资源不存在 |
| 409 | conflict | `createError.conflict()` | 资源冲突（如重复创建）|
| 429 | rate_limit | `createError.tooManyRequests()` | 请求频率超限 |
| 500 | internal | `createError.internal()` | 服务器错误 |

---

## 🔄 迁移指南

### 步骤1：引入依赖

```javascript
// 文件顶部添加
const { createError, asyncHandler, validate } = require('../middlewares/errorHandler');
const { errorHandler } = require('../utils/ErrorHandler');
```

### 步骤2：替换async函数

**旧代码**:
```javascript
const myController = async (req, res) => {
    try {
        // ... 业务逻辑
    } catch (error) {
        // ... 错误处理
    }
};
```

**新代码**:
```javascript
const myController = asyncHandler(async (req, res) => {
    // ... 业务逻辑（无需try-catch）
});
```

### 步骤3：替换错误抛出

**旧代码**:
```javascript
if (!account) {
    return res.status(404).json({
        success: false,
        message: '账户不存在'
    });
}
```

**新代码**:
```javascript
if (!account) {
    throw createError.notFound('账户');
}
```

### 步骤4：添加输入验证

```javascript
// 在业务逻辑前添加
validate.required(req.body, ['accountId', 'symbol', 'quantity']);
const quantity = validate.number(req.body.quantity, '数量', { min: 1 });
```

### 步骤5：注册全局错误处理

在 `app.js` 中:

```javascript
const { globalErrorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// ... 其他中间件和路由

// 404处理（在所有路由之后）
app.use(notFoundHandler);

// 全局错误处理（最后）
app.use(globalErrorHandler);
```

---

## 📊 实际案例对比

### 案例1: 创建交易账户

#### ❌ 旧代码（63行）

```javascript
const createAccount = async (req, res) => {
    try {
        const userId = req.userId;
        const { initialBalance = 100000 } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '用户ID不能为空'
            });
        }

        if (isNaN(initialBalance) || initialBalance < 10000) {
            return res.status(400).json({
                success: false,
                message: '初始余额必须大于等于10000'
            });
        }

        const existingAccount = TradingAccountStore.findByUserId(userId);
        if (existingAccount) {
            return res.status(409).json({
                success: false,
                message: '交易账户已存在'
            });
        }

        const account = new TradingAccount({
            userId,
            initialBalance,
            currentBalance: initialBalance,
            availableBalance: initialBalance,
            status: 'active'
        });

        TradingAccountStore.save(account);

        res.status(201).json({
            success: true,
            message: '交易账户创建成功',
            data: account
        });
    } catch (error) {
        console.error('创建交易账户错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};
```

#### ✅ 新代码（29行，减少54%）

```javascript
const createAccount = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { initialBalance = 100000 } = req.body;
    
    // 验证余额范围
    const validatedBalance = validate.number(initialBalance, '初始余额', { 
        min: 10000, 
        max: 10000000 
    });

    // 检查是否已存在
    const existingAccount = TradingAccountStore.findByUserId(userId);
    if (existingAccount) {
        throw createError.conflict('交易账户已存在');
    }

    // 创建账户
    const account = new TradingAccount({
        userId,
        initialBalance: validatedBalance,
        currentBalance: validatedBalance,
        availableBalance: validatedBalance,
        status: 'active'
    });

    TradingAccountStore.save(account);

    res.status(201).json({
        success: true,
        message: '交易账户创建成功',
        data: account
    });
});
```

---

## 🎓 最佳实践总结

### DO ✅

1. **使用 asyncHandler 包装所有async路由**
   ```javascript
   const myRoute = asyncHandler(async (req, res) => { ... });
   ```

2. **统一使用 createError 抛出错误**
   ```javascript
   throw createError.badRequest('错误信息', details);
   ```

3. **集中进行输入验证**
   ```javascript
   validate.required(req.body, ['field1', 'field2']);
   const num = validate.number(value, '字段名', { min, max });
   ```

4. **记录性能指标**
   ```javascript
   errorHandler.recordPerformance('databaseTime', duration);
   ```

5. **返回统一的成功响应格式**
   ```javascript
   res.json({ success: true, data: result });
   ```

### DON'T ❌

1. **不要手写 try-catch**
   ```javascript
   // ❌ 不推荐
   try { ... } catch (error) { res.status(500).json(...) }
   ```

2. **不要直接 return res.status(...).json()**
   ```javascript
   // ❌ 不推荐
   if (!data) {
       return res.status(404).json({ success: false, message: '...' });
   }
   ```

3. **不要分散验证逻辑**
   ```javascript
   // ❌ 不推荐
   if (!field1) { return ... }
   if (!field2) { return ... }
   if (field3 < 0) { return ... }
   ```

4. **不要忽略错误类型**
   ```javascript
   // ❌ 不推荐
   throw new Error('出错了'); // 缺少类型和状态码
   ```

5. **不要在业务逻辑中console.error**
   ```javascript
   // ❌ 不推荐
   console.error('错误:', error); // errorHandler会自动记录
   ```

---

## 📚 相关文档

- [Express错误处理官方文档](https://expressjs.com/en/guide/error-handling.html)
- [HTTP状态码标准](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status)
- `src/utils/ErrorHandler.js` - 错误日志和性能监控
- `src/middlewares/errorHandler.js` - 错误处理中间件

---

## 🔧 未来计划

- [ ] 接入Sentry等错误监控平台
- [ ] 添加请求频率限制（Rate Limiting）
- [ ] 实现错误重试机制
- [ ] 增强错误分析和报表功能
- [ ] 添加更多输入验证工具（日期、URL等）

---

**版权所有 © 2026 MarketBook Team**
