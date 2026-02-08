# MarketBook 生产部署指南 🚀

> 本指南帮助你将 MarketBook 从开发环境迁移到生产环境。

---

## 📋 部署前检查清单

### 1. 环境配置

- [ ] 生成强密码的 `JWT_SECRET`（至少32字符）
- [ ] 配置生产数据库（MongoDB/PostgreSQL，替代内存存储）
- [ ] 设置 `NODE_ENV=production`
- [ ] 配置邮件服务（SMTP）用于验证邮箱
- [ ] 配置真实行情API（Alpha Vantage/Yahoo Finance）

### 2. 安全加固

- [ ] 启用 HTTPS（推荐使用 Let's Encrypt）
- [ ] 启用 CORS 白名单（限制访问来源）
- [ ] 启用 Helmet 安全头
- [ ] 配置 rate limiting（已集成，检查阈值）
- [ ] 移除开发环境密码宽松验证规则
- [ ] 开启邮箱验证强制要求

### 3. 数据持久化

- [ ] 配置 MongoDB 连接字符串
- [ ] 将 `memoryStore` 替换为真实数据库存储
- [ ] 设置数据库备份策略
- [ ] 配置 Redis（可选，用于 session/cache）

### 4. 监控与日志

- [ ] 集成 Sentry 错误监控
- [ ] 配置日志收集（Winston/Bunyan）
- [ ] 设置健康检查端点 `/health`
- [ ] 配置性能监控（如 New Relic）

### 5. CI/CD

- [ ] 设置 GitHub Actions 自动测试
- [ ] 配置 Docker 镜像构建
- [ ] 部署到云平台（Vercel/Railway/Heroku）

---

## 🔧 环境变量配置

创建 `.env` 文件（参考 `.env.example`）：

```bash
# 应用配置
NODE_ENV=production
PORT=3000
APP_URL=https://yourdomain.com

# JWT 配置
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# 数据库配置
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/marketbook

# 邮件服务
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# 行情API
ALPHA_VANTAGE_API_KEY=your-api-key
# 或
YAHOO_FINANCE_API_KEY=your-api-key

# 安全配置
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_MAX=100  # 每15分钟最大请求数

# Sentry 监控（可选）
SENTRY_DSN=https://xxx@sentry.io/xxx

# Redis（可选）
REDIS_URL=redis://localhost:6379
```

---

## 🐳 Docker 部署

### 1. 创建 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "src/app.js"]
```

### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
```

### 3. 启动服务

```bash
docker-compose up -d
```

---

## 🌐 平台部署指南

### Vercel（推荐前端 + Serverless）

1. 安装 Vercel CLI：
   ```bash
   npm i -g vercel
   ```

2. 部署：
   ```bash
   vercel --prod
   ```

3. 配置环境变量（在 Vercel Dashboard）

### Railway

1. 连接 GitHub 仓库
2. 在 Railway Dashboard 添加环境变量
3. 自动部署（每次 git push）

### Heroku

```bash
heroku create marketbook-prod
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
git push heroku main
```

---

## 🔐 安全最佳实践

### 1. JWT Secret 生成

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. 密码策略（生产环境）

修改 `src/middlewares/validation.js`：

```javascript
// 移除开发环境宽松规则
body('password')
  .isLength({ min: 8 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('密码必须包含大小写字母、数字和特殊字符')
```

### 3. CORS 配置

修改 `src/app.js`：

```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://yourdomain.com',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 4. 启用 Helmet

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

## 📊 数据库迁移（从内存到MongoDB）

### 1. 安装 Mongoose

```bash
npm install mongoose
```

### 2. 修改 User 模型

将 `src/models/UserStore.js` 改为真实 Mongoose 模型：

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
```

### 3. 连接数据库

在 `src/app.js` 启动前：

```javascript
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));
```

---

## 🔍 健康检查

添加健康检查端点：

```javascript
// src/app.js
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});
```

---

## 📈 监控集成

### Sentry 错误监控

1. 安装：
   ```bash
   npm install @sentry/node
   ```

2. 配置（在 `src/app.js` 顶部）：
   ```javascript
   const Sentry = require("@sentry/node");

   if (process.env.NODE_ENV === 'production') {
     Sentry.init({
       dsn: process.env.SENTRY_DSN,
       environment: process.env.NODE_ENV,
       tracesSampleRate: 1.0,
     });
   }
   ```

3. 在错误处理中间件集成：
   ```javascript
   app.use((err, req, res, next) => {
     if (process.env.NODE_ENV === 'production') {
       Sentry.captureException(err);
     }
     // ... 现有错误处理逻辑
   });
   ```

---

## 🧪 生产前测试

```bash
# 运行所有测试
npm test

# 检查代码质量
npm run lint

# 性能测试（使用 Artillery 或 K6）
artillery quick --count 10 -n 20 http://localhost:3000/api/health
```

---

## 📝 部署后验证

- [ ] 访问 `https://yourdomain.com/health` 返回 200
- [ ] 注册新用户并验证邮箱
- [ ] 登录并访问模拟盘功能
- [ ] 检查错误日志（Sentry Dashboard）
- [ ] 验证 rate limiting 生效
- [ ] 检查 HTTPS 证书有效

---

## 🆘 常见问题

### Q: JWT 验证失败

**A**: 检查 `JWT_SECRET` 是否与生成 Token 时一致。

### Q: MongoDB 连接超时

**A**: 检查 `MONGODB_URI` 格式，确保网络可达。白名单 IP 地址（MongoDB Atlas）。

### Q: 邮件发送失败

**A**: 确认 SMTP 配置正确，Gmail 需要使用应用专用密码（非账号密码）。

### Q: CORS 错误

**A**: 检查 `CORS_ORIGIN` 环境变量是否包含前端域名。

---

## 📚 参考资源

- [Node.js 生产最佳实践](https://github.com/goldbergyoni/nodebestpractices)
- [Express 安全最佳实践](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB 安全清单](https://docs.mongodb.com/manual/administration/security-checklist/)
- [Let's Encrypt SSL 证书](https://letsencrypt.org/)

---

**祝部署顺利！🎉**

如有问题，请提交 [GitHub Issue](https://github.com/fisher-byte/Marketbook/issues)。
