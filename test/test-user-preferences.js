// 用户偏好设置功能测试
const UserPreferences = require('../src/models/UserPreferences');

console.log('=== MarketBook 用户偏好设置功能测试 ===\n');

// 测试1: 创建默认偏好设置
console.log('1. 创建默认偏好设置:');
const defaultPrefs = new UserPreferences();
console.log('默认设置:', defaultPrefs.getPreferences());

// 测试2: 创建自定义偏好设置
console.log('\n2. 创建自定义偏好设置:');
const customPrefs = new UserPreferences({
    userId: 'user123',
    language: 'zh-CN',
    theme: 'dark',
    notifications: {
        email: true,
        push: false,
        sms: false
    },
    tradingPreferences: {
        defaultCurrency: 'CNY',
        riskLevel: 'medium',
        autoSave: true
    }
});
console.log('自定义设置:', customPrefs.getPreferences());

// 测试3: 验证偏好设置
console.log('\n3. 验证偏好设置:');
const validation = customPrefs.validateAll();
console.log('验证结果:', validation);

// 测试4: 更新偏好设置
console.log('\n4. 更新偏好设置:');
customPrefs.update({
    theme: 'light',
    notifications: {
        email: false,
        push: true
    }
});
console.log('更新后设置:', customPrefs.getPreferences());

// 测试5: 获取偏好设置统计
console.log('\n5. 偏好设置统计:');
const stats = customPrefs.getStats();
console.log('统计信息:', stats);

console.log('\n=== 测试完成 ===');