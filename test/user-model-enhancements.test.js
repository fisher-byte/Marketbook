/**
 * MarketBook 用户模型增强功能测试
 * 验证新增的用户统计、社交关系和安全性功能
 */

const User = require('../src/models/User');
const UserProfile = require('../src/models/UserProfile');
const Role = require('../src/models/Role');
const UserAnalyticsService = require('../src/services/UserAnalyticsService');
const UserRelationship = require('../src/models/UserRelationship');

// 测试用户模型增强功能
console.log('=== MarketBook 用户模型增强功能测试 ===\n');

// 1. 测试用户模型新功能
console.log('1. 用户模型测试:');
const user = new User({
    id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    password: 'SecurePass123!',
    createdAt: new Date('2026-01-01'),
    lastLoginAt: new Date('2026-02-06')
});

console.log('用户健康分数:', user.getAccountHealthScore());
console.log('活跃度等级:', user.getActivityLevel());
console.log('统计信息:', user.getStats());

// 测试密码重置功能
const resetToken = user.generatePasswordResetToken();
console.log('密码重置令牌生成成功:', resetToken ? '是' : '否');

// 2. 测试用户资料模型
console.log('\n2. 用户资料模型测试:');
const profile = new UserProfile({
    userId: 'user123',
    displayName: '测试用户',
    bio: '这是一个测试用户的个人简介',
    location: '上海'
});

console.log('资料完整度:', profile.calculateCompleteness() + '%');
console.log('资料统计:', profile.getStats());

// 测试默认头像生成
const defaultAvatar = UserProfile.generateDefaultAvatar('testuser');
console.log('默认头像生成成功:', defaultAvatar ? '是' : '否');

// 3. 测试角色模型
console.log('\n3. 角色模型测试:');
const role = new Role({
    name: 'moderator',
    description: '论坛版主',
    permissions: ['post:read', 'post:write', 'post:moderate', 'user:read']
});

console.log('权限数量:', role.getPermissionCount());
console.log('拥有post:write权限:', role.hasPermission('post:write'));
console.log('角色信息:', role.getInfo());

// 4. 测试用户分析服务
console.log('\n4. 用户分析服务测试:');
const analyticsService = new UserAnalyticsService();

// 模拟一些用户数据
const mockUsers = [
    new User({ id: '1', username: 'user1', createdAt: new Date('2026-01-01'), lastLoginAt: new Date('2026-02-06') }),
    new User({ id: '2', username: 'user2', createdAt: new Date('2026-01-15'), lastLoginAt: new Date('2026-02-05') }),
    new User({ id: '3', username: 'user3', createdAt: new Date('2026-01-20'), lastLoginAt: new Date('2026-02-04') })
];

const stats = analyticsService.calculatePlatformStats(mockUsers);
console.log('平台统计:', stats);

// 5. 测试用户关系模型
console.log('\n5. 用户关系模型测试:');
const relationship = new UserRelationship({
    userId: 'user1',
    targetUserId: 'user2',
    relationshipType: 'follow',
    createdAt: new Date()
});

console.log('关系类型:', relationship.getRelationshipType());
console.log('关系信息:', relationship.getInfo());

console.log('\n=== 测试完成 ===');

// 验证所有新增功能正常工作
const tests = [
    { name: '用户健康分数计算', result: user.getAccountHealthScore() >= 0 },
    { name: '资料完整度计算', result: profile.calculateCompleteness() >= 0 },
    { name: '角色权限验证', result: role.hasPermission('post:write') },
    { name: '平台统计计算', result: stats.totalUsers === 3 },
    { name: '用户关系类型', result: relationship.getRelationshipType() === 'follow' }
];

console.log('\n功能验证结果:');
tests.forEach(test => {
    console.log(`- ${test.name}: ${test.result ? '✅ 通过' : '❌ 失败'}`);
});

console.log('\n所有新增功能测试完成！');