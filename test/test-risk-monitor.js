/**
 * MarketBook 风险监控功能测试
 * 验证新增的智能止损止盈和实时监控功能
 */

const TradingEngine = require('../src/models/TradingEngine');

// 测试智能止损止盈功能
function testSmartStopLossTakeProfit() {
    console.log('=== 测试智能止损止盈功能 ===');
    
    const engine = new TradingEngine('test-user-001', 100000);
    engine.start();
    
    // 模拟市场数据
    engine.marketData.set('AAPL', 150);
    engine.marketData.set('GOOGL', 2800);
    
    // 测试买入订单
    const buyResult = engine.executeBuyOrder('AAPL', 100, 150);
    console.log('买入订单执行结果:', buyResult.success ? '成功' : '失败');
    
    // 设置智能止损止盈
    const stopLossResult = engine.setSmartStopLossTakeProfit('AAPL', {
        stopLossPercent: 0.05,  // 5%止损
        takeProfitPercent: 0.10, // 10%止盈
        trailingStop: true,     // 启用追踪止损
        volatilityFactor: 1.5   // 波动率因子
    });
    console.log('智能止损止盈设置结果:', stopLossResult.success ? '成功' : '失败');
    
    // 模拟价格波动触发止损止盈
    engine.marketData.set('AAPL', 157.5); // 价格涨到157.5 (5%涨幅)
    const riskCheck = engine.performRiskCheck();
    console.log('风险检查结果:', riskCheck);
    
    engine.stop();
}

// 测试实时风险监控面板
function testRealTimeRiskMonitor() {
    console.log('\n=== 测试实时风险监控面板 ===');
    
    const engine = new TradingEngine('test-user-002', 50000);
    engine.start();
    
    // 模拟多个交易
    engine.marketData.set('TSLA', 250);
    engine.marketData.set('MSFT', 350);
    
    engine.executeBuyOrder('TSLA', 50, 250);
    engine.executeBuyOrder('MSFT', 30, 350);
    
    // 获取实时监控数据
    const monitorData = engine.getRealTimeRiskMonitor();
    console.log('实时监控数据:');
    console.log('- 总仓位价值:', monitorData.totalPortfolioValue);
    console.log('- 风险等级:', monitorData.riskLevel);
    console.log('- 预警数量:', monitorData.alerts.length);
    console.log('- 建议操作:', monitorData.suggestedActions);
    
    engine.stop();
}

// 运行测试
console.log('开始 MarketBook 风险监控功能测试...\n');
testSmartStopLossTakeProfit();
testRealTimeRiskMonitor();
console.log('\n测试完成！');