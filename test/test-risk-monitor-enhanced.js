/**
 * RiskMonitorEnhanced 组件测试文件
 * 测试增强版风险监控界面的功能和交互
 */

const RiskMonitorEnhanced = require('../src/frontend/components/RiskMonitorEnhanced');

// 模拟数据
const mockRiskData = {
    positions: [
        { symbol: 'AAPL', quantity: 100, currentPrice: 150.25, costBasis: 145.50, unrealizedPL: 475, plPercent: 3.26 },
        { symbol: 'TSLA', quantity: 50, currentPrice: 180.75, costBasis: 195.20, unrealizedPL: -722.5, plPercent: -7.4 },
        { symbol: 'GOOGL', quantity: 25, currentPrice: 2850.00, costBasis: 2800.00, unrealizedPL: 1250, plPercent: 1.79 }
    ],
    riskMetrics: {
        portfolioValue: 125000,
        totalRisk: 0.08,
        var95: -2500,
        maxDrawdown: -0.12,
        volatility: 0.15,
        beta: 1.05
    },
    alerts: [
        { type: 'warning', message: 'TSLA持仓亏损超过止损线', symbol: 'TSLA', severity: 'medium' },
        { type: 'info', message: 'AAPL接近止盈目标', symbol: 'AAPL', severity: 'low' }
    ]
};

// 测试组件初始化
function testInitialization() {
    console.log('=== 测试 RiskMonitorEnhanced 组件初始化 ===');
    
    try {
        const monitor = new RiskMonitorEnhanced('user123', mockRiskData);
        console.log('✅ 组件初始化成功');
        console.log('用户ID:', monitor.userId);
        console.log('风险数据加载:', monitor.riskData ? '成功' : '失败');
        
        return monitor;
    } catch (error) {
        console.error('❌ 组件初始化失败:', error.message);
        return null;
    }
}

// 测试风险指标计算
function testRiskCalculations(monitor) {
    console.log('\n=== 测试风险指标计算 ===');
    
    if (!monitor) {
        console.log('❌ 无法测试 - 组件未初始化');
        return;
    }
    
    try {
        const metrics = monitor.calculateRiskMetrics();
        console.log('✅ 风险指标计算成功');
        console.log('投资组合价值:', metrics.portfolioValue);
        console.log('总风险:', metrics.totalRisk);
        console.log('VaR(95%):', metrics.var95);
        console.log('最大回撤:', metrics.maxDrawdown);
        
        return metrics;
    } catch (error) {
        console.error('❌ 风险指标计算失败:', error.message);
        return null;
    }
}

// 测试预警系统
function testAlertSystem(monitor) {
    console.log('\n=== 测试预警系统 ===');
    
    if (!monitor) {
        console.log('❌ 无法测试 - 组件未初始化');
        return;
    }
    
    try {
        const alerts = monitor.generateRiskAlerts();
        console.log('✅ 预警生成成功');
        console.log('预警数量:', alerts.length);
        alerts.forEach((alert, index) => {
            console.log(`预警 ${index + 1}: ${alert.type} - ${alert.message}`);
        });
        
        return alerts;
    } catch (error) {
        console.error('❌ 预警系统测试失败:', error.message);
        return null;
    }
}

// 测试可视化数据生成
function testVisualizationData(monitor) {
    console.log('\n=== 测试可视化数据生成 ===');
    
    if (!monitor) {
        console.log('❌ 无法测试 - 组件未初始化');
        return;
    }
    
    try {
        const chartData = monitor.generateChartData();
        console.log('✅ 可视化数据生成成功');
        console.log('图表数据类型:', Object.keys(chartData));
        
        return chartData;
    } catch (error) {
        console.error('❌ 可视化数据生成失败:', error.message);
        return null;
    }
}

// 测试交互功能
function testInteractiveFeatures(monitor) {
    console.log('\n=== 测试交互功能 ===');
    
    if (!monitor) {
        console.log('❌ 无法测试 - 组件未初始化');
        return;
    }
    
    try {
        // 测试设置更新
        const newSettings = {
            riskTolerance: 'moderate',
            alertThresholds: {
                stopLoss: 0.05,
                takeProfit: 0.1,
                volatility: 0.2
            }
        };
        
        monitor.updateSettings(newSettings);
        console.log('✅ 设置更新成功');
        
        // 测试数据刷新
        monitor.refreshData();
        console.log('✅ 数据刷新成功');
        
        return true;
    } catch (error) {
        console.error('❌ 交互功能测试失败:', error.message);
        return false;
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始 RiskMonitorEnhanced 组件测试\n');
    
    const monitor = testInitialization();
    const metrics = testRiskCalculations(monitor);
    const alerts = testAlertSystem(monitor);
    const chartData = testVisualizationData(monitor);
    const interactiveResult = testInteractiveFeatures(monitor);
    
    console.log('\n=== 测试总结 ===');
    console.log('组件初始化:', monitor ? '✅ 通过' : '❌ 失败');
    console.log('风险计算:', metrics ? '✅ 通过' : '❌ 失败');
    console.log('预警系统:', alerts ? '✅ 通过' : '❌ 失败');
    console.log('可视化数据:', chartData ? '✅ 通过' : '❌ 失败');
    console.log('交互功能:', interactiveResult ? '✅ 通过' : '❌ 失败');
    
    const totalTests = 5;
    const passedTests = [monitor, metrics, alerts, chartData, interactiveResult].filter(Boolean).length;
    
    console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！RiskMonitorEnhanced 组件功能正常');
    } else {
        console.log('⚠️ 部分测试失败，需要进一步调试');
    }
}

// 执行测试
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testInitialization,
    testRiskCalculations,
    testAlertSystem,
    testVisualizationData,
    testInteractiveFeatures,
    runAllTests
};