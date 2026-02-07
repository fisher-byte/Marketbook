/**
 * 用户认证服务单元测试
 */

const AuthService = require('../services/authService');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');

// Mock依赖
jest.mock('../models/User');
jest.mock('../models/UserProfile');

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('registerUser', () => {
        it('应该成功注册新用户', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123'
            };

            User.findOne.mockResolvedValue(null);
            User.prototype.save.mockResolvedValue({
                _id: '123',
                ...userData,
                createdAt: new Date()
            });

            const result = await AuthService.registerUser(userData);

            expect(result.success).toBe(true);
            expect(result.user.username).toBe(userData.username);
            expect(result.token).toBeDefined();
        });

        it('应该拒绝已存在的用户名', async () => {
            const userData = {
                username: 'existinguser',
                email: 'test@example.com',
                password: 'Password123'
            };

            User.findOne.mockResolvedValue({ username: 'existinguser' });

            const result = await AuthService.registerUser(userData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('已存在');
        });
    });

    describe('loginUser', () => {
        it('应该成功登录用户', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'Password123'
            };

            const mockUser = {
                _id: '123',
                email: 'test@example.com',
                password: '$2b$10$hashedpassword',
                username: 'testuser',
                save: jest.fn().mockResolvedValue(true)
            };

            User.findOne.mockResolvedValue(mockUser);
            require('bcryptjs').compare.mockResolvedValue(true);

            const result = await AuthService.loginUser(loginData);

            expect(result.success).toBe(true);
            expect(result.user.email).toBe(loginData.email);
            expect(result.token).toBeDefined();
        });

        it('应该拒绝错误的密码', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'WrongPassword'
            };

            const mockUser = {
                _id: '123',
                email: 'test@example.com',
                password: '$2b$10$hashedpassword'
            };

            User.findOne.mockResolvedValue(mockUser);
            require('bcryptjs').compare.mockResolvedValue(false);

            const result = await AuthService.loginUser(loginData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('错误');
        });
    });

    describe('refreshToken', () => {
        it('应该成功刷新令牌', async () => {
            const userId = '123';
            const mockUser = {
                _id: userId,
                username: 'testuser'
            };

            User.findById.mockResolvedValue(mockUser);

            const result = await AuthService.refreshToken(userId);

            expect(result.success).toBe(true);
            expect(result.token).toBeDefined();
        });

        it('应该拒绝无效的用户ID', async () => {
            User.findById.mockResolvedValue(null);

            const result = await AuthService.refreshToken('invalid-id');

            expect(result.success).toBe(false);
            expect(result.message).toContain('用户不存在');
        });
    });

    describe('updateUserProfile', () => {
        it('应该成功更新用户资料', async () => {
            const userId = '123';
            const profileData = {
                displayName: '新昵称',
                bio: '新的个人简介'
            };

            UserProfile.findOne.mockResolvedValue({
                userId,
                ...profileData,
                save: jest.fn().mockResolvedValue(true)
            });

            const result = await AuthService.updateUserProfile(userId, profileData);

            expect(result.success).toBe(true);
            expect(result.profile.displayName).toBe(profileData.displayName);
        });
    });

    describe('changePassword', () => {
        it('应该成功修改密码', async () => {
            const userId = '123';
            const passwordData = {
                currentPassword: 'OldPassword123',
                newPassword: 'NewPassword123'
            };

            const mockUser = {
                _id: userId,
                password: '$2b$10$hashedpassword',
                save: jest.fn().mockResolvedValue(true)
            };

            User.findById.mockResolvedValue(mockUser);
            require('bcryptjs').compare.mockResolvedValue(true);

            const result = await AuthService.changePassword(userId, passwordData);

            expect(result.success).toBe(true);
            expect(result.message).toContain('成功');
        });
    });
});