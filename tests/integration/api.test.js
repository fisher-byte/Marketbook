/**
 * API 集成测试
 * 测试完整的用户注册 → 登录 → 交易流程
 * 
 * @author MarketBook Team
 * @created 2026-02-08
 */

const request = require('supertest');
const app = require('../../app');
const memoryStore = require('../../src/db/memoryStore');

describe('API 集成测试', () => {
    let authToken;
    let userId;
    let accountId;

    // 每次测试前清空数据
    beforeEach(() => {
        memoryStore.clearAll();
    });

    describe('认证流程', () => {
        it('应该成功注册新用户', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'Test123!'
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe('test@example.com');
            
            authToken = response.body.token;
            userId = response.body.user.id;
        });

        it('应该阻止重复邮箱注册', async () => {
            // 第一次注册
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'Test123!'
                })
                .expect(201);

            // 第二次用相同邮箱注册
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser2',
                    email: 'test@example.com',
                    password: 'Test123!'
                })
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('邮箱已被注册');
        });

        it('应该成功登录已注册用户', async () => {
            // 先注册
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'Test123!'
                });

            // 再登录
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test123!'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe('test@example.com');

            authToken = response.body.token;
        });

        it('应该拒绝错误密码登录', async () => {
            // 先注册
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'Test123!'
                });

            // 用错误密码登录
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'WrongPassword123!'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('密码错误');
        });
    });

    describe('交易账户流程', () => {
        beforeEach(async () => {
            // 注册并登录
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'Test123!'
                });

            authToken = response.body.token;
            userId = response.body.user.id;
        });

        it('应该创建新的模拟盘账户', async () => {
            const response = await request(app)
                .post('/api/trading/accounts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    initialBalance: 100000,
                    name: '测试账户'
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.account.balance).toBe(100000);
            expect(response.body.account.name).toBe('测试账户');

            accountId = response.body.account.id;
        });

        it('应该查询用户的所有账户', async () => {
            // 创建账户
            await request(app)
                .post('/api/trading/accounts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    initialBalance: 100000,
                    name: '测试账户'
                });

            // 查询账户
            const response = await request(app)
                .get('/api/trading/accounts')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.accounts.length).toBeGreaterThan(0);
            expect(response.body.accounts[0].name).toBe('测试账户');
        });

        it('应该阻止未认证用户访问', async () => {
            await request(app)
                .get('/api/trading/accounts')
                .expect(401);
        });
    });

    describe('完整交易流程', () => {
        beforeEach(async () => {
            // 注册、登录、创建账户
            const authResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'Test123!'
                });

            authToken = authResponse.body.token;
            userId = authResponse.body.user.id;

            const accountResponse = await request(app)
                .post('/api/trading/accounts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    initialBalance: 100000,
                    name: '测试账户'
                });

            accountId = accountResponse.body.account.id;
        });

        it('应该成功执行买入订单', async () => {
            const response = await request(app)
                .post('/api/trading/orders/buy')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    accountId: accountId,
                    symbol: 'AAPL',
                    quantity: 10,
                    price: 150
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.order.type).toBe('buy');
            expect(response.body.order.symbol).toBe('AAPL');
            expect(response.body.order.quantity).toBe(10);
        });

        it('应该成功执行卖出订单', async () => {
            // 先买入
            await request(app)
                .post('/api/trading/orders/buy')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    accountId: accountId,
                    symbol: 'AAPL',
                    quantity: 10,
                    price: 150
                });

            // 再卖出
            const response = await request(app)
                .post('/api/trading/orders/sell')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    accountId: accountId,
                    symbol: 'AAPL',
                    quantity: 5,
                    price: 160
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.order.type).toBe('sell');
            expect(response.body.order.quantity).toBe(5);
        });

        it('应该正确查询持仓', async () => {
            // 买入股票
            await request(app)
                .post('/api/trading/orders/buy')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    accountId: accountId,
                    symbol: 'AAPL',
                    quantity: 10,
                    price: 150
                });

            // 查询持仓
            const response = await request(app)
                .get(`/api/trading/accounts/${accountId}/positions`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.positions.length).toBeGreaterThan(0);
            expect(response.body.positions[0].symbol).toBe('AAPL');
            expect(response.body.positions[0].quantity).toBe(10);
        });

        it('应该正确查询交易历史', async () => {
            // 执行交易
            await request(app)
                .post('/api/trading/orders/buy')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    accountId: accountId,
                    symbol: 'AAPL',
                    quantity: 10,
                    price: 150
                });

            // 查询历史
            const response = await request(app)
                .get(`/api/trading/accounts/${accountId}/history`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.records.length).toBeGreaterThan(0);
            expect(response.body.records[0].symbol).toBe('AAPL');
            expect(response.body.records[0].type).toBe('buy');
        });

        it('应该正确计算账户余额', async () => {
            const initialBalance = 100000;
            const price = 150;
            const quantity = 10;
            const expectedBalance = initialBalance - (price * quantity);

            // 买入股票
            await request(app)
                .post('/api/trading/orders/buy')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    accountId: accountId,
                    symbol: 'AAPL',
                    quantity: quantity,
                    price: price
                });

            // 查询账户信息
            const response = await request(app)
                .get(`/api/trading/accounts/${accountId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.account.balance).toBe(expectedBalance);
        });

        it('应该阻止余额不足的交易', async () => {
            const response = await request(app)
                .post('/api/trading/orders/buy')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    accountId: accountId,
                    symbol: 'AAPL',
                    quantity: 10000, // 超大数量
                    price: 150
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('余额不足');
        });

        it('应该阻止卖出不存在的持仓', async () => {
            const response = await request(app)
                .post('/api/trading/orders/sell')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    accountId: accountId,
                    symbol: 'AAPL',
                    quantity: 10,
                    price: 150
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('持仓不足');
        });
    });

    describe('行情数据流程', () => {
        beforeEach(async () => {
            // 注册并登录
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'Test123!'
                });

            authToken = response.body.token;
        });

        it('应该查询单个股票行情', async () => {
            const response = await request(app)
                .get('/api/trading/quotes/AAPL')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.quote.symbol).toBe('AAPL');
            expect(response.body.quote.price).toBeDefined();
            expect(response.body.quote.name).toBeDefined();
        });

        it('应该批量查询多个股票行情', async () => {
            const response = await request(app)
                .get('/api/trading/quotes?symbols=AAPL,GOOGL,MSFT')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.quotes.length).toBe(3);
            expect(response.body.quotes[0].symbol).toBe('AAPL');
        });

        it('应该搜索股票代码', async () => {
            const response = await request(app)
                .get('/api/trading/market/symbols?query=apple')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.results.length).toBeGreaterThan(0);
            expect(response.body.results[0].symbol).toBe('AAPL');
        });
    });

    describe('频率限制', () => {
        beforeEach(async () => {
            // 注册并登录
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'Test123!'
                });

            authToken = response.body.token;
        });

        it('应该在超出限制时返回429错误', async () => {
            // 快速发送多个请求，触发频率限制
            // 注意：这个测试可能需要根据实际的频率限制配置调整
            const requests = [];
            for (let i = 0; i < 150; i++) {
                requests.push(
                    request(app)
                        .get('/api/trading/quotes/AAPL')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            }

            const responses = await Promise.all(requests);
            const tooManyRequests = responses.filter(r => r.status === 429);

            expect(tooManyRequests.length).toBeGreaterThan(0);
        }, 30000); // 延长超时时间到30秒
    });
});
