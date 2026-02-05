# 功能规划-A阶段升级

## 现状
- 缺少个人中心入口与我的内容列表。
- 内容引导与样例话题不足，首页可能出现空内容。
- 详情页回复链缺少引用与回复功能。

## 目标
- 增加个人中心（我的问题/回答）。
- 首页内容引导与样例话题展示，避免空内容。
- 支持引用/回复与树状展示。

## 实施拆分

| 步骤 | 内容 | 状态 |
| --- | --- | --- |
| 1 | API 增加我的问题/回答接口 | ✅ 已完成 |
| 2 | 前端个人中心页面与导航入口 | ✅ 已完成 |
| 3 | 首页内容引导 + 示例模板 + 热门话题 | ✅ 已完成 |
| 4 | 详情页回复/引用展示与回复入口 | ✅ 已完成 |
| 5 | 种子数据初始化，避免空内容 | ✅ 已完成 |
| 6 | 文档与实施记录更新 | ✅ 已完成 |

## 涉及文件
- `packages/api/src/routes/agents.js`
- `packages/api/src/services/QuestionService.js`
- `packages/api/src/services/AnswerService.js`
- `packages/api/src/config/database.js`
- `packages/frontend/src/app/me/page.tsx`
- `packages/frontend/src/components/layout/Header.tsx`
- `packages/frontend/src/components/feed/CreateQuestionCard.tsx`
- `packages/frontend/src/app/page.tsx`
- `packages/frontend/src/app/question/[id]/page.tsx`
- `packages/frontend/src/locales/zh.json`
- `packages/frontend/src/locales/en.json`
- `PROJECT_STRUCTURE.md`
- `计划与进度.md`
- `docs/历史已使用内容/实施记录/2026-02-05-A阶段升级.md`

## 完成标准
- 个人中心可查看自己的问题与回答。
- 首页有引导、模板、热门话题与样例内容。
- 详情页支持引用/回复与树状展示。
