/**
 * 用户行为分析模块测试
 * 验证新添加的用户行为追踪和推荐功能
 */

const User = require('../models/User');
const UserBehavior = require('../models/UserBehavior');
const RecommendationEngine = require('../models/RecommendationEngine');

// 测试数据
const testUserData = {
    id: 'user_001',
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123!@#'
};

const testBehaviorData = {
    userId: 'user_001',
    username: 'testuser'
};

// 测试用例
console.log('=== MarketBook 用户行为分析模块测试 ===\n');

// 1. 测试用户行为追踪
console.log('1. 用户行为追踪测试:');
const behaviorTracker = new UserBehavior(testBehaviorData);

// 模拟用户行为
behaviorTracker.trackLogin();
behaviorTracker.trackForumView('forum_tech');
behaviorTracker.trackTrade('buy', 'AAPL', 150.25, 10);
behaviorTracker.trackSearch('科技股投资策略');
behaviorTracker.trackContentInteraction('article_001', 'read', 300);

console.log('行为记录数量:', behaviorTracker.getBehaviorCount());
console.log('最近活跃时间:', behaviorTracker.getLastActivityTime());
console.log('活跃度评分:', behaviorTracker.calculateActivityScore());

// 2. 测试推荐引擎
console.log('\n2. 推荐引擎测试:');
const recommender = new RecommendationEngine();

// 模拟用户偏好数据
const userPreferences = {
    interests: ['科技', '投资', 'AI'],
    tradingStyle: 'growth',
    riskTolerance: 'medium'
};

const recommendations = recommender.generateRecommendations(
    behaviorTracker.getRecentBehavior(),
    userPreferences
);

console.log('个性化推荐:', recommendations.personalized);
console.log('趋势推荐:', recommendations.trending);
console.log('教育内容推荐:', recommendations.educational);

// 3. 测试集成功能
console.log('\n3. 集成功能测试:');
const user = new User(testUserData);

// 模拟用户行为数据
user._analytics.behaviorMetrics = behaviorTracker.getBehaviorMetrics();
user._analytics.loginPatterns = behaviorTracker.getLoginPatterns();

console.log('用户活跃度:', user.getActivityLevel());
console.log('账户健康分数:', user.getAccountHealthScore());
console.log('行为分析统计:', user._analytics.behaviorMetrics);

// 4. 性能测试
console.log('\n4. 性能测试:');
const startTime = Date.now();

// 模拟批量行为记录
for (let i = 0; i < 100; i++) {
    behaviorTracker.trackForumView(`forum_${i % 5}`);
}

const endTime = Date.now();
console.log(`记录100次行为耗时: ${endTime - startTime}ms`);
console.log('内存使用评估:', behaviorTracker.getMemoryUsage());

// 5. 数据验证测试
console.log('\n5. 数据验证测试:');
const validationResult = behaviorTracker.validateBehaviorData();
console.log('数据验证结果:', validationResult.isValid ? '通过' : '失败');
if (!validationResult.isValid) {
    console.log('错误信息:', validationResult.errors);
}

console.log('\n=== 测试完成 ===');

// 导出测试结果
module.exports = {
    behaviorTracker,
    recommender,
    user,
    testResults: {
        behaviorCount: behaviorTracker.getBehaviorCount(),
        activityScore: behaviorTracker.calculateActivityScore(),
        recommendations: recommendations,
        performance: endTime - startTime,
        validation: validationResult
    }
};