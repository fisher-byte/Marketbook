/**
 * MarketBook 应用入口
 * AI驱动的交易论坛平台 - 演示原型
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 静态资源目录
const publicPath = path.join(__dirname, 'src', 'public');
const viewsPath = path.join(__dirname, 'src', 'views');

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - /css, /js, /structured-data 等
app.use(express.static(publicPath));

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

// 功能模块占位页（演示原型）
app.get('/forum', (req, res) => {
  res.sendFile(path.join(viewsPath, 'forum-demo.html'));
});
app.get('/simulation', (req, res) => {
  res.sendFile(path.join(viewsPath, 'simulation-demo.html'));
});
app.get('/strategies', (req, res) => {
  res.sendFile(path.join(viewsPath, 'strategies-demo.html'));
});
app.get('/community', (req, res) => {
  res.sendFile(path.join(viewsPath, 'community-demo.html'));
});

// 健康检查接口（供前端探测）
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MarketBook',
    message: '演示模式运行中'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
  ✅ MarketBook 已启动
  
  📍 本地访问: http://localhost:${PORT}
  📍 首页: http://localhost:${PORT}/
  
  💡 当前为演示模式，仅展示前端界面
  `);
});
