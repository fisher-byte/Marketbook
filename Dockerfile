# MarketBook Dockerfile
# 多阶段构建，优化镜像大小

# ============================
# Stage 1: Dependencies
# ============================
FROM node:22-alpine AS dependencies

WORKDIR /app

# 安装依赖（利用缓存层）
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# ============================
# Stage 2: Builder
# ============================
FROM node:22-alpine AS builder

WORKDIR /app

# 复制依赖
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# 如果有构建步骤，在这里执行
# RUN npm run build

# ============================
# Stage 3: Production
# ============================
FROM node:22-alpine AS production

# 安全加固
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 复制应用文件
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/app.js ./
COPY --from=builder --chown=nodejs:nodejs /app/config ./config

# 创建日志和数据目录
RUN mkdir -p /app/logs /app/data && \
    chown -R nodejs:nodejs /app/logs /app/data

# 环境变量
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动命令
CMD ["node", "app.js"]
