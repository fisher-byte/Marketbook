/**
 * marketDataService 单元测试
 * 测试实时行情数据服务（异步API版本）
 * 
 * 注意：阶段8后API变更为异步（支持真实/模拟双模式）
 */

const marketDataService = require('../../src/services/marketDataService');

describe('marketDataService', () => {
  describe('Quote Retrieval', () => {
    test('应能获取单个股票行情', async () => {
      const quote = await marketDataService.getQuote('AAPL');
      
      expect(quote).not.toBeNull();
      expect(quote).toHaveProperty('symbol', 'AAPL');
      expect(quote).toHaveProperty('name');
      expect(quote.name).toContain('Apple');
      expect(quote).toHaveProperty('currentPrice');
      expect(quote).toHaveProperty('openPrice');
      expect(quote).toHaveProperty('highPrice');
      expect(quote).toHaveProperty('lowPrice');
      expect(quote).toHaveProperty('changePercent');
      expect(quote).toHaveProperty('volume');
      expect(quote).toHaveProperty('updatedAt');
    });

    test('不存在的股票代码应返回null', async () => {
      const quote = await marketDataService.getQuote('INVALID');
      expect(quote).toBeNull();
    });

    test('股票代码应自动转换为大写', async () => {
      const quote1 = await marketDataService.getQuote('AAPL');
      const quote2 = await marketDataService.getQuote('aapl');
      
      expect(quote1).not.toBeNull();
      expect(quote2).not.toBeNull();
      expect(quote1.symbol).toBe('AAPL');
      expect(quote2.symbol).toBe('AAPL');
    });

    test('价格应为正数', async () => {
      const quote = await marketDataService.getQuote('AAPL');
      
      expect(quote.currentPrice).toBeGreaterThan(0);
      expect(quote.openPrice).toBeGreaterThan(0);
      expect(quote.highPrice).toBeGreaterThan(0);
      expect(quote.lowPrice).toBeGreaterThan(0);
    });

    test('高价应大于等于低价', async () => {
      const quote = await marketDataService.getQuote('AAPL');
      expect(quote.highPrice).toBeGreaterThanOrEqual(quote.lowPrice);
    });

    test('当前价应在高低价之间（或相等）', async () => {
      const quote = await marketDataService.getQuote('AAPL');
      expect(quote.currentPrice).toBeGreaterThanOrEqual(quote.lowPrice);
      expect(quote.currentPrice).toBeLessThanOrEqual(quote.highPrice);
    });
  });

  describe('Batch Quote Retrieval', () => {
    test('应能批量获取多个股票行情', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];
      const quotes = await marketDataService.getBatchQuotes(symbols);
      
      expect(quotes).toHaveLength(3);
      expect(quotes[0].symbol).toBe('AAPL');
      expect(quotes[1].symbol).toBe('GOOGL');
      expect(quotes[2].symbol).toBe('MSFT');
    });

    test('应过滤不存在的股票代码', async () => {
      const symbols = ['AAPL', 'INVALID', 'GOOGL'];
      const quotes = await marketDataService.getBatchQuotes(symbols);
      
      // 现在会过滤掉不存在的股票
      expect(quotes).toHaveLength(2);
      expect(quotes.map(q => q.symbol)).toEqual(['AAPL', 'GOOGL']);
    });

    test('空数组应返回空结果', async () => {
      const quotes = await marketDataService.getBatchQuotes([]);
      expect(quotes).toEqual([]);
    });

    test('应处理重复的股票代码', async () => {
      const symbols = ['AAPL', 'AAPL', 'GOOGL'];
      const quotes = await marketDataService.getBatchQuotes(symbols);
      
      expect(quotes.length).toBeGreaterThan(0);
      // 可能包含重复，也可能去重，取决于实现
    });
  });

  describe('Symbol Search', () => {
    test('应能通过关键词搜索股票', async () => {
      const results = await marketDataService.searchSymbols('Apple');
      
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol).toBe('AAPL');
      expect(results[0].name).toContain('Apple');
    });

    test('搜索应不区分大小写', async () => {
      const results1 = await marketDataService.searchSymbols('apple');
      const results2 = await marketDataService.searchSymbols('APPLE');
      
      expect(results1.length).toBe(results2.length);
      expect(results1[0].symbol).toBe(results2[0].symbol);
    });

    test('应能通过股票代码搜索', async () => {
      const results = await marketDataService.searchSymbols('AAPL');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol).toBe('AAPL');
    });

    test('应能部分匹配公司名称', async () => {
      const results = await marketDataService.searchSymbols('Micro');
      
      const hasMicrosoft = results.some(r => r.symbol === 'MSFT');
      expect(hasMicrosoft).toBe(true);
    });

    test('空关键词应返回所有股票', async () => {
      const results = await marketDataService.searchSymbols('');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBe(8); // 8个预设股票
    });

    test('不存在的关键词应返回空数组', async () => {
      const results = await marketDataService.searchSymbols('NONEXISTENT-COMPANY-XYZ');
      expect(results).toEqual([]);
    });

    test('搜索结果应包含必要字段', async () => {
      const results = await marketDataService.searchSymbols('Tesla');
      
      expect(results.length).toBeGreaterThan(0);
      const first = results[0];
      expect(first).toHaveProperty('symbol');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('currentPrice');
    });
  });

  describe('Price Updates', () => {
    test('价格应在合理范围内波动', async () => {
      const initialQuote = await marketDataService.getQuote('AAPL');
      const initialPrice = initialQuote.currentPrice;
      
      expect(initialPrice).toBeGreaterThan(50); // Apple股价应大于50
      expect(initialPrice).toBeLessThan(500); // Apple股价应小于500（合理假设）
    });

    test('涨跌幅应正确计算', async () => {
      const quote = await marketDataService.getQuote('AAPL');
      
      const expectedChangePercent = ((quote.currentPrice - quote.openPrice) / quote.openPrice) * 100;
      
      // 允许0.1的误差
      expect(Math.abs(quote.changePercent - expectedChangePercent)).toBeLessThan(0.1);
    });
  });

  describe('Available Symbols', () => {
    test('应返回所有可用股票列表', async () => {
      const symbols = await marketDataService.getAvailableSymbols();
      
      expect(symbols).toBeInstanceOf(Array);
      expect(symbols.length).toBeGreaterThan(0);
      // getAvailableSymbols 返回的是对象数组，需要提取symbol字段
      const symbolStrings = symbols.map(s => s.symbol);
      expect(symbolStrings).toContain('AAPL');
      expect(symbolStrings).toContain('GOOGL');
      expect(symbolStrings).toContain('MSFT');
    });

    test('股票列表应包含主流美股', async () => {
      const symbols = await marketDataService.getAvailableSymbols();
      
      const majorStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA'];
      const symbolStrings = symbols.map(s => s.symbol);
      
      majorStocks.forEach(symbol => {
        expect(symbolStrings).toContain(symbol);
      });
    });
  });

  describe('Data Format', () => {
    test('价格应保留2位小数', async () => {
      const quote = await marketDataService.getQuote('AAPL');
      
      expect(Number.isFinite(quote.currentPrice)).toBe(true);
      expect(quote.currentPrice.toFixed(2)).toBe(String(quote.currentPrice));
    });

    test('成交量应为整数', async () => {
      const quote = await marketDataService.getQuote('AAPL');
      
      expect(Number.isInteger(quote.volume)).toBe(true);
    });

    test('updatedAt应为有效Date对象', async () => {
      const quote = await marketDataService.getQuote('AAPL');
      
      expect(quote.updatedAt).toBeInstanceOf(Date);
      expect(quote.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Error Handling', () => {
    test('应处理null参数', async () => {
      const quote = await marketDataService.getQuote(null);
      expect(quote).toBeNull();
    });

    test('应处理undefined参数', async () => {
      const quote = await marketDataService.getQuote(undefined);
      expect(quote).toBeNull();
    });

    test('应处理空字符串', async () => {
      const quote = await marketDataService.getQuote('');
      expect(quote).toBeNull();
    });

    test('批量查询应处理无效输入', async () => {
      const quotes = await marketDataService.getBatchQuotes(null);
      expect(quotes).toEqual([]);
    });
  });

  describe('Performance', () => {
    test('单个查询应快速响应（<100ms）', async () => {
      const start = Date.now();
      await marketDataService.getQuote('AAPL');
      const duration = Date.now() - start;
      
      // 异步调用，放宽时间限制
      expect(duration).toBeLessThan(100);
    });

    test('批量查询应快速响应（<200ms）', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA'];
      
      const start = Date.now();
      await marketDataService.getBatchQuotes(symbols);
      const duration = Date.now() - start;
      
      // 异步批量调用，放宽时间限制
      expect(duration).toBeLessThan(200);
    });

    test('搜索应快速响应（<100ms）', async () => {
      const start = Date.now();
      await marketDataService.searchSymbols('Apple');
      const duration = Date.now() - start;
      
      // 异步搜索，放宽时间限制
      expect(duration).toBeLessThan(100);
    });
  });
});
