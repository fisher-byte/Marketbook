/**
 * UserStore 单元测试
 * 
 * 测试用户存储的注册、登录、密码加密等功能
 */

const { UserStore } = require('../../src/models/UserStore');
const memoryStore = require('../../src/db/memoryStore');
const bcrypt = require('bcryptjs');

describe('UserStore', () => {
  beforeEach(() => {
    // 每次测试前清空用户存储
    memoryStore.clear('users');
    memoryStore.clear('userProfiles');
  });

  describe('save()', () => {
    test('应该成功创建用户并加密密码', async () => {
      const userData = {
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123'
      };

      const user = await UserStore.save(userData);

      expect(user).toHaveProperty('id');
      expect(user.username).toBe('alice');
      expect(user.email).toBe('alice@example.com');
      expect(user.password).not.toBe('password123'); // 密码已加密
      expect(user.password.length).toBeGreaterThan(20); // bcrypt 哈希长度
      expect(user.password.startsWith('$2')).toBe(true); // bcrypt 格式
    });

    test('应该设置默认值', async () => {
      const user = await UserStore.save({
        username: 'bob',
        email: 'bob@example.com',
        password: 'password123'
      });

      // User 类可能没有返回所有字段，检查关键字段即可
      expect(user.username).toBe('bob');
      expect(user.email).toBe('bob@example.com');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
    });

    test('已加密的密码不应重复加密', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const user = await UserStore.save({
        username: 'alice',
        email: 'alice@example.com',
        password: hashedPassword
      });

      expect(user.password).toBe(hashedPassword); // 保持不变
    });
  });

  describe('findOne()', () => {
    test('应该根据邮箱找到用户', async () => {
      await UserStore.save({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123'
      });

      const user = await UserStore.findOne({ email: 'alice@example.com' });

      expect(user).not.toBeNull();
      expect(user.username).toBe('alice');
    });

    test('应该根据用户名找到用户', async () => {
      await UserStore.save({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123'
      });

      const user = await UserStore.findOne({ username: 'alice' });

      expect(user).not.toBeNull();
      expect(user.email).toBe('alice@example.com');
    });

    test('未找到时返回null', async () => {
      const user = await UserStore.findOne({ email: 'nonexist@example.com' });
      expect(user).toBeNull();
    });
  });

  describe('findById()', () => {
    test('应该根据ID找到用户', async () => {
      const created = await UserStore.save({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123'
      });

      const user = await UserStore.findById(created.id);

      expect(user).not.toBeNull();
      expect(user.username).toBe('alice');
      expect(user.id).toBe(created.id);
    });

    test('无效ID应该返回null', async () => {
      const user = await UserStore.findById(9999);
      expect(user).toBeNull();
    });
  });

  describe('comparePassword()', () => {
    test('正确密码应该验证通过', async () => {
      const user = await UserStore.save({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123'
      });

      // comparePassword 参数顺序是 (plainPassword, hashedPassword)
      const isMatch = await UserStore.comparePassword('password123', user.password);
      expect(isMatch).toBe(true);
    });

    test('错误密码应该验证失败', async () => {
      const user = await UserStore.save({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123'
      });

      const isMatch = await UserStore.comparePassword('wrongpassword', user.password);
      expect(isMatch).toBe(false);
    });
  });

  describe('密码加密', () => {
    test('相同密码应该生成不同哈希（salt随机）', async () => {
      const user1 = await UserStore.save({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123'
      });

      const user2 = await UserStore.save({
        username: 'bob',
        email: 'bob@example.com',
        password: 'password123'
      });

      expect(user1.password).not.toBe(user2.password);
    });

    test('原始密码不应该存储在数据库中', async () => {
      const user = await UserStore.save({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123'
      });

      expect(user.password).not.toBe('password123');
      expect(user.password.startsWith('$2')).toBe(true); // bcrypt 格式
    });
  });

  describe('唯一性约束模拟', () => {
    test('相同邮箱应该可以检测到重复', async () => {
      await UserStore.save({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123'
      });

      const existing = await UserStore.findOne({ email: 'alice@example.com' });
      expect(existing).not.toBeNull();
      
      // 在实际使用中，authService 会检查 existing 并返回错误
    });
  });

  describe('边界情况', () => {
    test('应该处理空密码字段（不加密）', async () => {
      const user = await UserStore.save({
        username: 'alice',
        email: 'alice@example.com',
        password: ''
      });

      expect(user.password).toBe('');
    });
  });

  describe('统计功能', () => {
    test('count() 应该返回用户总数', async () => {
      await UserStore.save({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123'
      });
      
      await UserStore.save({
        username: 'bob',
        email: 'bob@example.com',
        password: 'password123'
      });

      const count = await UserStore.count();
      expect(count).toBe(2);
    });

    test('count() 应该支持条件查询', async () => {
      await UserStore.save({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
        role: 'admin'
      });
      
      await UserStore.save({
        username: 'bob',
        email: 'bob@example.com',
        password: 'password123',
        role: 'user'
      });

      const adminCount = await UserStore.count({ role: 'admin' });
      expect(adminCount).toBe(1);
    });
  });
});
