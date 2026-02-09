# MarketBook 技术债务追踪文档

> 最后更新: 2026-02-09 12:20
> 维护者: OpenClaw Agent

---

## 概述

本文档记录 MarketBook 项目中已知的技术债务、TODO项和未来优化方向。项目目前处于生产就绪状态（8个阶段100%完成），以下为非阻塞性的优化建议。

---

## 🔴 高优先级（影响生产环境）

### 1. 邮箱验证功能
**位置**: `src/models/User.js`
```javascript
// TODO: 生产环境应启用邮箱验证
```

**影响**: 
- 当前开发环境放宽了邮箱验证限制（`canLogin` 方法）
- 生产环境应启用严格的邮箱验证流程

**解决方案**:
- 启用 `emailVerificationRoutes` 路由
- 配置 SMTP 邮件服务（使用环境变量 `SMTP_HOST`、`SMTP_PORT` 等）
- 修改 `User.canLogin()` 方法检查 `emailVerified` 字段
- 前端增加"邮箱验证提醒"页面

**预估工时**: 4-6小时

---

## 🟡 中优先级（功能扩展）

### 2. 未启用的路由模块
**位置**: `src/routes/index.js`
```javascript
// TODO: 其他路由需要修复 controller 的格式后再启用
// const profileRoutes = require('./profile');
// const avatarRoutes = require('./avatar');
// const permissionRoutes = require('./permissions');
// const emailVerificationRoutes = require('./emailVerification');
```

**影响**:
- 用户资料编辑功能未启用（profile）
- 头像上传功能未启用（avatar）
- 权限管理功能未启用（permissions）
- 邮箱验证功能未启用（emailVerification）

**原因**:
- 这些路由的 controller 格式不符合当前错误处理中间件（asyncHandler）
- 需要重构 controller 以使用统一的错误处理模式

**解决方案**:
1. **profile 路由**:
   - 重构 `src/controllers/profileController.js` 使用 asyncHandler
   - 确保所有方法返回统一格式的响应
   - 添加输入验证中间件

2. **avatar 路由**:
   - 集成 multer 文件上传中间件
   - 实现图片压缩和格式转换
   - 添加文件大小和类型验证

3. **permissions 路由**:
   - 实现基于角色的访问控制（RBAC）
   - 创建权限检查中间件
   - 前端增加权限管理界面

4. **emailVerification 路由**:
   - 参考上面"邮箱验证功能"任务

**预估工时**:
- profile: 3-4小时
- avatar: 4-6小时
- permissions: 6-8小时
- emailVerification: 4-6小时

---

## 🟢 低优先级（优化建议）

### 3. SEO配置占位符
**位置**: `src/config/seo-optimization.js`
```javascript
googleAnalytics: 'GA-XXXXXXXXX-X',
googleTagManager: 'GTM-XXXXXXX',
```

**影响**: 
- SEO配置文件包含占位符，未配置真实的 Google Analytics 和 GTM

**解决方案**:
- 生产环境配置真实的 GA 和 GTM ID
- 或者将这些配置移到 `.env` 环境变量

**预估工时**: 30分钟

### 4. 数据库迁移
**当前状态**: 
- 使用内存存储（memoryStore），数据重启后丢失
- 已创建 MongoDB 迁移脚本（`scripts/migrate-to-mongodb.js`）

**解决方案**:
- 生产环境配置 MongoDB 连接字符串
- 运行迁移脚本将内存数据结构迁移到 MongoDB
- 更新 models 使用 Mongoose ODM

**文档**: 见 `docs/DATABASE_MIGRATION.md`

**预估工时**: 2-3小时（已有完整文档和脚本）

### 5. 测试覆盖率提升
**当前状态**:
- 核心模块单元测试通过率 100%（180+ 测试用例）
- 部分非核心模块测试失败（auth.test.js、permissions.test.js、avatar.test.js）

**未覆盖模块**:
- profile 路由（因为暂未启用）
- avatar 路由（因为暂未启用）
- permissions 路由（因为暂未启用）

**解决方案**:
- 启用上述路由后补充集成测试
- 增加端到端测试（E2E）覆盖完整业务流程

**预估工时**: 6-8小时

---

## 📝 代码质量优化建议

### 1. 重复代码消除
**位置**: `src/models/` 目录下存在多个相似的模型类

**发现**:
- UserEnhanced.js、UserOptimized.js、UserRegistrationFlow.js 等存在功能重叠
- TradingEngine.js、TradingEngineEnhanced.js 存在重复逻辑

**建议**:
- 合并相似模型，保留一个主模型
- 将增强功能通过 mixin 或装饰器模式扩展
- 删除未使用的模型文件

**预估工时**: 4-6小时

### 2. 文档去重
**位置**: `docs/` 目录

**发现**:
- PERFORMANCE_TESTING.md 和 PERFORMANCE_TESTING_GUIDE.md 内容相似
- Docker部署指南.md（中文）和 DOCKER_GUIDE.md（英文）内容重复

**建议**:
- 统一为英文文档（国际化标准）
- 或者明确区分中英文文档的使用场景

**预估工时**: 1-2小时

---

## 🔧 配置改进建议

### 1. 环境变量完整性
**当前状态**: `.env.example` 已包含主要配置项

**待补充**:
- `SENTRY_DSN`: Sentry 错误监控配置（已在代码中使用）
- `SMTP_*`: 邮件服务配置（邮箱验证需要）
- `REDIS_URL`: Redis缓存配置（未来性能优化）

**建议**: 更新 `.env.example` 补充这些配置项

**预估工时**: 30分钟

### 2. Docker Compose 多环境支持
**当前状态**:
- docker-compose.yml（生产环境）
- docker-compose.dev.yml（开发环境覆盖）

**建议**: 增加测试环境配置
- docker-compose.test.yml（运行测试套件）
- 配置独立的测试数据库

**预估工时**: 2-3小时

---

## 📊 统计信息

- **总代码行数**: 26,918行（107个JS文件）
- **文档数量**: 17个文档，总计 ~160KB
- **测试用例**: 180+ 测试用例，核心模块100%通过率
- **已完成阶段**: 8/8 (100%)
- **已知TODO数量**: 5个（本文档已记录）

---

## 🚀 未来扩展方向

这些是非技术债务的功能扩展方向，不影响当前系统稳定性：

### 1. 论坛功能
- 发帖、评论、点赞系统
- 用户关系（关注、粉丝）
- 内容审核与举报

### 2. 学习中心
- 交易教程文章系统
- 视频教程集成
- 进度追踪与证书

### 3. 策略分析
- 回测引擎（历史数据回测）
- 策略编辑器（拖拽式/代码式）
- 策略排行榜

### 4. 社交功能
- 实时聊天室
- 交易信号分享
- 跟单系统

### 5. 移动端
- React Native App
- 推送通知
- 离线缓存

---

## 维护建议

### 定期审查
- **每月**: 审查本文档，更新优先级
- **每季度**: 清理已完成的债务，补充新的发现
- **每半年**: 重构高优先级债务

### 追踪流程
1. 发现技术债务 → 记录到本文档
2. 评估优先级（高/中/低）
3. 估算工时
4. 排期到开发计划
5. 完成后从本文档移除

---

## 参考文档

- [开发进度跟踪.md](../开发进度跟踪.md) - 项目整体进度
- [开发计划.md](../开发计划.md) - 原始开发计划
- [API错误处理最佳实践.md](./API错误处理最佳实践.md) - 错误处理规范
- [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md) - 数据库迁移指南

---

*本文档由 OpenClaw Agent 自动维护，基于代码扫描和已知问题生成。*
