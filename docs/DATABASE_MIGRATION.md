# 数据库迁移指南：内存存储 → MongoDB 🗄️

> 本指南帮助你将 MarketBook 从内存存储迁移到生产级的 MongoDB 数据库。

---

## 📋 目录

1. [为什么需要迁移](#为什么需要迁移)
2. [准备工作](#准备工作)
3. [快速开始](#快速开始)
4. [迁移步骤详解](#迁移步骤详解)
5. [代码适配](#代码适配)
6. [验证与测试](#验证与测试)
7. [回滚方案](#回滚方案)
8. [常见问题](#常见问题)

---

## 为什么需要迁移

### 内存存储的局限

- ❌ **数据不持久**：应用重启后数据丢失
- ❌ **无法横向扩展**：单机内存限制
- ❌ **缺乏查询能力**：无索引、无关联查询
- ❌ **无备份机制**：数据丢失无法恢复

### MongoDB 的优势

- ✅ **数据持久化**：写入磁盘，永久保存
- ✅ **可扩展性**：支持副本集和分片
- ✅ **强大查询**：索引、聚合、全文搜索
- ✅ **自动备份**：支持快照和增量备份
- ✅ **生产就绪**：成熟的监控和运维工具

---

## 准备工作

### 1. 安装 MongoDB

#### 本地开发环境

**macOS（Homebrew）**:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian**:
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Docker（推荐）**:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### 生产环境

推荐使用托管服务：
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)（免费512MB）
- [Heroku MongoDB](https://elements.heroku.com/addons/mongolab)
- [DigitalOcean Managed MongoDB](https://www.digitalocean.com/products/managed-databases-mongodb)

### 2. 安装 Mongoose

```bash
npm install mongoose
```

### 3. 配置连接字符串

在 `.env` 文件中添加：

```bash
# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017/marketbook

# 生产环境示例（MongoDB Atlas）
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/marketbook?retryWrites=true&w=majority
```

---

## 快速开始

### 一键迁移

```bash
# 1. 确保 MongoDB 已启动
docker ps | grep mongo  # 如果使用 Docker

# 2. 运行迁移脚本
node scripts/migrate-to-mongodb.js

# 3. 根据提示确认操作
# ✓ 是否开始迁移？yes
# ✓ 是否清空现有数据？yes（首次迁移选yes）

# 4. 等待完成（自动备份+导入+验证）
```

### 迁移输出示例

```
╔════════════════════════════════════════════╗
║   MarketBook 数据库迁移工具               ║
║   内存存储 → MongoDB                      ║
╚════════════════════════════════════════════╝

✅ 数据备份完成: backups/memory-backup-2026-02-09.json

📊 待迁移数据统计：
  - 用户: 3
  - 交易账户: 2
  - 交易记录: 15

确认开始迁移？(yes/no): yes

🔌 正在连接 MongoDB: mongodb://localhost:27017/marketbook
✅ MongoDB 连接成功

📥 导入 3 个用户...
  ✓ testuser (test@example.com)
  ✓ alice (alice@example.com)
  ✓ bob (bob@example.com)
✅ 用户导入完成（3条）

📥 导入 2 个交易账户...
  ✓ 账户 ACC001 (余额: $98500)
  ✓ 账户 ACC002 (余额: $105200)
✅ 交易账户导入完成（2条）

📥 导入 15 条交易记录...
✅ 交易记录导入完成（15条）

🔍 验证数据完整性...

📊 迁移结果对比：
┌──────────────┬──────────┬──────────┬────────┐
│ 数据类型     │ 原始数量 │ 迁移数量 │ 状态   │
├──────────────┼──────────┼──────────┼────────┤
│ 用户         │ 3        │ 3        │ ✅ 成功 │
│ 交易账户     │ 2        │ 2        │ ✅ 成功 │
│ 交易记录     │ 15       │ 15       │ ✅ 成功 │
└──────────────┴──────────┴──────────┴────────┘

╔════════════════════════════════════════════╗
║   ✅ 数据迁移成功！                       ║
╚════════════════════════════════════════════╝

下一步：
1. 修改 src/models/*.js 使用 Mongoose 模型
2. 更新 .env 设置 MONGODB_URI
3. 重启应用测试功能
4. 确认无误后删除内存存储代码

备份文件保存在: /path/to/backups
```

---

## 迁移步骤详解

### 步骤1：数据备份

迁移脚本会自动备份内存数据到 `backups/` 目录：

```json
{
  "timestamp": "2026-02-09T08:00:00.000Z",
  "users": [...],
  "tradingAccounts": [...],
  "tradingRecords": [...],
  "stats": {
    "usersCount": 3,
    "accountsCount": 2,
    "recordsCount": 15
  }
}
```

**手动备份**（推荐）：
```bash
# 导出当前数据
node -e "require('./scripts/migrate-to-mongodb').exportMemoryData()"
```

### 步骤2：连接验证

脚本会测试 MongoDB 连接：

```bash
# 测试连接
mongosh "mongodb://localhost:27017/marketbook" --eval "db.version()"
```

如果连接失败，检查：
1. MongoDB 服务是否启动
2. 连接字符串是否正确
3. 防火墙是否阻止端口 27017

### 步骤3：数据导入

迁移脚本会：
1. 创建 MongoDB 集合（users、trading_accounts、trading_records）
2. 转换数据格式（内存 → MongoDB Schema）
3. 处理 ID 映射（内存 ID → MongoDB ObjectId）
4. 保留时间戳和关联关系

### 步骤4：完整性验证

自动对比原始数据和迁移后的数据：
- 数量一致性检查
- 数据类型验证
- 关联关系完整性

---

## 代码适配

### 方案1：最小改动（推荐）

保留现有 `UserStore`、`TradingAccountStore` 等接口，仅修改底层实现：

**示例：UserStore.js**

```javascript
// 旧版（内存存储）
const memoryStore = require('../db/memoryStore');

class UserStore {
  static async findOne(query) {
    return memoryStore.findOne('users', query);
  }
  // ...
}

// 新版（MongoDB）
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // ...
});

const UserModel = mongoose.model('User', UserSchema);

class UserStore {
  static async findOne(query) {
    return UserModel.findOne(query);
  }
  
  static async save(userData) {
    const user = new UserModel(userData);
    return user.save();
  }
  // ...
}

module.exports = UserStore;
```

**优点**：
- 不需要修改路由和控制器
- 渐进式迁移（逐个模型替换）
- 回滚简单（改回内存存储即可）

### 方案2：直接使用 Mongoose 模型

删除适配层，直接在控制器中使用 Mongoose：

```javascript
// 控制器中
const User = require('../models/User'); // Mongoose 模型

async function getProfile(req, res) {
  const user = await User.findById(req.userId);
  res.json(user);
}
```

**优点**：
- 充分利用 Mongoose 功能（populate、虚拟字段等）
- 代码更简洁

**缺点**：
- 需要重构所有使用 UserStore 的代码
- 测试工作量大

**推荐**：先用方案1迁移，稳定后再考虑方案2。

---

## 验证与测试

### 1. 启动应用

```bash
# 确保 .env 配置了 MONGODB_URI
MONGODB_URI=mongodb://localhost:27017/marketbook npm start
```

### 2. 测试核心功能

**注册新用户**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","email":"new@example.com","password":"Test123456"}'
```

**登录**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"Test123456"}'
```

**查询账户**:
```bash
TOKEN="your-jwt-token"
curl http://localhost:3000/api/trading/accounts \
  -H "Authorization: Bearer $TOKEN"
```

### 3. 验证数据持久化

```bash
# 重启应用
npm restart

# 再次登录，确认用户数据仍存在
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"Test123456"}'
```

如果能成功登录，说明数据已持久化到 MongoDB。

### 4. 检查 MongoDB 数据

```bash
# 连接 MongoDB
mongosh mongodb://localhost:27017/marketbook

# 查询用户数量
db.users.countDocuments()

# 查看最新用户
db.users.find().sort({createdAt:-1}).limit(1)

# 查询交易记录
db.tradingrecords.find().limit(5)
```

---

## 回滚方案

### 场景1：迁移失败

如果迁移过程出错，数据仍在内存中：

```bash
# 直接重启应用，继续使用内存存储
npm start
```

备份文件在 `backups/` 目录，可手动导入。

### 场景2：迁移后发现问题

**快速回滚到内存存储**：

1. 修改 `.env`，注释掉 MongoDB：
   ```bash
   # MONGODB_URI=mongodb://localhost:27017/marketbook
   ```

2. 恢复旧版 `UserStore.js`（使用 Git）：
   ```bash
   git checkout HEAD -- src/models/UserStore.js
   ```

3. 从备份恢复数据：
   ```javascript
   // 手动加载备份文件
   const backup = require('./backups/memory-backup-2026-02-09.json');
   // 恢复到 memoryStore...
   ```

---

## 常见问题

### Q1: 迁移后应用启动失败？

**A**: 检查 `MONGODB_URI` 是否配置：

```bash
# .env 文件
MONGODB_URI=mongodb://localhost:27017/marketbook

# 或通过环境变量
export MONGODB_URI=mongodb://localhost:27017/marketbook
npm start
```

---

### Q2: 数据迁移后数量不一致？

**A**: 可能原因：
1. **用户关联失败**：内存中的 userId 无法映射到 MongoDB ObjectId
   - 解决：检查 `userIdMap` 是否正确
2. **数据验证失败**：某些数据不符合 Mongoose Schema
   - 解决：查看迁移日志中的 `⚠️ 跳过` 提示

---

### Q3: 如何只迁移部分数据？

**A**: 修改迁移脚本，添加过滤条件：

```javascript
// migrate-to-mongodb.js
async function importUsers(users) {
  // 仅导入已验证的用户
  const verifiedUsers = users.filter(u => u.isVerified);
  
  for (const user of verifiedUsers) {
    // ...
  }
}
```

---

### Q4: 生产环境如何零停机迁移？

**A**: 采用双写策略：

1. **同时写入内存和MongoDB**（渐进式迁移）
   ```javascript
   async function createUser(userData) {
     // 写入内存
     await memoryStore.save('users', userData);
     
     // 同时写入MongoDB
     await UserModel.create(userData);
   }
   ```

2. **验证数据一致性**（运行24小时）

3. **切换读取源**（从内存改为MongoDB）
   ```javascript
   async function getUser(id) {
     // return memoryStore.findOne('users', {id});
     return UserModel.findById(id);
   }
   ```

4. **停止写入内存**（仅写MongoDB）

---

### Q5: MongoDB 连接池配置？

**A**: 在 `src/config/database.js` 配置：

```javascript
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,          // 最大连接数
  minPoolSize: 2,           // 最小连接数
  serverSelectionTimeoutMS: 5000,  // 连接超时
  socketTimeoutMS: 45000,   // Socket超时
});
```

---

## 相关资源

- [Mongoose 官方文档](https://mongoosejs.com/docs/guide.html)
- [MongoDB Atlas 免费部署](https://www.mongodb.com/cloud/atlas/register)
- [Mongoose Schema 设计最佳实践](https://mongoosejs.com/docs/schematypes.html)
- [MongoDB 性能优化指南](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)

---

## 下一步

- ✅ 数据迁移完成
- 📝 修改 Models 使用 Mongoose
- 🧪 全面测试功能
- 📊 监控 MongoDB 性能
- 🔄 配置自动备份策略

祝迁移顺利！🚀
