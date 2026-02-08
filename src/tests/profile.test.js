/**
 * 用户资料功能测试
 */

const UserProfile = require('../models/UserProfile');

describe('用户资料功能测试', () => {
    
    test('创建用户资料对象', () => {
        const profileData = {
            userId: '12345',
            displayName: '测试用户',
            bio: '这是一个测试用户的简介',
            avatar: 'https://example.com/avatar.jpg',
            location: '上海',
            website: 'https://example.com'
        };
        
        const profile = new UserProfile(profileData);
        
        expect(profile.userId).toBe('12345');
        expect(profile.displayName).toBe('测试用户');
        expect(profile.bio).toBe('这是一个测试用户的简介');
        
        const validation = profile.validateAll();
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);
    });
    
    test('验证必填字段（userId）', () => {
        const profileData = {
            userId: null,  // 缺少userId
            displayName: '测试用户'
        };
        
        const profile = new UserProfile(profileData);
        const validation = profile.validateAll();
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('用户ID不能为空');
    });
    
    test('验证显示名称长度限制', () => {
        const profileData = {
            userId: '12345',
            displayName: 'a'.repeat(31)  // 超过30字符限制
        };
        
        const profile = new UserProfile(profileData);
        const validation = profile.validateAll();
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors.some(err => err.includes('显示名称'))).toBe(true);
    });
    
    test('获取安全资料信息', () => {
        const profileData = {
            userId: '12345',
            displayName: '测试用户',
            bio: '简介',
            avatar: 'https://example.com/avatar.jpg',
            location: '北京',
            website: 'https://example.com',
            socialLinks: { twitter: 'https://twitter.com/test' },
            preferences: { theme: 'dark' }
        };
        
        const profile = new UserProfile(profileData);
        const safeInfo = profile.getSafeInfo();
        
        expect(safeInfo.userId).toBe('12345');
        expect(safeInfo.displayName).toBe('测试用户');
        expect(safeInfo.bio).toBe('简介');
        expect(safeInfo).toHaveProperty('preferences');
        expect(safeInfo).toHaveProperty('socialLinks');
    });

    test('验证头像URL格式', () => {
        const profile1 = new UserProfile({
            userId: '123',
            avatar: 'https://example.com/avatar.jpg'
        });
        expect(profile1.validateAvatar()).toBe(true);

        const profile2 = new UserProfile({
            userId: '123',
            avatar: '/uploads/avatar.png'
        });
        expect(profile2.validateAvatar()).toBe(true);

        const profile3 = new UserProfile({
            userId: '123',
            avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'
        });
        expect(profile3.validateAvatar()).toBe(true);
    });

    test('验证网站URL格式', () => {
        const validProfile = new UserProfile({
            userId: '123',
            website: 'https://example.com'
        });
        expect(validProfile.validateWebsite()).toBe(true);

        const invalidProfile = new UserProfile({
            userId: '123',
            website: 'not-a-url'
        });
        expect(invalidProfile.validateWebsite()).toBe(false);
    });
});
