/**
 * 测试交易记录和持仓聚合功能
 * 测试场景：注册→登录→创建账户→多次交易→查看持仓→查看历史
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// 存储测试数据
let authToken = '';
let accountId = '';

/**
 * 辅助函数：打印测试结果
 */
function logTest(testName, success, data = null) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 测试: ${testName}`);
    console.log(`${success ? '✅ 成功' : '❌ 失败'}`);
    if (data) {
        console.log('响应数据:');
        console.log(JSON.stringify(data, null, 2));
    }
    console.log('='.repeat(60));
}

/**
 * 1. 注册新用户
 */
async function testRegister() {
    try {
        const timestamp = Date.now();
        const response = await axios.post(`${API_BASE}/auth/register`, {
            username: `testuser_${timestamp}`,
            email: `test_${timestamp}@example.com`,
            password: 'Test123',
        });
        
        authToken = response.data.token;
        logTest('用户注册', true, response.data);
        return true;
    } catch (error) {
        logTest('用户注册', false, error.response?.data);
        return false;
    }
}

/**
 * 2. 创建模拟盘账户
 */
async function testCreateAccount() {
    try {
        const response = await axios.post(
            `${API_BASE}/trading/accounts`,
            { initialBalance: 100000 },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        accountId = response.data.data.accountId;
        logTest('创建模拟盘账户', true, response.data);
        return true;
    } catch (error) {
        logTest('创建模拟盘账户', false, error.response?.data);
        return false;
    }
}

/**
 * 3. 买入股票（多次交易）
 */
async function testMultipleBuyOrders() {
    const orders = [
        { symbol: 'AAPL', quantity: 10, price: 150 },
        { symbol: 'GOOGL', quantity: 5, price: 120 },
        { symbol: 'AAPL', quantity: 5, price: 155 },
        { symbol: 'TSLA', quantity: 8, price: 200 }
    ];
    
    console.log('\n🛒 开始执行多笔买入交易...');
    
    for (const order of orders) {
        try {
            const response = await axios.post(
                `${API_BASE}/trading/orders/buy`,
                { accountId, ...order },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            
            console.log(`✅ 买入 ${order.symbol} x${order.quantity} @ $${order.price}`);
            console.log(`   余额: $${response.data.data.account.availableBalance}`);
        } catch (error) {
            console.log(`❌ 买入失败: ${error.response?.data?.message}`);
        }
    }
    
    return true;
}

/**
 * 4. 卖出部分股票
 */
async function testSellOrder() {
    try {
        const response = await axios.post(
            `${API_BASE}/trading/orders/sell`,
            { 
                accountId, 
                symbol: 'AAPL', 
                quantity: 5, 
                price: 160 
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        logTest('卖出股票 (AAPL x5 @ $160)', true, response.data);
        return true;
    } catch (error) {
        logTest('卖出股票', false, error.response?.data);
        return false;
    }
}

/**
 * 5. 查看持仓信息（重点测试）
 */
async function testGetPositions() {
    try {
        const response = await axios.get(
            `${API_BASE}/trading/accounts/${accountId}/positions`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        console.log('\n📊 持仓明细:');
        console.log('='.repeat(80));
        
        const positions = response.data.data;
        
        if (positions.length === 0) {
            console.log('暂无持仓');
        } else {
            positions.forEach((pos, index) => {
                console.log(`\n持仓 #${index + 1}:`);
                console.log(`  标的: ${pos.symbol}`);
                console.log(`  持有数量: ${pos.quantity}`);
                console.log(`  平均成本: $${pos.avgCost}`);
                console.log(`  当前价格: $${pos.currentPrice}`);
                console.log(`  当前市值: $${pos.currentValue}`);
                console.log(`  盈亏金额: $${pos.profitLoss} (${pos.profitLossPercentage.toFixed(2)}%)`);
                console.log(`  总成本: $${pos.totalCost}`);
                console.log(`  交易次数: ${pos.trades.length}`);
            });
        }
        
        console.log('='.repeat(80));
        
        logTest('查看持仓信息', true, response.data);
        return true;
    } catch (error) {
        logTest('查看持仓信息', false, error.response?.data);
        return false;
    }
}

/**
 * 6. 查看交易历史（重点测试）
 */
async function testGetTradeHistory() {
    try {
        const response = await axios.get(
            `${API_BASE}/trading/accounts/${accountId}/history`,
            { 
                headers: { Authorization: `Bearer ${authToken}` },
                params: { limit: 20 }
            }
        );
        
        console.log('\n📋 交易历史:');
        console.log('='.repeat(80));
        
        const { trades, total } = response.data.data;
        
        console.log(`总交易记录数: ${total}`);
        console.log(`\n最近交易:`);
        
        trades.forEach((trade, index) => {
            console.log(`\n交易 #${index + 1}:`);
            console.log(`  ID: ${trade.id}`);
            console.log(`  标的: ${trade.symbol}`);
            console.log(`  操作: ${trade.action === 'buy' ? '买入' : '卖出'}`);
            console.log(`  数量: ${trade.quantity}`);
            console.log(`  价格: $${trade.price}`);
            console.log(`  总额: $${trade.totalAmount}`);
            console.log(`  状态: ${trade.status}`);
            console.log(`  时间: ${new Date(trade.executedAt).toLocaleString('zh-CN')}`);
        });
        
        console.log('='.repeat(80));
        
        logTest('查看交易历史', true, response.data);
        return true;
    } catch (error) {
        logTest('查看交易历史', false, error.response?.data);
        return false;
    }
}

/**
 * 7. 查看账户信息（验证余额正确性）
 */
async function testGetAccountInfo() {
    try {
        const response = await axios.get(
            `${API_BASE}/trading/accounts/${accountId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        console.log('\n💰 账户信息:');
        console.log('='.repeat(60));
        const account = response.data.data;
        console.log(`  初始资金: $${account.initialBalance}`);
        console.log(`  当前余额: $${account.currentBalance}`);
        console.log(`  可用余额: $${account.availableBalance}`);
        console.log(`  账户状态: ${account.status}`);
        console.log('='.repeat(60));
        
        logTest('查看账户信息', true, response.data);
        return true;
    } catch (error) {
        logTest('查看账户信息', false, error.response?.data);
        return false;
    }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('\n🚀 开始测试交易记录和持仓聚合功能...\n');
    
    const tests = [
        { name: '注册用户', fn: testRegister },
        { name: '创建账户', fn: testCreateAccount },
        { name: '多笔买入交易', fn: testMultipleBuyOrders },
        { name: '卖出交易', fn: testSellOrder },
        { name: '查看持仓', fn: testGetPositions },
        { name: '查看交易历史', fn: testGetTradeHistory },
        { name: '查看账户信息', fn: testGetAccountInfo }
    ];
    
    for (const test of tests) {
        const success = await test.fn();
        if (!success && test.name !== '多笔买入交易') {
            console.log(`\n⚠️  测试中断：${test.name} 失败`);
            break;
        }
        
        // 短暂延迟，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n✨ 测试完成！\n');
}

// 执行测试
runAllTests().catch(error => {
    console.error('测试执行出错:', error);
    process.exit(1);
});
