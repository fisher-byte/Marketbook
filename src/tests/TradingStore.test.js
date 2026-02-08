/**
 * TradingAccountStore 和 TradingRecordStore 单元测试
 * 测试交易账户存储和交易记录功能
 */

const TradingAccountStore = require('../models/TradingAccountStore');
const TradingRecordStore = require('../models/TradingRecordStore');
const TradingAccount = require('../models/TradingAccount');
const TradingRecord = require('../models/TradingRecord');
const memoryStore = require('../db/memoryStore');

describe('TradingAccountStore', () => {
    beforeEach(() => {
        memoryStore.clearAll();
    });

    describe('账户创建和保存', () => {
        test('应该创建并保存新的交易账户', () => {
            const accountData = {
                userId: '1',
                accountName: 'Test Account',
                currency: 'USD',
                initialBalance: 100000
            };
            
            const account = new TradingAccount(accountData);
            const saved = TradingAccountStore.save(account);

            expect(saved).toHaveProperty('accountId');
            expect(saved.userId).toBe('1');
            expect(saved.accountName).toBe('Test Account');
            expect(saved.currentBalance).toBe(100000);
            expect(saved.initialBalance).toBe(100000);
            expect(saved.status).toBe('active');
        });

        test('应该使用默认值', () => {
            const account = new TradingAccount({ 
                userId: '1'
            });
            const saved = TradingAccountStore.save(account);

            expect(saved.accountName).toBe('模拟账户');
            expect(saved.currency).toBe('USD');
            expect(saved.initialBalance).toBe(100000);
            expect(saved.currentBalance).toBe(100000);
        });

        test('验证失败应该抛出错误', () => {
            const invalidAccount = new TradingAccount({
                // 缺少必填的 userId
                accountName: 'Test'
            });

            expect(() => {
                TradingAccountStore.save(invalidAccount);
            }).toThrow(/验证失败/);
        });
    });

    describe('账户查询', () => {
        beforeEach(() => {
            const account1 = new TradingAccount({ userId: '1', accountName: 'Account 1', initialBalance: 100000 });
            const account2 = new TradingAccount({ userId: '1', accountName: 'Account 2', initialBalance: 200000 });
            const account3 = new TradingAccount({ userId: '2', accountName: 'Account 3', initialBalance: 150000 });
            
            TradingAccountStore.save(account1);
            TradingAccountStore.save(account2);
            TradingAccountStore.save(account3);
        });

        test('应该通过ID查找账户', () => {
            const accounts = TradingAccountStore.findAll();
            const firstAccountId = accounts[0].accountId;

            const found = TradingAccountStore.findById(firstAccountId);

            expect(found).not.toBeNull();
            expect(found.accountId).toBe(firstAccountId);
        });

        test('应该查询用户的所有账户', () => {
            const userAccounts = TradingAccountStore.findAllByUserId('1');

            expect(userAccounts).toHaveLength(2);
            expect(userAccounts[0].userId).toBe('1');
            expect(userAccounts[1].userId).toBe('1');
        });

        test('查询不存在的用户应返回空数组', () => {
            const noAccounts = TradingAccountStore.findAllByUserId('999');

            expect(noAccounts).toEqual([]);
        });

        test('通过 userId 查找第一个账户', () => {
            const account = TradingAccountStore.findByUserId('1');

            expect(account).not.toBeNull();
            expect(account.userId).toBe('1');
        });
    });

    describe('账户统计', () => {
        test('应该正确统计账户数量', () => {
            const account1 = new TradingAccount({ userId: '1', initialBalance: 100000 });
            const account2 = new TradingAccount({ userId: '1', initialBalance: 200000 });
            
            TradingAccountStore.save(account1);
            TradingAccountStore.save(account2);

            const count = TradingAccountStore.countByUserId('1');
            expect(count).toBe(2);
        });

        test('不存在的用户应返回0', () => {
            const count = TradingAccountStore.countByUserId('999');
            expect(count).toBe(0);
        });
    });

    describe('账户删除', () => {
        test('应该能删除账户', () => {
            const account = new TradingAccount({ userId: '1', initialBalance: 100000 });
            const saved = TradingAccountStore.save(account);

            const deleted = TradingAccountStore.deleteById(saved.accountId);
            expect(deleted).toBe(true);

            const found = TradingAccountStore.findById(saved.accountId);
            expect(found).toBeNull();
        });
    });
});

