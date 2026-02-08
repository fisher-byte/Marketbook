/**
 * tradingController 单元测试
 * 测试交易控制器的核心逻辑（下单、持仓、历史）
 */

const request = require('supertest');
const express = require('express');
const tradingController = require('../../src/controllers/tradingController');
const memoryStore = require('../../src/db/memoryStore');
const jwt = require('jsonwebtoken');

// Mock JWT 配置
process.env.JWT_SECRET = 'test-secret-key';

// 创建测试应用（跳过限流中间件）
function createTestApp() {
  const app = express();
  app.use(express.json());
  
  // 简单的认证中间件
  const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ success: false, message: '未提供认证令牌' });
    }
    
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: '无效的认证令牌' });
    }
  };
  
  // 手动注册路由（不使用 rateLimitPresets）
  app.post('/api/trading/accounts', authMiddleware, tradingController.createAccount);
  app.get('/api/trading/accounts', authMiddleware, tradingController.getUserAccounts);
  app.get('/api/trading/accounts/:accountId', authMiddleware, tradingController.getAccountInfo);
  
  app.post('/api/trading/orders/buy', authMiddleware, tradingController.placeBuyOrder);
  app.post('/api/trading/orders/sell', authMiddleware, tradingController.placeSellOrder);
  
  app.get('/api/trading/accounts/:accountId/positions', authMiddleware, tradingController.getPositions);
  app.get('/api/trading/accounts/:accountId/history', authMiddleware, tradingController.getTradeHistory);
  
  // 行情API（无需认证）
  app.get('/api/trading/quotes/:symbol', tradingController.getQuote);
  app.get('/api/trading/quotes', tradingController.getBatchQuotes);
  app.get('/api/trading/market/symbols', tradingController.searchSymbols);
  
  // 错误处理
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      type: err.type || 'INTERNAL_ERROR'
    });
  });
  
  return app;
}

