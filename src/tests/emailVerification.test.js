/**
 * 邮箱验证功能测试
 */

const EmailVerification = require('../models/EmailVerification');

describe('邮箱验证功能测试', () => {
    let verificationToken;

    beforeEach(() => {
        verificationToken = new EmailVerification({
            userId: '1234567890',
            email: 'test@example.com',
            token: 'test-token-123',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
        });
    });

    test('创建验证令牌', () => {
        expect(verificationToken.userId).toBe('1234567890');
        expect(verificationToken.email).toBe('test@example.com');
        expect(verificationToken.token).toBe('test-token-123');
        expect(verificationToken.isVerified).toBe(false);
        expect(verificationToken.expiresAt).toBeInstanceOf(Date);
    });

    test('验证令牌有效性 - 有效令牌', () => {
        expect(verificationToken.isExpired()).toBe(false);
        expect(verificationToken.isVerified).toBe(false);
    });

    test('验证令牌有效性 - 过期令牌', () => {
        verificationToken.expiresAt = new Date(Date.now() - 1000); // 已过期
        expect(verificationToken.isExpired()).toBe(true);
    });

    test('验证令牌成功', () => {
        const result = verificationToken.verify('test-token-123');
        expect(result).toBe(true);
        expect(verificationToken.isVerified).toBe(true);
        expect(verificationToken.verifiedAt).toBeInstanceOf(Date);
    });

    test('验证令牌失败 - 错误令牌', () => {
        const result = verificationToken.verify('wrong-token');
        expect(result).toBe(false);
        expect(verificationToken.isVerified).toBe(false);
    });

    test('验证令牌失败 - 已过期', () => {
        verificationToken.expiresAt = new Date(Date.now() - 1000); // 已过期
        const result = verificationToken.verify('test-token-123');
        expect(result).toBe(false);
    });

    test('重新生成令牌', () => {
        const oldToken = verificationToken.token;
        const oldExpiresAt = verificationToken.expiresAt;
        
        verificationToken.regenerateToken();
        
        expect(verificationToken.token).not.toBe(oldToken);
        expect(verificationToken.token).toHaveLength(64);
        expect(verificationToken.expiresAt.getTime()).toBeGreaterThanOrEqual(oldExpiresAt.getTime());
        expect(verificationToken.isVerified).toBe(false);
        expect(verificationToken.verifiedAt).toBe(null);
    });

    test('数据完整性验证 - 有效数据', () => {
        const validation = verificationToken.validate();
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
    });

    test('数据完整性验证 - 缺少用户ID', () => {
        verificationToken.userId = null;
        const validation = verificationToken.validate();
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('用户ID不能为空');
    });

    test('数据完整性验证 - 缺少邮箱', () => {
        verificationToken.email = '';
        const validation = verificationToken.validate();
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('邮箱不能为空');
    });

    test('生成随机令牌', () => {
        const token1 = new EmailVerification({}).generateToken();
        const token2 = new EmailVerification({}).generateToken();
        
        expect(token1).toHaveLength(64); // 32字节的十六进制字符串
        expect(token2).toHaveLength(64);
        expect(token1).not.toBe(token2); // 每次生成不同的令牌
    });

    test('获取验证信息', () => {
        const info = verificationToken.getInfo();
        
        expect(info.userId).toBe('1234567890');
        expect(info.email).toBe('test@example.com');
        expect(info.isVerified).toBe(false);
        expect(info.isExpired).toBe(false);
        expect(info.createdAt).toBeInstanceOf(Date);
    });
});