describe('TradingRecordStore', () => {
    let testAccountId;

    beforeEach(() => {
        memoryStore.clearAll();
        
        // 创建测试账户
        const account = new TradingAccount({ 
            userId: '1',
            accountName: 'Test Account',
            initialBalance: 100000
        });
        const saved = TradingAccountStore.save(account);
        testAccountId = saved.accountId;
    });

    describe('交易记录创建', () => {
        test('应该创建买入记录', () => {
            const buyRecord = new TradingRecord({
                accountId: testAccountId,
                symbol: 'AAPL',
                type: 'buy',
                quantity: 10,
                price: 150.00,
                amount: 1500.00
            });

            const saved = TradingRecordStore.save(buyRecord);

            expect(saved.recordId).toBeDefined();
            expect(saved.accountId).toBe(testAccountId);
            expect(saved.symbol).toBe('AAPL');
            expect(saved.type).toBe('buy');
            expect(saved.quantity).toBe(10);
            expect(saved.price).toBe(150.00);
        });

        test('应该创建卖出记录', () => {
            const sellRecord = new TradingRecord({
                accountId: testAccountId,
                symbol: 'GOOGL',
                type: 'sell',
                quantity: 5,
                price: 120.00,
                amount: 600.00
            });

            const saved = TradingRecordStore.save(sellRecord);

            expect(saved.type).toBe('sell');
            expect(saved.symbol).toBe('GOOGL');
        });
    });

    describe('交易记录查询', () => {
        beforeEach(() => {
            // 创建多条交易记录
            const record1 = new TradingRecord({
                accountId: testAccountId,
                symbol: 'AAPL',
                type: 'buy',
                quantity: 10,
                price: 150.00,
                amount: 1500.00,
                timestamp: new Date('2024-01-01')
            });

            const record2 = new TradingRecord({
                accountId: testAccountId,
                symbol: 'GOOGL',
                type: 'buy',
                quantity: 5,
                price: 120.00,
                amount: 600.00,
                timestamp: new Date('2024-01-02')
            });

            TradingRecordStore.save(record1);
            TradingRecordStore.save(record2);
        });

        test('应该查询账户的所有交易记录', () => {
            const records = TradingRecordStore.findByAccountId(testAccountId);

            expect(records).toHaveLength(2);
            expect(records[0].accountId).toBe(testAccountId);
        });

        test('记录应按时间倒序排列', () => {
            const records = TradingRecordStore.findByAccountId(testAccountId);

            expect(records.length).toBe(2);
            // 最新的记录应该排在前面
            expect(new Date(records[0].timestamp).getTime())
                .toBeGreaterThanOrEqual(new Date(records[1].timestamp).getTime());
        });
    });

    describe('持仓聚合计算', () => {
        beforeEach(() => {
            // 买入10股AAPL @ $150
            const buy1 = new TradingRecord({
                accountId: testAccountId,
                symbol: 'AAPL',
                type: 'buy',
                quantity: 10,
                price: 150.00,
                amount: 1500.00
            });

            // 再买入5股AAPL @ $160
            const buy2 = new TradingRecord({
                accountId: testAccountId,
                symbol: 'AAPL',
                type: 'buy',
                quantity: 5,
                price: 160.00,
                amount: 800.00
            });

            // 买入8股GOOGL @ $120
            const buy3 = new TradingRecord({
                accountId: testAccountId,
                symbol: 'GOOGL',
                type: 'buy',
                quantity: 8,
                price: 120.00,
                amount: 960.00
            });

            TradingRecordStore.save(buy1);
            TradingRecordStore.save(buy2);
            TradingRecordStore.save(buy3);
        });

        test('应该正确计算持仓数量', () => {
            const positions = TradingRecordStore.aggregatePositions(testAccountId);

            expect(positions).toHaveLength(2);
            
            const applePos = positions.find(p => p.symbol === 'AAPL');
            expect(applePos.quantity).toBe(15); // 10 + 5

            const googlePos = positions.find(p => p.symbol === 'GOOGL');
            expect(googlePos.quantity).toBe(8);
        });

        test('应该正确计算持仓成本', () => {
            const positions = TradingRecordStore.aggregatePositions(testAccountId);

            const applePos = positions.find(p => p.symbol === 'AAPL');
            // 成本价 = (10*150 + 5*160) / 15 = 2300 / 15 = 153.33
            expect(applePos.averagePrice).toBeCloseTo(153.33, 2);
            expect(applePos.totalCost).toBe(2300);
        });

        test('应该只返回持仓数量 > 0 的股票', () => {
            // 卖出所有GOOGL
            const sell = new TradingRecord({
                accountId: testAccountId,
                symbol: 'GOOGL',
                type: 'sell',
                quantity: 8,
                price: 130.00,
                amount: 1040.00
            });
            TradingRecordStore.save(sell);

            const positions = TradingRecordStore.aggregatePositions(testAccountId);

            expect(positions).toHaveLength(1);
            expect(positions[0].symbol).toBe('AAPL');
        });

        test('空账户应返回空持仓', () => {
            const emptyAccount = new TradingAccount({ userId: '999', initialBalance: 100000 });
            const saved = TradingAccountStore.save(emptyAccount);

            const positions = TradingRecordStore.aggregatePositions(saved.accountId);

            expect(positions).toEqual([]);
        });
    });

    describe('完整交易流程', () => {
        test('买入 → 持仓 → 卖出 → 平仓', () => {
            // 1. 买入10股AAPL @ $150
            const buy = new TradingRecord({
                accountId: testAccountId,
                symbol: 'AAPL',
                type: 'buy',
                quantity: 10,
                price: 150.00,
                amount: 1500.00
            });
            TradingRecordStore.save(buy);

            // 2. 验证持仓
            let positions = TradingRecordStore.aggregatePositions(testAccountId);
            expect(positions).toHaveLength(1);
            expect(positions[0].quantity).toBe(10);

            // 3. 卖出5股 @ $160
            const sell1 = new TradingRecord({
                accountId: testAccountId,
                symbol: 'AAPL',
                type: 'sell',
                quantity: 5,
                price: 160.00,
                amount: 800.00
            });
            TradingRecordStore.save(sell1);

            // 4. 验证剩余持仓
            positions = TradingRecordStore.aggregatePositions(testAccountId);
            expect(positions[0].quantity).toBe(5);

            // 5. 卖出剩余5股
            const sell2 = new TradingRecord({
                accountId: testAccountId,
                symbol: 'AAPL',
                type: 'sell',
                quantity: 5,
                price: 155.00,
                amount: 775.00
            });
            TradingRecordStore.save(sell2);

            // 6. 验证完全平仓
            positions = TradingRecordStore.aggregatePositions(testAccountId);
            expect(positions).toEqual([]);

            // 7. 验证交易历史仍然存在
            const history = TradingRecordStore.findByAccountId(testAccountId);
            expect(history).toHaveLength(3);
        });
    });
});
