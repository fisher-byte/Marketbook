/**
 * TradingAccountStore 单元测试
 * 测试模拟盘账户管理功能
 */

const TradingAccountStore = require('../../src/models/TradingAccountStore');
const memoryStore = require('../../src/db/memoryStore');

describe('TradingAccountStore', () => {
  beforeEach(() => {
    memoryStore.clear('tradingAccounts');
  });

  describe('Account Creation', () => {
    test('应能创建新账户并设置默认值', () => {
      const account = TradingAccountStore.create({
        userId: 'user-123',
        accountName: 'My Trading Account',
        initialBalance: 100000
      });
      
      expect(account).toHaveProperty('accountId');
      expect(account.userId).toBe('user-123');
      expect(account.accountName).toBe('My Trading Account');
      expect(account.initialBalance).toBe(100000);
      expect(account.balance).toBe(100000);
      expect(account.totalAssets).toBe(100000);
      expect(account.status).toBe('active');
      expect(account.createdAt).toBeInstanceOf(Date);
    });

    test('应设置默认初始余额', () => {
      const account = TradingAccountStore.create({
        userId: 'user-123',
        accountName: 'Test Account'
      });
      
      expect(account.initialBalance).toBe(100000);
      expect(account.balance).toBe(100000);
    });

    test('应初始化空的持仓记录', () => {
      const account = TradingAccountStore.create({
        userId: 'user-123',
        accountName: 'Test Account'
      });
      
      expect(account.positions).toEqual({});
    });
  });

  describe('Account Query', () => {
    beforeEach(() => {
      TradingAccountStore.create({
        userId: 'user-1',
        accountName: 'Account 1',
        initialBalance: 100000
      });
      TradingAccountStore.create({
        userId: 'user-1',
        accountName: 'Account 2',
        initialBalance: 50000
      });
      TradingAccountStore.create({
        userId: 'user-2',
        accountName: 'Account 3',
        initialBalance: 200000
      });
    });

    test('应能通过accountId查找账户', () => {
      const accounts = memoryStore.find('tradingAccounts', { userId: 'user-1' });
      const firstAccountId = accounts[0].accountId;
      
      const found = TradingAccountStore.findById(firstAccountId);
      
      expect(found).not.toBeNull();
      expect(found.accountId).toBe(firstAccountId);
    });

    test('应能查询用户的所有账户', () => {
      const accounts = TradingAccountStore.findByUserId('user-1');
      
      expect(accounts).toHaveLength(2);
      expect(accounts.every(acc => acc.userId === 'user-1')).toBe(true);
    });

    test('不存在的用户应返回空数组', () => {
      const accounts = TradingAccountStore.findByUserId('nonexistent-user');
      expect(accounts).toEqual([]);
    });
  });

  describe('Balance Operations', () => {
    test('应能更新账户余额', () => {
      const account = TradingAccountStore.create({
        userId: 'user-123',
        accountName: 'Test Account',
        initialBalance: 100000
      });
      
      const updated = TradingAccountStore.updateBalance(account.accountId, 95000);
      
      expect(updated.balance).toBe(95000);
      expect(updated.initialBalance).toBe(100000); // 初始余额不变
    });

    test('应能计算账户盈亏', () => {
      const account = TradingAccountStore.create({
        userId: 'user-123',
        accountName: 'Test Account',
        initialBalance: 100000
      });
      
      TradingAccountStore.updateBalance(account.accountId, 110000);
      const updated = TradingAccountStore.findById(account.accountId);
      
      const profit = updated.balance - updated.initialBalance;
      expect(profit).toBe(10000);
    });
  });

  describe('Position Management', () => {
    test('应能更新持仓信息', () => {
      const account = TradingAccountStore.create({
        userId: 'user-123',
        accountName: 'Test Account'
      });
      
      const positions = {
        'AAPL': { quantity: 100, avgPrice: 150 },
        'GOOGL': { quantity: 50, avgPrice: 2800 }
      };
      
      const updated = TradingAccountStore.updatePositions(account.accountId, positions);
      
      expect(updated.positions).toEqual(positions);
      expect(updated.positions['AAPL'].quantity).toBe(100);
    });

    test('应能清空持仓', () => {
      const account = TradingAccountStore.create({
        userId: 'user-123',
        accountName: 'Test Account'
      });
      
      TradingAccountStore.updatePositions(account.accountId, {
        'AAPL': { quantity: 100, avgPrice: 150 }
      });
      
      const cleared = TradingAccountStore.updatePositions(account.accountId, {});
      
      expect(cleared.positions).toEqual({});
    });
  });

  describe('Total Assets Calculation', () => {
    test('应能更新总资产', () => {
      const account = TradingAccountStore.create({
        userId: 'user-123',
        accountName: 'Test Account',
        initialBalance: 100000
      });
      
      const updated = TradingAccountStore.updateTotalAssets(account.accountId, 120000);
      
      expect(updated.totalAssets).toBe(120000);
    });

    test('总资产应能正确计算（余额 + 持仓市值）', () => {
      const account = TradingAccountStore.create({
        userId: 'user-123',
        accountName: 'Test Account',
        initialBalance: 100000
      });
      
      // 模拟买入后的状态
      TradingAccountStore.updateBalance(account.accountId, 85000); // 花费15000买入
      TradingAccountStore.updatePositions(account.accountId, {
        'AAPL': { quantity: 100, avgPrice: 150 } // 持仓市值15000
      });
      
      const totalAssets = 85000 + 15000; // 余额 + 持仓市值
      TradingAccountStore.updateTotalAssets(account.accountId, totalAssets);
      
      const updated = TradingAccountStore.findById(account.accountId);
      expect(updated.totalAssets).toBe(100000);
    });
  });

  describe('Account Deletion', () => {
    test('应能删除账户', () => {
      const account = TradingAccountStore.create({
        userId: 'user-123',
        accountName: 'Test Account'
      });
      
      const deleted = TradingAccountStore.delete(account.accountId);
      
      expect(deleted).toBe(true);
      expect(TradingAccountStore.findById(account.accountId)).toBeNull();
    });
  });

  describe('Statistics', () => {
    test('应能统计账户总数', () => {
      TradingAccountStore.create({
        userId: 'user-1',
        accountName: 'Account 1'
      });
      TradingAccountStore.create({
        userId: 'user-1',
        accountName: 'Account 2'
      });
      
      expect(TradingAccountStore.count()).toBe(2);
    });

    test('应能按用户统计账户数', () => {
      TradingAccountStore.create({ userId: 'user-1', accountName: 'A1' });
      TradingAccountStore.create({ userId: 'user-1', accountName: 'A2' });
      TradingAccountStore.create({ userId: 'user-2', accountName: 'A3' });
      
      const user1Accounts = TradingAccountStore.findByUserId('user-1');
      expect(user1Accounts).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    test('应处理更新不存在的账户', () => {
      const updated = TradingAccountStore.updateBalance('nonexistent-id', 50000);
      expect(updated).toBeNull();
    });

    test('删除不存在的账户应返回false', () => {
      const deleted = TradingAccountStore.delete('nonexistent-id');
      expect(deleted).toBe(false);
    });
  });
});
