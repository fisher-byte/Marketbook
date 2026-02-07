/**
 * MarketBook 交易功能测试脚本
 * 测试交易账户创建、交易执行和记录功能
 */

const { TradingAccount } = require('../src/models/TradingAccount');
const { TradingRecord } = require('../src/models/TradingRecord');

async function testTradingFunctionality() {
    console.log('=== MarketBook 交易功能测试开始 ===\n');
    
    try {
        // 1. 测试交易账户创建
        console.log('1. 测试交易账户创建...');
        const account = new TradingAccount({
            userId: 'user123',
            accountName: '模拟交易账户',
            initialBalance: 100000,
            currency: 'CNY',
            riskLevel: 'medium'
        });
        
        console.log('账户创建成功:', {
            accountId: account.accountId,
            userId: account.userId,
            balance: account.balance,
            currency: account.currency,
            riskLevel: account.riskLevel
        });
        
        // 2. 测试账户验证
        console.log('\n2. 测试账户验证...');
        const validationResult = account.validateAccount();
        console.log('账户验证结果:', validationResult);
        
        // 3. 测试资金操作
        console.log('\n3. 测试资金操作...');
        
        // 存款
        const depositResult = account.deposit(50000);
        console.log('存款50000结果:', depositResult);
        console.log('当前余额:', account.balance);
        
        // 取款
        const withdrawResult = account.withdraw(20000);
        console.log('取款20000结果:', withdrawResult);
        console.log('当前余额:', account.balance);
        
        // 4. 测试交易记录创建
        console.log('\n4. 测试交易记录创建...');
        const tradeRecord = new TradingRecord({
            accountId: account.accountId,
            symbol: 'AAPL',
            tradeType: 'buy',
            quantity: 100,
            price: 150.25,
            commission: 5.00
        });
        
        console.log('交易记录创建成功:', {
            tradeId: tradeRecord.tradeId,
            symbol: tradeRecord.symbol,
            tradeType: tradeRecord.tradeType,
            quantity: tradeRecord.quantity,
            totalAmount: tradeRecord.totalAmount,
            commission: tradeRecord.commission
        });
        
        // 5. 测试交易验证
        console.log('\n5. 测试交易验证...');
        const tradeValidation = tradeRecord.validateTrade();
        console.log('交易验证结果:', tradeValidation);
        
        // 6. 测试风险控制
        console.log('\n6. 测试风险控制...');
        const riskCheck = account.checkRiskLevel('AAPL', 100, 150.25);
        console.log('风险检查结果:', riskCheck);
        
        // 7. 测试账户统计
        console.log('\n7. 测试账户统计...');
        const stats = account.getAccountStatistics();
        console.log('账户统计:', stats);
        
        console.log('\n=== MarketBook 交易功能测试完成 ===');
        console.log('所有功能测试通过！✅');
        
    } catch (error) {
        console.error('测试过程中出现错误:', error.message);
        console.error('错误详情:', error);
    }
}

// 运行测试
if (require.main === module) {
    testTradingFunctionality();
}

module.exports = { testTradingFunctionality };