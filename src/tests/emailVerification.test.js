/**
 * 邮箱验证功能测试
 */

const EmailVerification = require('../models/EmailVerification');
const emailService = require('../utils/emailService');

// 模拟邮件服务
jest.mock('../utils/emailService', () => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

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
        expect(verificationToken.isValid()).toBe(true);
    });

    test('验证令牌有效性 - 过期令牌', () => {
        verificationToken.expiresAt = new Date(Date.now() - 1000); // 已过期
        expect(verificationToken.isValid()).toBe(false);
    });

    test('验证令牌有效性 - 已验证令牌', () => {
        verificationToken.isVerified = true;
        expect(verificationToken.isValid()).toBe(false);
    });

    test('验证令牌有效性 - 无效令牌', () => {
        verificationToken.token = '';
        expect(verificationToken.isValid()).toBe(false);
    });

    test('生成验证链接', () => {
        const verificationUrl = verificationToken.generateVerificationUrl('http://localhost:3000');
        expect(verificationUrl).toContain('http://localhost:3000/auth/verify-email');
        expect(verificationUrl).toContain('token=test-token-123');
        expect(verificationUrl).toContain('userId=1234567890');
    });

    test('发送验证邮件', async () => {
        const result = await verificationToken.sendVerificationEmail('http://localhost:3000');
        expect(result).toBe(true);
        expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
            'test@example.com',
            expect.stringContaining('http://localhost:3000/auth/verify-email')
        );
    });

    test('生成随机令牌', () => {
        const token1 = EmailVerification.generateToken();
        const token2 = EmailVerification.generateToken();
        
        expect(token1).toHaveLength(64); // 32字节的十六进制字符串
        expect(token2).toHaveLength(64);
        expect(token1).not.toBe(token2); // 每次生成不同的令牌
    });

    test('创建验证令牌实例', () => {
        const newToken = EmailVerification.createVerification('user123', 'user@example.com');
        
        expect(newToken.userId).toBe('user123');
        expect(newToken.email).toBe('user@example.com');
        expect(newToken.token).toHaveLength(64);
        expect(newToken.isVerified).toBe(false);
        expect(newToken.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
});

describe('邮件服务测试', () => {
    test('发送验证邮件被调用', async () => {
        await emailService.sendVerificationEmail('test@example.com', 'http://localhost:3000/verify?token=abc123');
        expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
            'test@example.com',
            'http://localhost:3000/verify?token=abc123'
        );
    });
});