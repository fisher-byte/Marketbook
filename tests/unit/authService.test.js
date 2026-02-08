/**
 * authService 单元测试
 * 测试认证业务逻辑（注册、登录、Token生成）
 * 
 * 适配真实 authService API:
 * - 返回结构: { success, message, data: { user, token, profile } }
 * - getCurrentUser 接收 userId（非 token）
 * - canLogin 在 User 模型上，非 authService 方法
 */

const authService = require('../../src/services/authService');
const { UserStore } = require('../../src/models/UserStore');
const memoryStore = require('../../src/db/memoryStore');
const jwt = require('jsonwebtoken');

// Mock JWT 配置
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

describe('authService - 认证服务测试', () => {
  beforeEach(() => {
    memoryStore.clear('users');
    memoryStore.clear('userProfiles');
  });

  describe('register() - 用户注册', () => {
    test('应该成功注册新用户并返回Token', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        username: 'newuser'
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.token).toBeDefined();
      expect(result.data.user).toBeDefined();
      expect(result.data.user.email).toBe('newuser@example.com');
      expect(result.data.user.password).toBeUndefined(); // 密码不应返回
    });

    test('应该拒绝重复的邮箱', async () => {
      await UserStore.save({
        email: 'existing@example.com',
        password: 'Pass123!',
        username: 'existing',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });

      const result = await authService.register({
        email: 'existing@example.com',
        password: 'NewPass456!',
        username: 'newuser'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('邮箱');
    });

    test('应该拒绝重复的用户名', async () => {
      await UserStore.save({
        email: 'first@example.com',
        password: 'Pass123!',
        username: 'testuser',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });

      const result = await authService.register({
        email: 'second@example.com',
        password: 'Pass123!',
        username: 'testuser'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('用户名');
    });

    test('生成的Token应包含正确的用户信息', async () => {
      const result = await authService.register({
        email: 'test@example.com',
        password: 'Pass123!',
        username: 'testuser'
      });

      expect(result.success).toBe(true);
      
      // 使用 authService.verifyToken 验证，而非直接用 jwt.verify
      const verifyResult = authService.verifyToken(result.data.token);

      expect(verifyResult.success).toBe(true);
      expect(verifyResult.data.userId).toBe(result.data.user.id);
      expect(verifyResult.data.email).toBe('test@example.com');
    });
  });

  describe('login() - 用户登录', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'user@example.com',
        password: 'CorrectPassword123!',
        username: 'testuser'
      });
    });

    test('应该成功登录并返回Token', async () => {
      const result = await authService.login({
        email: 'user@example.com',
        password: 'CorrectPassword123!'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.token).toBeDefined();
      expect(result.data.user.email).toBe('user@example.com');
    });

    test('应该拒绝错误的密码', async () => {
      const result = await authService.login({
        email: 'user@example.com',
        password: 'WrongPassword'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('邮箱或密码错误');
    });

    test('应该拒绝不存在的邮箱', async () => {
      const result = await authService.login({
        email: 'nonexistent@example.com',
        password: 'AnyPassword'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('邮箱或密码错误');
    });

    test('应该更新最后登录时间', async () => {
      const result = await authService.login({
        email: 'user@example.com',
        password: 'CorrectPassword123!'
      });

      expect(result.success).toBe(true);
      const user = await UserStore.findById(result.data.user.id);
      expect(user.lastLoginAt).toBeDefined();
    });
  });

  describe('generateToken() - 生成Token', () => {
    test('应该生成有效的JWT Token', () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser'
      };

      const token = authService.generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // 使用 authService.verifyToken 验证
      const result = authService.verifyToken(token);
      expect(result.success).toBe(true);
      expect(result.data.userId).toBe('user123');
      expect(result.data.email).toBe('test@example.com');
    });

    test('Token应包含过期时间', () => {
      const user = { id: 'user123', email: 'test@example.com', username: 'test' };
      const token = authService.generateToken(user);
      
      const result = authService.verifyToken(token);
      expect(result.success).toBe(true);
      expect(result.data.exp).toBeDefined();
      expect(result.data.iat).toBeDefined();
    });
  });

  describe('verifyToken() - 验证Token', () => {
    test('应该成功验证有效的Token', () => {
      const user = { id: 'user123', email: 'test@example.com', username: 'test' };
      const token = authService.generateToken(user);

      const result = authService.verifyToken(token);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.userId).toBe('user123');
      expect(result.data.email).toBe('test@example.com');
    });

    test('应该拒绝无效的Token', () => {
      const result = authService.verifyToken('invalid.token.here');
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    test('应该拒绝过期的Token', async () => {
      // 生成一个1ms就过期的token
      const expiredToken = jwt.sign(
        { userId: 'user123', email: 'test@example.com', username: 'test' },
        process.env.JWT_SECRET,
        { expiresIn: '1ms' }
      );

      // 等待超时
      await new Promise((resolve) => setTimeout(resolve, 10));
      
      const result = authService.verifyToken(expiredToken);
      expect(result.success).toBe(false);
    });
  });

  describe('getCurrentUser() - 获取当前用户', () => {
    test('应该通过userId获取用户信息', async () => {
      const registerResult = await authService.register({
        email: 'test@example.com',
        password: 'Pass123!',
        username: 'testuser'
      });

      expect(registerResult.success).toBe(true);
      const userId = registerResult.data.user.id;

      const result = await authService.getCurrentUser(userId);

      expect(result.success).toBe(true);
      expect(result.data.user).toBeDefined();
      expect(result.data.user.email).toBe('test@example.com');
      expect(result.data.user.password).toBeUndefined(); // 密码不应返回
    });

    test('应该处理不存在的用户', async () => {
      const result = await authService.getCurrentUser(9999);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('用户不存在');
    });
  });

  describe('边界情况测试', () => {
    test('应该处理特殊字符的邮箱', async () => {
      const result = await authService.register({
        email: 'test+special@example.com',
        password: 'Pass123!',
        username: 'specialuser'
      });

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('test+special@example.com');
    });

    test('应该处理长密码', async () => {
      const longPassword = 'A'.repeat(100) + '1!';
      const result = await authService.register({
        email: 'longpass@example.com',
        password: longPassword,
        username: 'longpassuser'
      });

      expect(result.success).toBe(true);

      const loginResult = await authService.login({
        email: 'longpass@example.com',
        password: longPassword
      });

      expect(loginResult.success).toBe(true);
    });
  });

  describe('安全性测试', () => {
    test('密码不应出现在返回的用户对象中', async () => {
      const result = await authService.register({
        email: 'security@example.com',
        password: 'SecretPass123!',
        username: 'secureuser'
      });

      expect(result.success).toBe(true);
      expect(result.data.user.password).toBeUndefined();
    });

    test('Token不应包含敏感信息', () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        password: 'should-not-be-included'
      };

      const token = authService.generateToken(user);
      const result = authService.verifyToken(token);

      expect(result.success).toBe(true);
      expect(result.data.password).toBeUndefined();
    });
  });

  describe('refreshToken() - 刷新Token', () => {
    test('应该成功刷新有效的Token', async () => {
      const registerResult = await authService.register({
        email: 'refresh@example.com',
        password: 'Pass123!',
        username: 'refreshuser'
      });

      expect(registerResult.success).toBe(true);
      const oldToken = registerResult.data.token;

      // 等待1秒确保 iat 不同
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result = await authService.refreshToken(oldToken);

      expect(result.success).toBe(true);
      expect(result.data.token).toBeDefined();
      expect(result.data.token).not.toBe(oldToken); // 新token应不同于旧token
    });

    test('应该拒绝无效的Token', async () => {
      const result = await authService.refreshToken('invalid.token');
      
      expect(result.success).toBe(false);
    });
  });

  describe('changePassword() - 修改密码', () => {
    let userId;
    const oldPassword = 'OldPass123!';
    const newPassword = 'NewPass456!';

    beforeEach(async () => {
      const result = await authService.register({
        email: 'changepass@example.com',
        password: oldPassword,
        username: 'changepassuser'
      });
      userId = result.data.user.id;
    });

    test('应该成功修改密码', async () => {
      const result = await authService.changePassword(userId, oldPassword, newPassword);

      expect(result.success).toBe(true);

      // 验证新密码可登录
      const loginResult = await authService.login({
        email: 'changepass@example.com',
        password: newPassword
      });

      expect(loginResult.success).toBe(true);
    });

    test('应该拒绝错误的旧密码', async () => {
      const result = await authService.changePassword(userId, 'WrongOldPass', newPassword);

      expect(result.success).toBe(false);
      expect(result.message).toContain('旧密码错误');
    });

    test('应该拒绝不存在的用户', async () => {
      const result = await authService.changePassword(9999, oldPassword, newPassword);

      expect(result.success).toBe(false);
      expect(result.message).toContain('用户不存在');
    });
  });
});
