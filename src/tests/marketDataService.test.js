/**
 * marketDataService 单元测试
 * 测试行情数据服务功能（支持异步API）
 * 
 * 注意：阶段8后API变更为异步（支持真实/模拟双模式）
 */

const marketDataService = require('../services/marketDataService');

describe('marketDataService', () => {
    describe('行情数据初始化', () => {
        test('应该包含预设的主流股票', async () => {
            const allSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
            
            for (const symbol of allSymbols) {
                const quote = await marketDataService.getQuote(symbol);
                expect(quote).not.toBeNull();
                expect(quote.symbol).toBe(symbol);
            }
        });

        test('每个股票应包含完整的行情数据', async () => {
            const quote = await marketDataService.getQuote('AAPL');

            expect(quote).toHaveProperty('symbol');
            expect(quote).toHaveProperty('name');
            expect(quote).toHaveProperty('currentPrice');
            expect(quote).toHaveProperty('openPrice');
            expect(quote).toHaveProperty('highPrice');
            expect(quote).toHaveProperty('lowPrice');
            expect(quote).toHaveProperty('changePercent');
            expect(quote).toHaveProperty('volume');
            expect(quote).toHaveProperty('updatedAt');
        });
    });

    describe('单个股票行情查询', () => {
        test('应该返回存在的股票行情', async () => {
            const quote = await marketDataService.getQuote('AAPL');

            expect(quote).not.toBeNull();
            expect(quote.symbol).toBe('AAPL');
            expect(quote.name).toContain('Apple');
        });

        test('查询不存在的股票应返回null', async () => {
            const quote = await marketDataService.getQuote('INVALID');
            expect(quote).toBeNull();
        });

        test('应该自动转换为大写', async () => {
            const quote = await marketDataService.getQuote('aapl'); // 小写
            expect(quote).not.toBeNull(); // 应该自动转换为大写 AAPL
            expect(quote.symbol).toBe('AAPL');
        });
    });

    describe('批量股票行情查询', () => {
        test('应该返回多个股票的行情', async () => {
            const quotes = await marketDataService.getBatchQuotes(['AAPL', 'GOOGL', 'MSFT']);

            expect(quotes).toHaveLength(3);
            expect(quotes.map(q => q.symbol)).toEqual(['AAPL', 'GOOGL', 'MSFT']);
        });

        test('应该过滤不存在的股票', async () => {
            const quotes = await marketDataService.getBatchQuotes(['AAPL', 'INVALID', 'GOOGL']);

            expect(quotes).toHaveLength(2);
            expect(quotes.map(q => q.symbol)).toEqual(['AAPL', 'GOOGL']);
        });

        test('全部无效的股票应返回空数组', async () => {
            const quotes = await marketDataService.getBatchQuotes(['INVALID1', 'INVALID2']);
            expect(quotes).toHaveLength(0);
        });

        test('空数组应返回空数组', async () => {
            const quotes = await marketDataService.getBatchQuotes([]);
            expect(quotes).toHaveLength(0);
        });
    });

    describe('股票搜索', () => {
        test('应该通过股票代码搜索', async () => {
            const results = await marketDataService.searchSymbols('AAPL');

            expect(results).toHaveLength(1);
            expect(results[0].symbol).toBe('AAPL');
        });

        test('应该通过公司名称搜索', async () => {
            const results = await marketDataService.searchSymbols('Apple');

            expect(results.length).toBeGreaterThan(0);
            expect(results[0].name).toContain('Apple');
        });

        test('应该支持模糊搜索（忽略大小写）', async () => {
            const results1 = await marketDataService.searchSymbols('apple');
            const results2 = await marketDataService.searchSymbols('APPLE');

            expect(results1.length).toBeGreaterThan(0);
            expect(results2.length).toBeGreaterThan(0);
        });

        test('应该支持部分匹配', async () => {
            const results = await marketDataService.searchSymbols('Goo'); // 应该匹配 Google

            expect(results.length).toBeGreaterThan(0);
            expect(results.some(r => r.symbol === 'GOOGL')).toBe(true);
        });

        test('无匹配结果应返回空数组', async () => {
            const results = await marketDataService.searchSymbols('NOTEXIST');
            expect(results).toHaveLength(0);
        });

        test('空查询应返回所有股票', async () => {
            const results = await marketDataService.searchSymbols('');
            expect(results.length).toBe(8); // 预设的 8 个股票
        });
    });

    describe('价格波动', () => {
        test('价格应该在合理范围内', async () => {
            const quote = await marketDataService.getQuote('AAPL');

            expect(quote.currentPrice).toBeGreaterThan(0);
            expect(quote.openPrice).toBeGreaterThan(0);
            expect(quote.highPrice).toBeGreaterThanOrEqual(quote.currentPrice);
            expect(quote.lowPrice).toBeLessThanOrEqual(quote.currentPrice);
        });

        test('涨跌幅应该在合理范围内', async () => {
            const quote = await marketDataService.getQuote('AAPL');

            // 涨跌幅应该在 ±20% 之间（根据模拟算法）
            expect(Math.abs(quote.changePercent)).toBeLessThan(20);
        });

        test('更新时间应该是有效的日期', async () => {
            const quote = await marketDataService.getQuote('AAPL');

            expect(quote.updatedAt).toBeInstanceOf(Date);
            expect(quote.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
        });
    });

    describe('数据完整性', () => {
        test('所有预设股票都应有完整数据', async () => {
            const allSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
            
            for (const symbol of allSymbols) {
                const quote = await marketDataService.getQuote(symbol);

                expect(quote.symbol).toBeTruthy();
                expect(quote.name).toBeTruthy();
                expect(typeof quote.currentPrice).toBe('number');
                expect(typeof quote.openPrice).toBe('number');
                expect(typeof quote.highPrice).toBe('number');
                expect(typeof quote.lowPrice).toBe('number');
                expect(typeof quote.changePercent).toBe('number');
                expect(typeof quote.volume).toBe('number');
                expect(quote.updatedAt).toBeInstanceOf(Date);
            }
        });

        test('价格数据应该有两位小数', async () => {
            const quote = await marketDataService.getQuote('AAPL');

            // 检查价格是否保留两位小数
            expect(Number.isFinite(quote.currentPrice)).toBe(true);
            expect(quote.currentPrice.toFixed(2)).toBe(String(quote.currentPrice));
        });
    });

    describe('边界情况', () => {
        test('应该处理 null 参数', async () => {
            const quote = await marketDataService.getQuote(null);
            expect(quote).toBeNull();
        });

        test('应该处理 undefined 参数', async () => {
            const quote = await marketDataService.getQuote(undefined);
            expect(quote).toBeNull();
        });

        test('批量查询应该处理包含 null 的数组', async () => {
            const quotes = await marketDataService.getBatchQuotes(['AAPL', null, 'GOOGL']);
            
            expect(quotes).toHaveLength(2);
            expect(quotes.map(q => q.symbol)).toEqual(['AAPL', 'GOOGL']);
        });

        test('搜索应该处理特殊字符', async () => {
            const results = await marketDataService.searchSymbols('$%^&*');
            expect(results).toHaveLength(0);
        });
    });
});
