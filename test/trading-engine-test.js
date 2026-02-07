/**
 * TradingEngine 单元测试
 * 测试交易引擎的核心功能
 */

const TradingEngine = require('../src/models/TradingEngine');
const TradingAccount = require('../src/models/TradingAccount');

// 模拟数据
const mockMarketData = {
    'AAPL': { price: 150.25, volume: 1000000, change: 1.25 },
    'GOOGL': { price: 2850.75, volume: 500000, change: -5.50 },
    'TSLA': { price: 850.60, volume: 750000, change: 12.80 }
};

// 模拟用户账户
const mockAccount = new TradingAccount({
    userId: 'user123',
    accountName: '测试账户',
    initialBalance: 100000,
    currentBalance: 100000,
    availableBalance: 100000
});

// 测试交易引擎初始化
describe('TradingEngine 初始化测试', () => {
    let engine;
    
    beforeEach(() => {
        engine = new TradingEngine({
            marketData: mockMarketData,
            riskLimit: 0.1, // 10%风险限制
            maxLeverage: 5
        });
    });
    
    test('引擎应正确初始化', () => {
        expect(engine.marketData).toEqual(mockMarketData);
        expect(engine.riskLimit).toBe(0.1);
        expect(engine.maxLeverage).toBe(5);
        expect(engine.activeOrders.size).toBe(0);
    });
    
    test('应能获取市场数据', () => {
        const aaplData = engine.getMarketData('AAPL');
        expect(aaplData.price).toBe(150.25);
        expect(aaplData.change).toBe(1.25);
    });
});

// 测试订单执行
describe('订单执行测试', () => {
    let engine;
    
    beforeEach(() => {
        engine = new TradingEngine({
            marketData: mockMarketData,
            riskLimit: 0.1,
            maxLeverage: 5
        });
    });
    
    test('市价单应能成功执行', () => {
        const order = {
            symbol: 'AAPL',
            type: 'buy',
            quantity: 100,
            orderType: 'market',
            account: mockAccount
        };
        
        const result = engine.executeOrder(order);
        expect(result.success).toBe(true);
        expect(result.orderId).toBeDefined();
        expect(result.executedPrice).toBe(150.25);
    });
    
    test('应拒绝资金不足的订单', () => {
        const order = {
            symbol: 'GOOGL',
            type: 'buy',
            quantity: 1000, // 需要285万，但账户只有10万
            orderType: 'market',
            account: mockAccount
        };
        
        const result = engine.executeOrder(order);
        expect(result.success).toBe(false);
        expect(result.error).toContain('资金不足');
    });
    
    test('应拒绝超过风险限制的订单', () => {
        const order = {
            symbol: 'AAPL',
            type: 'buy',
            quantity: 10000, // 金额过大，超过风险限制
            orderType: 'market',
            account: mockAccount
        };
        
        const result = engine.executeOrder(order);
        expect(result.success).toBe(false);
        expect(result.error).toContain('风险限制');
    });
});

// 测试风险管理
describe('风险管理测试', () => {
    let engine;
    
    beforeEach(() => {
        engine = new TradingEngine({
            marketData: mockMarketData,
            riskLimit: 0.05, // 5%风险限制
            maxLeverage: 3
        });
    });
    
    test('应正确计算风险暴露', () => {
        const order = {
            symbol: 'AAPL',
            type: 'buy',
            quantity: 500,
            orderType: 'market',
            account: mockAccount
        };
        
        const risk = engine.calculateRisk(order);
        expect(risk.exposure).toBeCloseTo(75125); // 500 * 150.25
        expect(risk.riskPercentage).toBeCloseTo(0.75125); // 75125 / 100000
    });
    
    test('应正确验证风险限制', () => {
        const highRiskOrder = {
            symbol: 'AAPL',
            type: 'buy',
            quantity: 1000,
            orderType: 'market',
            account: mockAccount
        };
        
        const lowRiskOrder = {
            symbol: 'AAPL',
            type: 'buy',
            quantity: 100,
            orderType: 'market',
            account: mockAccount
        };
        
        expect(engine.validateRisk(highRiskOrder)).toBe(false);
        expect(engine.validateRisk(lowRiskOrder)).toBe(true);
    });
});

// 测试订单管理
describe('订单管理测试', () => {
    let engine;
    
    beforeEach(() => {
        engine = new TradingEngine({
            marketData: mockMarketData,
            riskLimit: 0.1,
            maxLeverage: 5
        });
    });
    
    test('应能添加和获取挂单', () => {
        const order = {
            symbol: 'AAPL',
            type: 'buy',
            quantity: 100,
            price: 149.50,
            orderType: 'limit',
            account: mockAccount
        };
        
        const result = engine.placePendingOrder(order);
        expect(result.success).toBe(true);
        
        const pendingOrders = engine.getPendingOrders('AAPL');
        expect(pendingOrders.length).toBe(1);
        expect(pendingOrders[0].symbol).toBe('AAPL');
    });
    
    test('应能取消挂单', () => {
        const order = {
            symbol: 'AAPL',
            type: 'buy',
            quantity: 100,
            price: 149.50,
            orderType: 'limit',
            account: mockAccount
        };
        
        const placeResult = engine.placePendingOrder(order);
        const cancelResult = engine.cancelOrder(placeResult.orderId);
        
        expect(cancelResult.success).toBe(true);
        expect(engine.getPendingOrders('AAPL').length).toBe(0);
    });
});

console.log('✅ TradingEngine 单元测试完成');