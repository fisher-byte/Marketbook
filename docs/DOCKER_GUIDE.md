# Docker 快速启动指南

> 使用 Docker 容器化部署 MarketBook

---

## 📦 快速开始

### 1. 开发环境（使用内存存储）

```bash
# 启动应用（不启动 MongoDB/Redis）
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# 后台运行
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 查看日志
docker-compose logs -f app
```

**特点**：
- 使用内存存储（无需数据库）
- 源码热更新（修改立即生效）
- 调试端口开放（9229）
- 开发日志详细（DEBUG模式）

---

### 2. 开发环境（完整版，包含 MongoDB + Redis）

```bash
# 启动完整开发环境
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile full up

# 后台运行
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile full up -d
```

**特点**：
- 包含 MongoDB 数据库
- 包含 Redis 缓存
- 适合测试数据持久化场景

---

### 3. 生产环境

```bash
# 首次启动前，创建 .env 文件
cp .env.example .env
# 编辑 .env，填写必要的生产配置（JWT_SECRET、数据库密码等）

# 构建并启动
docker-compose up --build -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

**特点**：
- 多阶段构建（优化镜像大小）
- 非 root 用户运行（安全）
- 健康检查自动重启
- 日志持久化到宿主机

---

## 🛠️ 常用命令

### 构建

```bash
# 构建镜像
docker-compose build

# 强制重新构建（忽略缓存）
docker-compose build --no-cache
```

---

### 启动/停止

```bash
# 启动所有服务
docker-compose up -d

# 启动指定服务
docker-compose up -d app mongodb

# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

---

### 日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看指定服务日志
docker-compose logs -f app

# 查看最近 100 行日志
docker-compose logs --tail=100 app
```

---

### 进入容器

```bash
# 进入应用容器
docker-compose exec app sh

# 进入 MongoDB 容器
docker-compose exec mongodb mongosh

# 进入 Redis 容器
docker-compose exec redis redis-cli
```

---

### 健康检查

```bash
# 查看健康状态
docker-compose ps

# 手动测试健康检查端点
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
curl http://localhost:3000/health/live
```

---

## 🔧 配置说明

### 环境变量

**开发环境**：不需要 `.env` 文件（使用默认配置）

**生产环境**：必须创建 `.env` 文件（参考 `.env.example`）

```bash
# 必填配置
JWT_SECRET=<生成一个安全的随机字符串>
MONGODB_PASSWORD=<MongoDB密码>
REDIS_PASSWORD=<Redis密码>

# 可选配置
NODE_ENV=production
PORT=3000
APP_URL=https://yourdomain.com
```

---

### 端口映射

| 服务 | 容器端口 | 宿主机端口 | 说明 |
|------|---------|-----------|------|
| app | 3000 | 3000 | 应用主端口 |
| mongodb | 27017 | 27017 | MongoDB 数据库 |
| redis | 6379 | 6379 | Redis 缓存 |
| debugger | 9229 | 9229 | Node.js 调试端口（仅开发） |

---

## 📊 监控与调试

### 健康检查

应用内置健康检查端点：

```bash
# 基础健康检查
curl http://localhost:3000/health
# 返回：uptime、内存、CPU 使用率

# 就绪检查（Kubernetes readinessProbe）
curl http://localhost:3000/health/ready
# 返回：应用是否准备好接收流量

# 存活检查（Kubernetes livenessProbe）
curl http://localhost:3000/health/live
# 返回：进程是否存活
```

---

### Docker 健康状态

```bash
# 查看容器健康状态
docker-compose ps

# 输出示例
#   NAME                 STATUS
#   marketbook-app       Up 5 minutes (healthy)
#   marketbook-mongodb   Up 5 minutes (healthy)
#   marketbook-redis     Up 5 minutes (healthy)
```

---

### 调试模式（开发环境）

```bash
# 启动开发环境
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# 在 Chrome DevTools 或 VS Code 中连接调试器
# 调试地址: localhost:9229
```

---

## 🚀 生产部署建议

### 1. 使用 Nginx 反向代理

取消注释 `docker-compose.yml` 中的 nginx 服务：

```yaml
nginx:
  image: nginx:alpine
  container_name: marketbook-nginx
  restart: unless-stopped
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./ssl:/etc/nginx/ssl:ro
  depends_on:
    - app
```

---

### 2. 配置 SSL 证书

将证书放到 `ssl/` 目录：

```
ssl/
├── fullchain.pem
└── privkey.pem
```

---

### 3. 数据持久化

Docker 卷会自动持久化数据：

```bash
# 查看数据卷
docker volume ls | grep marketbook

# 备份 MongoDB 数据
docker-compose exec mongodb mongodump --out=/data/backup

# 恢复 MongoDB 数据
docker-compose exec mongodb mongorestore /data/backup
```

---

### 4. 日志管理

日志自动写入宿主机 `./logs/` 目录：

```bash
logs/
├── combined.log    # 所有日志
├── error.log       # 错误日志
└── exceptions.log  # 异常日志
```

---

## 🐛 故障排查

### 应用无法启动

```bash
# 查看完整日志
docker-compose logs app

# 检查环境变量
docker-compose config

# 重新构建镜像
docker-compose build --no-cache app
```

---

### 端口冲突

```bash
# 修改 .env 文件中的端口
PORT=3001

# 或修改 docker-compose.yml
ports:
  - "3001:3000"
```

---

### 数据库连接失败

```bash
# 检查 MongoDB 是否启动
docker-compose ps mongodb

# 查看 MongoDB 日志
docker-compose logs mongodb

# 测试连接
docker-compose exec mongodb mongosh --username admin --password <password>
```

---

### 清理资源

```bash
# 停止并删除所有容器和网络
docker-compose down

# 同时删除数据卷（⚠️ 数据会丢失）
docker-compose down -v

# 清理未使用的镜像
docker image prune -a
```

---

## 📚 更多资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 官方文档](https://docs.docker.com/compose/)
- [MarketBook 生产部署指南](./README_PRODUCTION.md)

---

**快速帮助**：

```bash
# 开发模式（内存存储）
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# 生产模式
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 健康检查
curl http://localhost:3000/health
```
