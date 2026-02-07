# MarketBook 项目结构

> 以当前实际代码为准

```
MarketBook/
├── app.js                 # 应用入口（当前仅静态服务）
├── package.json
├── README.md              # 项目总览
├── 项目现状说明.md         # 完成情况
├── SOP/                   # 开发流程
├── docs/                  # 文档与归档
├── memory/                # Agent 记忆
├── test/                  # 测试文件
└── src/
    ├── config/            # 配置（auth、email、simulation 等）
    ├── controllers/       # 控制器
    ├── middleware/        # 中间件（auth、validation、upload）
    ├── models/            # 数据模型
    ├── routes/            # API 路由（未挂载）
    ├── services/          # 业务服务
    ├── utils/             # 工具函数
    ├── public/            # 静态资源（CSS、JS、structured-data）
    ├── views/             # HTML 页面
    ├── frontend/           # 前端组件与演示（RiskMonitor 等）
    ├── data/              # 示例数据
    └── tests/             # 单元测试
```

## 开发原则

- 每次只改一个小功能点
- 模块化设计
- 编写测试与文档
