/**
 * MarketBook 应用入口
 * AI驱动的交易论坛平台 - 演示原型
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const apiRoutes = require('./src/routes');
const healthRoutes = require('./src/routes/health');
const { globalErrorHandler } = require('./src/middlewares/errorHandler');

const app = express();
const PORT = config.server.port;

// 静态资源目录
const publicPath = path.join(__dirname, 'src', 'public');
const viewsPath = path.join(__dirname, 'src', 'views');

// 🔒 安全头配置（Helmet）
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1年
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// 🌐 CORS 配置
const corsOptions = {
  origin: function (origin, callback) {
    // 允许无 origin 的请求（如同源请求、Postman、curl）
    if (!origin) return callback(null, true);

    // 开发环境：允许所有来源
    if (config.server.isDevelopment) {
      return callback(null, true);
    }

    // 生产环境：白名单验证
    const allowedOrigins = (config.security.cors.origin || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: config.security.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24小时
};
app.use(cors(corsOptions));

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP 请求日志中间件
app.use(logger.httpLogger);

// 静态文件服务 - /css, /js, /structured-data 等
app.use(express.static(publicPath));

// API 路由挂载
app.use('/api', apiRoutes);

// 健康检查路由（独立挂载，支持 Docker/K8s 监控）
app.use('/health', healthRoutes);

// 首页 - 展示优化后的设计页面
app.get('/', (req, res) => {
  res.sendFile(path.join(viewsPath, 'index-design-optimized.html'));
});

// 其他页面路由
app.get('/login', (req, res) => {
  res.sendFile(path.join(viewsPath, 'login-enhanced.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(viewsPath, 'register-enhanced.html'));
});
app.get('/profile', (req, res) => {
  res.sendFile(path.join(viewsPath, 'profile-enhanced.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(viewsPath, 'dashboard.html'));
});

// 功能模块占位页（演示原型）
app.get('/forum', (req, res) => {
  res.sendFile(path.join(viewsPath, 'forum-demo.html'));
});
app.get('/simulation', (req, res) => {
  res.sendFile(path.join(viewsPath, 'simulation.html'));
});
app.get('/strategies', (req, res) => {
  res.sendFile(path.join(viewsPath, 'strategies-demo.html'));
});
app.get('/community', (req, res) => {
  res.sendFile(path.join(viewsPath, 'community-demo.html'));
});

// ⚠️ 全局错误处理中间件（必须放在所有路由之后）
app.use(globalErrorHandler);

// 启动服务器
app.listen(PORT, config.server.host, () => {
  logger.info('MarketBook server started', {
    port: PORT,
    host: config.server.host,
    env: config.server.env,
    mode: 'demo',
  });
  
  console.log(`
  ✅ MarketBook 已启动
  
  📍 本地访问: http://localhost:${PORT}
  📍 首页: http://localhost:${PORT}/
  📍 环境: ${config.server.env}
  📍 日志级别: ${config.logging.level}
  
  💡 当前为演示模式，仅展示前端界面
  `);
});
