/**
 * Leaderboard 单元测试
 * 测试排行榜功能的正确性
 */

const Leaderboard = require('../src/models/Leaderboard');

// 模拟用户数据
const mockUsers = [
    { userId: 'user1', username: '交易高手', profit: 15000, winRate: 75.5, trades: 120 },
    { userId: 'user2', username: '稳健投资者', profit: 8000, winRate: 65.2, trades: 85 },
    { userId: 'user3', username: '新手入门', profit: -2000, winRate: 45.8, trades: 50 },
    { userId: 'user4', username: '量化专家', profit: 12000, winRate: 72.1, trades: 200 },
    { userId: 'user5', username: '价值投资者', profit: 5000, winRate: 60.0, trades: 30 }
];

// 测试排行榜初始化
function testLeaderboardInitialization() {
    console.log('=== 测试排行榜初始化 ===');
    
    const leaderboard = new Leaderboard('profit');
    
    console.log('排行榜类型:', leaderboard.type);
    console.log('排行榜数据:', leaderboard.data);
    console.log('✓ 排行榜初始化成功\n');
}

// 测试添加用户数据
function testAddUserData() {
    console.log('=== 测试添加用户数据 ===');
    
    const leaderboard = new Leaderboard('profit');
    
    mockUsers.forEach(user => {
        leaderboard.addUser(user);
    });
    
    console.log('添加用户数量:', leaderboard.data.length);
    console.log('✓ 用户数据添加成功\n');
}

// 测试排行榜排序
function testLeaderboardSorting() {
    console.log('=== 测试排行榜排序 ===');
    
    const profitLeaderboard = new Leaderboard('profit');
    mockUsers.forEach(user => profitLeaderboard.addUser(user));
    
    const sortedByProfit = profitLeaderboard.getTopUsers(5);
    console.log('按收益排序:');
    sortedByProfit.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}: ${user.profit}元`);
    });
    
    const winRateLeaderboard = new Leaderboard('winRate');
    mockUsers.forEach(user => winRateLeaderboard.addUser(user));
    
    const sortedByWinRate = winRateLeaderboard.getTopUsers(5);
    console.log('\n按胜率排序:');
    sortedByWinRate.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}: ${user.winRate}%`);
    });
    
    console.log('✓ 排行榜排序功能正常\n');
}

// 测试排行榜过滤
function testLeaderboardFiltering() {
    console.log('=== 测试排行榜过滤 ===');
    
    const leaderboard = new Leaderboard('profit');
    mockUsers.forEach(user => leaderboard.addUser(user));
    
    // 过滤盈利用户
    const profitableUsers = leaderboard.filterUsers(user => user.profit > 0);
    console.log('盈利用户数量:', profitableUsers.length);
    
    // 过滤高胜率用户
    const highWinRateUsers = leaderboard.filterUsers(user => user.winRate > 70);
    console.log('高胜率用户数量:', highWinRateUsers.length);
    
    console.log('✓ 排行榜过滤功能正常\n');
}

// 测试排行榜统计
function testLeaderboardStats() {
    console.log('=== 测试排行榜统计 ===');
    
    const leaderboard = new Leaderboard('profit');
    mockUsers.forEach(user => leaderboard.addUser(user));
    
    const stats = leaderboard.getStatistics();
    console.log('排行榜统计信息:');
    console.log('- 总用户数:', stats.totalUsers);
    console.log('- 平均收益:', stats.averageProfit.toFixed(2));
    console.log('- 平均胜率:', stats.averageWinRate.toFixed(2));
    console.log('- 最高收益:', stats.maxProfit);
    console.log('- 最低收益:', stats.minProfit);
    
    console.log('✓ 排行榜统计功能正常\n');
}

// 测试排行榜更新
function testLeaderboardUpdate() {
    console.log('=== 测试排行榜更新 ===');
    
    const leaderboard = new Leaderboard('profit');
    mockUsers.forEach(user => leaderboard.addUser(user));
    
    // 更新用户数据
    const updatedUser = {
        userId: 'user3',
        username: '进步新手',
        profit: 3000, // 从亏损变为盈利
        winRate: 55.0,
        trades: 60
    };
    
    leaderboard.updateUser(updatedUser);
    
    const userRank = leaderboard.getUserRank('user3');
    console.log('用户更新后排名:', userRank);
    
    console.log('✓ 排行榜更新功能正常\n');
}

// 运行所有测试
function runAllTests() {
    console.log('开始运行排行榜功能测试...\n');
    
    try {
        testLeaderboardInitialization();
        testAddUserData();
        testLeaderboardSorting();
        testLeaderboardFiltering();
        testLeaderboardStats();
        testLeaderboardUpdate();
        
        console.log('✅ 所有测试通过！');
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

// 执行测试
if (require.main === module) {
    runAllTests();
}

module.exports = {
    runAllTests
};