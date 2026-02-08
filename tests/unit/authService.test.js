/**
 * authService 单元测试
 * 测试认证业务逻辑（注册、登录、Token生成）
 */

const authService = require('../../src/services/authService');
const UserStore = require('../../src/models/UserStore');
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
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.password).toBeUndefined(); // 密码不应返回
    });

    test('应该拒绝重复的邮箱', async () => {
      await UserStore.save({
        email: 'existing@example.com',
        password: 'Pass123!'
      });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'NewPass456!'
        })
      ).rejects.toThrow('邮箱已被注册');
    });

    test('应该验证必需的字段', async () => {
      await expect(
        authService.register({
          password: 'Pass123!'
          // 缺少 email
        })
      ).rejects.toThrow();
    });

    test('生成的Token应包含正确的用户信息', async () => {
      const result = await authService.register({
        email: 'test@example.com',
        password: 'Pass123!',
        username: 'testuser'
      });

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);

      expect(decoded.id).toBe(result.user.id);
      expect(decoded.email).toBe('test@example.com');
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
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('user@example.com');
    });

    test('应该拒绝错误的密码', async () => {
      await expect(
        authService.login({
          email: 'user@example.com',
          password: 'WrongPassword'
        })
      ).rejects.toThrow('邮箱或密码错误');
    });

    test('应该拒绝不存在的邮箱', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'AnyPassword'
        })
      ).rejects.toThrow('邮箱或密码错误');
    });

    test('应该验证必需的字段', async () => {
      await expect(
        authService.login({
          email: 'user@example.com'
          // 缺少 password
        })
      ).rejects.toThrow();
    });

    test('应该更新最后登录时间', async () => {
      const result = await authService.login({
        email: 'user@example.com',
        password: 'CorrectPassword123!'
      });

      const user = await UserStore.findById(result.user.id);
      expect(user.lastLoginAt).toBeDefined();
    });
  });

  describe('generateToken() - 生成Token', () => {
    test('应该生成有效的JWT Token', () => {
      const user = {
        id: 'user123',
        email: 'test@example.com'
      };

      const token = authService.generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe('user123');
      expect(decoded.email).toBe('test@example.com');
    });

    test('Token应包含过期时间', () => {
      const user = { id: 'user123', email: 'test@example.com' };
      const token = authService.generateToken(user);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('verifyToken() - 验证Token', () => {
    test('应该成功验证有效的Token', () => {
      const user = { id: 'user123', email: 'test@example.com' };
      const token = authService.generateToken(user);

      const decoded = authService.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe('user123');
      expect(decoded.email).toBe('test@example.com');
    });

    test('应该拒绝无效的Token', () => {
      expect(() => {
        authService.verifyToken('invalid.token.here');
      }).toThrow();
    });

    test('应该拒绝过期的Token', () => {
      // 生成一个1秒就过期的token
      const expiredToken = jwt.sign(
        { id: 'user123', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '1ms' }
      );

      // 等待超时
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(() => {
            authService.verifyToken(expiredToken);
          }).toThrow();
          resolve();
        }, 10);
      });
    });
  });

  describe('getCurrentUser() - 获取当前用户', () => {
    test('应该通过Token获取用户信息', async () => {
      const registerResult = await authService.register({
        email: 'test@example.com',
        password: 'Pass123!',
        username: 'testuser'
      });

      const user = await authService.getCurrentUser(registerResult.token);

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.password).toBeUndefined(); // 密码不应返回
    });

    test('应该拒绝无效的Token', async () => {
      await expect(
        authService.getCurrentUser('invalid.token')
      ).rejects.toThrow();
    });

    test('应该处理已删除的用户', async () => {
      const registerResult = await authService.register({
        email: 'deleted@example.com',
        password: 'Pass123!'
      });

      // 删除用户
      memoryStore.deleteById('users', registerResult.user.id);

      await expect(
        authService.getCurrentUser(registerResult.token)
      ).rejects.toThrow();
    });
  });

  describe('canLogin() - 登录条件检查', () => {
    test('应该允许验证过邮箱的用户登录', async () => {
      const user = await UserStore.save({
        email: 'verified@example.com',
        password: 'Pass123!',
        emailVerified: true
      });

      const canLogin = authService.canLogin(user);
      expect(canLogin).toBe(true);
    });

    test('开发环境应允许未验证邮箱的用户登录', async () => {
      process.env.NODE_ENV = 'development';

      const user = await UserStore.save({
        email: 'unverified@example.com',
        password: 'Pass123!',
        emailVerified: false
      });

      const canLogin = authService.canLogin(user);
      expect(canLogin).toBe(true);
    });

    test('应该拒绝被禁用的用户', async () => {
      const user = await UserStore.save({
        email: 'banned@example.com',
        password: 'Pass123!',
        emailVerified: true,
        isActive: false
      });

      const canLogin = authService.canLogin(user);
      expect(canLogin).toBe(false);
    });
  });

  describe('边界情况测试', () => {
    test('应该处理并发注册请求', async () => {
      const userData = {
        email: 'concurrent@example.com',
        password: 'Pass123!',
        username: 'concurrent'
      };

      // 同时发起两个注册请求
      const [result1, result2] = await Promise.allSettled([
        authService.register(userData),
        authService.register(userData)
      ]);

      // 应该有一个成功，一个失败（邮箱重复）
      const successCount = [result1, result2].filter(r => r.status === 'fulfilled').length;
      const failureCount = [result1, result2].filter(r => r.status === 'rejected').length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);
    });

    test('应该处理特殊字符的邮箱', async () => {
      const result = await authService.register({
        email: 'test+special@example.com',
        password: 'Pass123!'
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe('test+special@example.com');
    });

    test('应该处理长密码', async () => {
      const longPassword = 'A'.repeat(100) + '1!';
      const result = await authService.register({
        email: 'longpass@example.com',
        password: longPassword
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
        password: 'SecretPass123!'
      });

      expect(result.user.password).toBeUndefined();
    });

    test('Token不应包含敏感信息', () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        password: 'should-not-be-included'
      };

      const token = authService.generateToken(user);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.password).toBeUndefined();
    });
  });
});