// 生成测试Token
function generateTestToken(userId = 'test-user-1') {
  return jwt.sign(
    { id: userId, email: 'test@example.com' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('tradingController - 交易控制器测试', () => {
  let app;
  let testToken;
  let testUserId;

  beforeEach(() => {
    app = createTestApp();
    testUserId = 'test-user-' + Date.now();
    testToken = generateTestToken(testUserId);
    
    // 清空存储
    memoryStore.clear('tradingAccounts');
    memoryStore.clear('tradingRecords');
  });

  describe('POST /api/trading/accounts - 创建模拟盘账户', () => {
    test('应该成功创建账户', async () => {
      const response = await request(app)
        .post('/api/trading/accounts')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'My First Account',
          initialBalance: 100000
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('My First Account');
      expect(response.body.data.balance).toBe(100000);
      expect(response.body.data.userId).toBe(testUserId);
    });

    test('应该使用默认余额（100000）', async () => {
      const response = await request(app)
        .post('/api/trading/accounts')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Default Account' })
        .expect(201);

      expect(response.body.data.balance).toBe(100000);
    });

    test('应该拒绝未认证的请求', async () => {
      await request(app)
        .post('/api/trading/accounts')
        .send({ name: 'Test Account' })
        .expect(401);
    });

    test('应该拒绝无效的初始余额', async () => {
      const response = await request(app)
        .post('/api/trading/accounts')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Invalid Account',
          initialBalance: -1000
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('初始余额');
    });
  });

  describe('GET /api/trading/accounts/:accountId - 获取账户信息', () => {
    let accountId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/trading/accounts')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Test Account' });
      
      accountId = response.body.data.accountId;
    });

    test('应该成功获取账户信息', async () => {
      const response = await request(app)
        .get(`/api/trading/accounts/${accountId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accountId).toBe(accountId);
      expect(response.body.data.name).toBe('Test Account');
    });

    test('应该拒绝访问他人的账户', async () => {
      const otherUserToken = generateTestToken('other-user');

      const response = await request(app)
        .get(`/api/trading/accounts/${accountId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('应该拒绝访问不存在的账户', async () => {
      await request(app)
        .get('/api/trading/accounts/nonexistent')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });
  });

  describe('POST /api/trading/orders/buy - 买入下单', () => {
    let accountId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/trading/accounts')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Trading Account', initialBalance: 100000 });
      
      accountId = response.body.data.accountId;
    });

    test('应该成功下买单', async () => {
      const response = await request(app)
        .post('/api/trading/orders/buy')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          accountId,
          symbol: 'AAPL',
          quantity: 10,
          price: 150
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.symbol).toBe('AAPL');
      expect(response.body.data.order.quantity).toBe(10);
      expect(response.body.data.order.type).toBe('buy');
      expect(response.body.data.balance).toBeLessThan(100000); // 余额减少
    });

    test('应该拒绝余额不足的订单', async () => {
      const response = await request(app)
        .post('/api/trading/orders/buy')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          accountId,
          symbol: 'AAPL',
          quantity: 10000, // 需要 1,500,000，余额只有 100,000
          price: 150
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('余额不足');
    });

    test('应该拒绝无效的数量', async () => {
      await request(app)
        .post('/api/trading/orders/buy')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          accountId,
          symbol: 'AAPL',
          quantity: 0, // 无效数量
          price: 150
        })
        .expect(400);
    });

    test('应该拒绝缺少必需参数', async () => {
      await request(app)
        .post('/api/trading/orders/buy')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          accountId,
          symbol: 'AAPL'
          // 缺少 quantity 和 price
        })
        .expect(400);
    });
  });

  describe('POST /api/trading/orders/sell - 卖出下单', () => {
    let accountId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/trading/accounts')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Trading Account', initialBalance: 100000 });
      
      accountId = response.body.data.accountId;

      // 先买入
      await request(app)
        .post('/api/trading/orders/buy')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          accountId,
          symbol: 'AAPL',
          quantity: 100,
          price: 150
        });
    });

    test('应该成功下卖单', async () => {
      const response = await request(app)
        .post('/api/trading/orders/sell')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          accountId,
          symbol: 'AAPL',
          quantity: 50,
          price: 160
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.symbol).toBe('AAPL');
      expect(response.body.data.order.quantity).toBe(50);
      expect(response.body.data.order.type).toBe('sell');
    });

    test('应该拒绝卖出不存在的持仓', async () => {
      const response = await request(app)
        .post('/api/trading/orders/sell')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          accountId,
          symbol: 'GOOGL', // 没有持仓
          quantity: 10,
          price: 2800
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('持仓不足');
    });

    test('应该拒绝卖出数量超过持仓', async () => {
      const response = await request(app)
        .post('/api/trading/orders/sell')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          accountId,
          symbol: 'AAPL',
          quantity: 200, // 持仓只有100
          price: 160
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('持仓不足');
    });
  });

  describe('GET /api/trading/accounts/:accountId/positions - 获取持仓', () => {
    let accountId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/trading/accounts')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Trading Account', initialBalance: 100000 });
      
      accountId = response.body.data.accountId;

      // 买入多个股票
      await request(app)
        .post('/api/trading/orders/buy')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          accountId,
          symbol: 'AAPL',
          quantity: 100,
          price: 150
        });

      await request(app)
        .post('/api/trading/orders/buy')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          accountId,
          symbol: 'GOOGL',
          quantity: 20,
          price: 2800
        });
    });

    test('应该返回所有持仓', async () => {
      const response = await request(app)
        .get(`/api/trading/accounts/${accountId}/positions`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      const aaplPosition = response.body.data.find(p => p.symbol === 'AAPL');
      expect(aaplPosition.quantity).toBe(100);
      expect(aaplPosition.averagePrice).toBe(150);
    });

    test('应该正确计算成本价（多次买入）', async () => {
      // 再次买入 AAPL
      await request(app)
        .post('/api/trading/orders/buy')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          accountId,
          symbol: 'AAPL',
          quantity: 100,
          price: 160
        });

      const response = await request(app)
        .get(`/api/trading/accounts/${accountId}/positions`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      const aaplPosition = response.body.data.find(p => p.symbol === 'AAPL');
      expect(aaplPosition.quantity).toBe(200);
      expect(aaplPosition.averagePrice).toBe(155); // (100*150 + 100*160) / 200
    });

    test('卖出后应更新持仓数量', async () => {
      // 卖出部分 AAPL
      await request(app)
        .post('/api/trading/orders/sell')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          accountId,
          symbol: 'AAPL',
          quantity: 50,
          price: 160
        });

      const response = await request(app)
        .get(`/api/trading/accounts/${accountId}/positions`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      const aaplPosition = response.body.data.find(p => p.symbol === 'AAPL');
      expect(aaplPosition.quantity).toBe(50);
    });
  });

  describe('GET /api/trading/accounts/:accountId/history - 获取交易历史', () => {
    let accountId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/trading/accounts')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Trading Account' });
      
      accountId = response.body.data.accountId;

      // 执行多笔交易
      await request(app)
        .post('/api/trading/orders/buy')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ accountId, symbol: 'AAPL', quantity: 10, price: 150 });

      await request(app)
        .post('/api/trading/orders/buy')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ accountId, symbol: 'GOOGL', quantity: 5, price: 2800 });
    });

    test('应该返回所有交易记录', async () => {
      const response = await request(app)
        .get(`/api/trading/accounts/${accountId}/history`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].symbol).toBeDefined();
      expect(response.body.data[0].type).toBeDefined();
    });

    test('应该按时间倒序排列', async () => {
      const response = await request(app)
        .get(`/api/trading/accounts/${accountId}/history`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      const timestamps = response.body.data.map(r => new Date(r.createdAt).getTime());
      
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }
    });

    test('应该支持分页查询', async () => {
      const response = await request(app)
        .get(`/api/trading/accounts/${accountId}/history?limit=1`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('行情查询API测试', () => {
    test('GET /api/trading/quotes/:symbol - 获取单个行情', async () => {
      const response = await request(app)
        .get('/api/trading/quotes/AAPL')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.symbol).toBe('AAPL');
      expect(response.body.data.price).toBeDefined();
    });

    test('GET /api/trading/quotes - 批量获取行情', async () => {
      const response = await request(app)
        .get('/api/trading/quotes?symbols=AAPL,GOOGL,MSFT')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    test('GET /api/trading/market/symbols - 搜索股票', async () => {
      const response = await request(app)
        .get('/api/trading/market/symbols?q=AAPL')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
});
