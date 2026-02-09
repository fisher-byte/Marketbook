# Docker 部署快速指南

> 使用 Docker 容器化部署 MarketBook 应用

---

## 📦 前置要求

- **Docker**: >= 20.10
- **Docker Compose**: >= 2.0

验证安装：
```bash
docker --version
docker-compose --version
```

---

## 🚀 快速启动

### 1. 环境变量配置

复制环境变量模板：
```bash
cp .env.example .env
```

**必需配置**：
```env
# JWT 密钥（必须设置，用于生产环境）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 应用URL（根据部署环境修改）
APP_URL=http://localhost:3000

# 环境（development/production）
NODE_ENV=production
```

**可选配置**：
- 数据库连接（MongoDB/Redis）
- 邮件服务（SMTP）
- 行情API（Alpha Vantage/Yahoo Finance）
- Sentry 错误监控

参考 `.env.example` 查看完整配置项。

---

### 2. 构建镜像

```bash
docker-compose build
```

**可选参数**：
- `--no-cache`: 不使用缓存，从头构建
- `--pull`: 拉取最新基础镜像

---

### 3. 启动服务

```bash
docker-compose up -d
```

参数说明：
- `-d`: 后台运行
- `--build`: 启动前先构建镜像

---

### 4. 验证部署

#### 检查服务状态
```bash
docker-compose ps
```

#### 查看日志
```bash
# 实时查看所有日志
docker-compose logs -f

# 查看应用日志
docker-compose logs -f app

# 查看最近100行日志
docker-compose logs --tail=100 app
```

#### 健康检查
```bash
# 基础健康检查
curl http://localhost:3000/health

# 就绪检查（K8s readinessProbe）
curl http://localhost:3000/health/ready

# 存活检查（K8s livenessProbe）
curl http://localhost:3000/health/live
```

预期返回：
```json
{
  "status": "healthy",
  "timestamp": "2026-02-08T12:00:00.000Z",
  "uptime": 123.45,
  "service": "marketbook-api",
  "version": "1.0.0",
  "environment": "production"
}
```

---

## 🔧 常用命令

### 容器管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 停止并删除容器
docker-compose down

# 停止并删除容器+卷（清空数据）
docker-compose down -v
```

### 日志和调试

```bash
# 查看实时日志
docker-compose logs -f app

# 进入容器内部
docker-compose exec app sh

# 查看容器进程
docker-compose top app

# 查看容器资源使用
docker stats marketbook-app
```

### 更新和重新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 仅重新构建镜像
docker-compose build --no-cache
```

---

## 🗄️ 启用数据库（可选）

默认配置使用内存存储。如需启用 MongoDB + Redis：

### 1. 取消注释 docker-compose.yml

找到以下服务，取消注释：
```yaml
# mongodb:
#   image: mongo:7
#   ...

# redis:
#   image: redis:7-alpine
#   ...
```

### 2. 配置环境变量

在 `.env` 中添加：
```env
# MongoDB
MONGODB_URI=mongodb://admin:your-password@mongodb:27017/marketbook?authSource=admin
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=your-secure-password

# Redis
REDIS_URL=redis://:your-redis-password@redis:6379
REDIS_PASSWORD=your-secure-password
```

### 3. 重新启动

```bash
docker-compose down
docker-compose up -d
```

---

## 🔒 生产环境最佳实践

### 1. 安全加固

- ✅ 使用强 JWT_SECRET（至少32位随机字符串）
- ✅ 设置 CORS 白名单（不要使用 `*`）
- ✅ 配置速率限制
- ✅ 启用 HTTPS（通过 Nginx 反向代理）
- ✅ 数据库使用强密码
- ✅ 定期更新基础镜像

### 2. 性能优化

```yaml
# docker-compose.yml 添加资源限制
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 3. 日志管理

```yaml
# docker-compose.yml 配置日志轮转
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 4. 启用 Nginx 反向代理

取消注释 `docker-compose.yml` 中的 nginx 服务，并创建 `nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

## 🐛 故障排查

### 容器无法启动

```bash
# 查看详细错误日志
docker-compose logs app

# 检查环境变量
docker-compose config

# 验证镜像构建
docker-compose build --no-cache
```

### 健康检查失败

```bash
# 进入容器调试
docker-compose exec app sh

# 手动测试健康检查端点
curl http://localhost:3000/health/live

# 查看进程状态
docker-compose top app
```

### 端口冲突

修改 `docker-compose.yml` 或 `.env`：
```yaml
ports:
  - "3001:3000"  # 使用3001端口
```

或：
```env
PORT=3001
```

---

## 📊 监控和维护

### 容器健康监控

```bash
# 查看健康状态
docker ps --filter "name=marketbook-app" --format "table {{.Names}}\t{{.Status}}"

# 查看健康检查历史
docker inspect marketbook-app | jq '.[0].State.Health'
```

### 自动重启策略

`docker-compose.yml` 中已配置：
```yaml
restart: unless-stopped
```

策略选项：
- `no`: 不自动重启
- `always`: 总是重启
- `on-failure`: 失败时重启
- `unless-stopped`: 除非手动停止，否则重启

---

## 🚀 CI/CD 集成

### GitHub Actions 示例

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker-compose build
      
      - name: Run tests
        run: docker-compose run --rm app npm test
      
      - name: Deploy
        run: docker-compose up -d
```

---

## 📚 更多资源

- [Dockerfile 参考文档](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose 参考文档](https://docs.docker.com/compose/compose-file/)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)
- [生产部署完整指南](./README_PRODUCTION.md)

---

## 🆘 需要帮助？

- **问题追踪**: [GitHub Issues](https://github.com/fisher-byte/Marketbook/issues)
- **文档**: [README_PRODUCTION.md](./README_PRODUCTION.md)
- **健康检查**: `GET /health`
