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
            avatar: 'avatar1.jpg',
            location: '上海',
            website: 'https://example.com',
            socialLinks: {
                twitter: 'testuser',
                github: 'testuser'
            }
        };
        
        const profile = new UserProfile(profileData);
        
        expect(profile.userId).toBe('12345');
        expect(profile.displayName).toBe('测试用户');
        expect(profile.bio).toBe('这是一个测试用户的简介');
        expect(profile.validateProfile()).toBe(true);
    });
    
    test('验证必填字段', () => {
        const profileData = {
            userId: '',
            displayName: ''
        };
        
        const profile = new UserProfile(profileData);
        const validation = profile.validateProfile();
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('用户ID不能为空');
        expect(validation.errors).toContain('显示名称不能为空');
    });
    
    test('验证显示名称长度', () => {
        const profileData = {
            userId: '12345',
            displayName: 'ab'
        };
        
        const profile = new UserProfile(profileData);
        const validation = profile.validateProfile();
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('显示名称长度应在3-50个字符之间');
    });
    
    test('获取安全资料信息', () => {
        const profileData = {
            userId: '12345',
            displayName: '测试用户',
            bio: '简介',
            avatar: 'avatar.jpg',
            location: '北京',
            website: 'https://example.com',
            socialLinks: { twitter: 'test' },
            preferences: { theme: 'dark' },
            privacySettings: { profileVisible: true }
        };
        
        const profile = new UserProfile(profileData);
        const safeInfo = profile.getSafeInfo();
        
        expect(safeInfo.userId).toBe('12345');
        expect(safeInfo.displayName).toBe('测试用户');
        expect(safeInfo.bio).toBe('简介');
        expect(safeInfo.privacySettings).toBeUndefined(); // 隐私设置不应该暴露
    });
});