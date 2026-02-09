/**
 * 健康检查路由
 * 用于 Docker、K8s、负载均衡器等监控服务健康状态
 */

const express = require('express');
const router = express.Router();

/**
 * @route GET /health
 * @desc 基础健康检查
 * @access Public
 * @returns {200} 服务正常运行
 * @returns {503} 服务不可用
 */
router.get('/', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'marketbook-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
    },
    cpu: process.cpuUsage()
  };

  res.status(200).json(healthStatus);
});

/**
 * @route GET /health/ready
 * @desc 就绪检查（K8s readinessProbe）
 * @access Public
 * @desc 检查服务是否准备好接收流量
 */
router.get('/ready', (req, res) => {
  // 检查关键依赖是否就绪
  const checks = {
    memoryStore: true, // 内存存储始终可用
    marketData: true,  // 行情服务始终可用
    // 未来可添加：数据库连接检查、Redis连接检查等
  };

  const isReady = Object.values(checks).every(status => status === true);

  if (isReady) {
    res.status(200).json({
      status: 'ready',
      checks,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      checks,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /health/live
 * @desc 存活检查（K8s livenessProbe）
 * @access Public
 * @desc 检查进程是否存活（不检查依赖状态）
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
