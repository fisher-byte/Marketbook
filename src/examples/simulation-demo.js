/**
 * MarketBook 模拟盘功能演示示例
 * 展示增强版交易引擎的使用方法
 */

const TradingEngineEnhanced = require('../models/TradingEngineEnhanced');

// 创建模拟盘交易引擎实例
const demoEngine = new TradingEngineEnhanced('demo-user-001', 100000);

// 演示智能止损功能
function demonstrateSmartStopLoss() {
    console.log('=== 智能止损功能演示 ===');
    
    // 模拟持仓数据
    demoEngine.positions.set('AAPL', {
        symbol: 'AAPL',
        quantity: 100,
        avgPrice: 150,
        totalCost: 15000,
        unrealizedPL: -300,
        highestPrice: 155
    });
    
    const stopLossCheck = demoEngine.checkSmartStopLoss('AAPL', 147);
    console.log('智能止损检查结果:', stopLossCheck);
    
    // 演示移动止损
    demoEngine.updateHighestPrice('AAPL', 160);
    const trailingStopCheck = demoEngine.checkTrailingStopLoss('AAPL', 154);
    console.log('移动止损检查结果:', trailingStopCheck);
}

// 演示批量操作功能
async function demonstrateBatchOperations() {
    console.log('\n=== 批量操作功能演示 ===');
    
    const batchOrders = [
        {
            id: 'order-001',
            symbol: 'AAPL',
            quantity: 50,
            price: 155,
            type: 'buy',
            orderType: 'market'
        },
        {
            id: 'order-002',
            symbol: 'MSFT',
            quantity: 30,
            price: 320,
            type: 'buy',
            orderType: 'market'
        },
        {
            id: 'order-003',
            symbol: 'GOOGL',
            quantity: 10,
            price: 2800,
            type: 'buy',
            orderType: 'market'
        }
    ];
    
    const batchResult = await demoEngine.addBatchOrders(batchOrders);
    console.log('批量订单添加结果:', batchResult);
    
    const processResult = await demoEngine.processBatchOrders();
    console.log('批量处理结果:', processResult);
}

// 演示策略回测功能
async function demonstrateStrategyBacktest() {
    console.log('\n=== 策略回测功能演示 ===');
    
    const strategy = {
        name: '移动平均策略',
        type: 'trend_following',
        parameters: {
            maPeriod: 20,
            entryThreshold: 0.02,
            exitThreshold: 0.05
        }
    };
    
    const historicalData = [
        { symbol: 'AAPL', date: new Date('2025-01-01'), price: 150, movingAverage: 148 },
        { symbol: 'AAPL', date: new Date('2025-01-02'), price: 152, movingAverage: 149 },
        { symbol: 'AAPL', date: new Date('2025-01-03'), price: 155, movingAverage: 150 },
        { symbol: 'AAPL', date: new Date('2025-01-04'), price: 153, movingAverage: 151 },
        { symbol: 'AAPL', date: new Date('2025-01-05'), price: 158, movingAverage: 153 }
    ];
    
    const backtestResult = await demoEngine.backtestStrategy(strategy, historicalData);
    console.log('策略回测结果:', {
        totalTrades: backtestResult.performance.totalTrades,
        winRate: backtestResult.performance.winRate,
        totalProfit: backtestResult.performance.totalProfit
    });
}

// 演示高级分析功能
function demonstrateAdvancedAnalysis() {
    console.log('\n=== 高级分析功能演示 ===');
    
    const analysis = demoEngine.getAdvancedAnalysis();
    console.log('高级分析报告:', {
        期望值: analysis.advancedMetrics.expectancy,
        盈利因子: analysis.advancedMetrics.profitFactor,
        风险价值: analysis.advancedMetrics.var95
    });
}

// 运行所有演示
async function runAllDemonstrations() {
    try {
        demonstrateSmartStopLoss();
        await demonstrateBatchOperations();
        await demonstrateStrategyBacktest();
        demonstrateAdvancedAnalysis();
        
        console.log('\n✅ 所有模拟盘功能演示完成！');
    } catch (error) {
        console.error('演示过程中出现错误:', error);
    }
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
    runAllDemonstrations();
}

module.exports = {
    demonstrateSmartStopLoss,
    demonstrateBatchOperations,
    demonstrateStrategyBacktest,
    demonstrateAdvancedAnalysis,
    runAllDemonstrations
};