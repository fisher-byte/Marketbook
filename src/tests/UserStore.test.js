/**
 * UserStore 单元测试
 * 测试用户存储适配层的功能
 */

const { UserStore, UserProfileStore } = require('../models/UserStore');
const memoryStore = require('../db/memoryStore');

describe('UserStore', () => {
    beforeEach(() => {
        // 每次测试前清空所有数据
        memoryStore.clearAll();
    });

    describe('用户注册', () => {
        test('应该成功创建新用户', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123'
            };

            const user = await UserStore.save(userData);

            expect(user).toHaveProperty('id');
            expect(user.username).toBe('testuser');
            expect(user.email).toBe('test@example.com');
            expect(user.password).not.toBe('Password123'); // 密码应被加密
            expect(user.createdAt).toBeInstanceOf(Date);
        });

        test('密码应该被自动加密', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'PlainPassword'
            };

            const user = await UserStore.save(userData);

            expect(user.password).not.toBe('PlainPassword');
            expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt 格式
        });

        test('可以手动创建用户资料', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123'
            };

            const user = await UserStore.save(userData);
            
            // 手动创建用户资料
            const profileData = {
                userId: user.id,
                displayName: user.username
            };
            const profile = await UserProfileStore.save(profileData);

            expect(profile).not.toBeNull();
            expect(profile.userId).toBe(user.id);
            expect(profile.displayName).toBe('testuser');
        });
    });

    describe('用户查询', () => {
        beforeEach(async () => {
            // 插入测试用户
            await UserStore.save({
                username: 'alice',
                email: 'alice@example.com',
                password: 'Password123'
            });
            await UserStore.save({
                username: 'bob',
                email: 'bob@example.com',
                password: 'Password456'
            });
        });

        test('应该通过邮箱查找用户', async () => {
            const user = await UserStore.findOne({ email: 'alice@example.com' });

            expect(user).not.toBeNull();
            expect(user.username).toBe('alice');
            expect(user.email).toBe('alice@example.com');
        });

        test('应该通过用户名查找用户', async () => {
            const user = await UserStore.findOne({ username: 'bob' });

            expect(user).not.toBeNull();
            expect(user.email).toBe('bob@example.com');
        });

        test('应该通过ID查找用户', async () => {
            const alice = await UserStore.findOne({ username: 'alice' });
            const found = await UserStore.findById(alice.id);

            expect(found).not.toBeNull();
            expect(found.id).toBe(alice.id);
            expect(found.username).toBe('alice');
        });

        test('查找不存在的用户应返回null', async () => {
            const user = await UserStore.findOne({ email: 'notexist@example.com' });
            expect(user).toBeNull();
        });

        test('查找不存在的ID应返回null', async () => {
            const user = await UserStore.findById(9999);
            expect(user).toBeNull();
        });
    });

    describe('密码验证', () => {
        let testUser;

        beforeEach(async () => {
            testUser = await UserStore.save({
                username: 'testuser',
                email: 'test@example.com',
                password: 'CorrectPassword123'
            });
        });

        test('正确的密码应该验证通过', async () => {
            const user = await UserStore.findById(testUser.id);
            const isValid = await UserStore.comparePassword('CorrectPassword123', user.password);

            expect(isValid).toBe(true);
        });

        test('错误的密码应该验证失败', async () => {
            const user = await UserStore.findById(testUser.id);
            const isValid = await UserStore.comparePassword('WrongPassword', user.password);

            expect(isValid).toBe(false);
        });
    });

    describe('用户资料管理', () => {
        let testUserId;

        beforeEach(async () => {
            const user = await UserStore.save({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123'
            });
            testUserId = user.id;
            
            // 创建用户资料
            await UserProfileStore.save({
                userId: testUserId,
                displayName: 'testuser',
                bio: ''
            });
        });

        test('应该获取用户资料', async () => {
            const profile = await UserProfileStore.findByUserId(testUserId);

            expect(profile).not.toBeNull();
            expect(profile.userId).toBe(testUserId);
            expect(profile.displayName).toBe('testuser');
        });

        test('应该更新用户资料', async () => {
            await UserProfileStore.updateByUserId(testUserId, {
                displayName: 'New Display Name',
                bio: 'This is my bio'
            });

            const profile = await UserProfileStore.findByUserId(testUserId);

            expect(profile.displayName).toBe('New Display Name');
            expect(profile.bio).toBe('This is my bio');
        });

        test('应该保留未更新的字段', async () => {
            const originalProfile = await UserProfileStore.findByUserId(testUserId);
            
            await UserProfileStore.updateByUserId(testUserId, {
                bio: 'New bio only'
            });

            const updatedProfile = await UserProfileStore.findByUserId(testUserId);

            expect(updatedProfile.displayName).toBe(originalProfile.displayName);
            expect(updatedProfile.bio).toBe('New bio only');
        });
    });

    describe('用户更新', () => {
        let testUser;

        beforeEach(async () => {
            testUser = await UserStore.save({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123'
            });
        });

        test('应该更新用户信息', async () => {
            const updated = await UserStore.updateOne(
                { id: testUser.id },
                { username: 'newusername' }
            );

            expect(updated.username).toBe('newusername');
            expect(updated.email).toBe('test@example.com'); // 未更新的字段保持不变
        });

        test('更新密码应该重新加密', async () => {
            const oldPasswordHash = testUser.password;

            // 先更新明文密码
            await memoryStore.updateOne('users', { id: testUser.id }, { password: 'NewPassword456' });
            
            // 再次保存以触发加密
            const user = await UserStore.findById(testUser.id);
            const updated = await UserStore.save({
                ...user.getFullInfo(),
                password: 'NewPassword456'
            });

            expect(updated.password).not.toBe('NewPassword456'); // 应该加密
            expect(updated.password).not.toBe(oldPasswordHash); // 应该重新加密
        });
    });

    describe('边界情况', () => {
        test('应该正确处理空用户名', async () => {
            const user = await UserStore.save({
                username: '',
                email: 'test@example.com',
                password: 'Password123'
            });

            expect(user.username).toBe('');
        });

        test('应该正确处理特殊字符', async () => {
            const user = await UserStore.save({
                username: 'user@#$%',
                email: 'special@example.com',
                password: 'Password123!@#'
            });

            expect(user.username).toBe('user@#$%');
        });

        test('更新不存在的用户应返回null', async () => {
            const result = await UserStore.updateOne({ id: 9999 }, { username: 'test' });
            expect(result).toBeNull();
        });

        test('获取不存在用户的资料应返回null', async () => {
            const profile = await UserProfileStore.findByUserId(9999);
            expect(profile).toBeNull();
        });
    });
});
