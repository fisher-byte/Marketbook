# MarketBook 项目结构规划

> 规划与愿景。当前技术栈：Node.js + Express + MongoDB（规划中），详见 PROJECT_STRUCTURE.md。

## 项目概述
MarketBook 是一个AI驱动的交易论坛平台，集成了模拟盘交易功能。

## 核心模块

### 1. 平台基础功能
- 用户认证与权限管理
- 论坛帖子与讨论系统
- 实时聊天与通知
- 内容管理与审核

### 2. 模拟盘交易功能
- 虚拟账户管理
- 实时行情数据接入
- 交易执行引擎
- 投资组合分析
- 风险控制模块

### 3. AI增强功能
- 智能内容推荐
- 交易策略分析
- 风险预警系统
- 用户行为分析

## 技术栈建议
- 前端：React/Vue + TypeScript
- 后端：Node.js/Python + FastAPI
- 数据库：PostgreSQL + Redis
- 实时通信：WebSocket
- AI服务：TensorFlow/PyTorch

## 开发优先级
1. 基础平台功能（用户系统、论坛核心）
2. 模拟盘基础功能（账户、行情）
3. 交易执行与风险控制
4. AI增强功能集成