/**
 * marketDataService 单元测试
 * 测试实时行情数据服务
 */

const marketDataService = require('../../src/services/marketDataService');

describe('marketDataService', () => {
  describe('Quote Retrieval', () => {
    test('应能获取单个股票行情', () => {
      const quote = marketDataService.getQuote('AAPL');
      
      expect(quote).not.toBeNull();
      expect(quote).toHaveProperty('symbol', 'AAPL');
      expect(quote).toHaveProperty('name', 'Apple Inc.');
      expect(quote).toHaveProperty('currentPrice');
      expect(quote).toHaveProperty('open');
      expect(quote).toHaveProperty('high');
      expect(quote).toHaveProperty('low');
      expect(quote).toHaveProperty('change');
      expect(quote).toHaveProperty('changePercent');
      expect(quote).toHaveProperty('volume');
      expect(quote).toHaveProperty('lastUpdate');
    });

    test('不存在的股票代码应返回默认fallback数据', () => {
      const quote = marketDataService.getQuote('INVALID');
      // 实际实现会返回一个默认fallback对象，而不是null
      expect(quote).not.toBeNull();
      expect(quote.symbol).toBe('INVALID');
      expect(quote.currentPrice).toBe(100.00); // 默认价格
    });

    test('股票代码应不区分大小写', () => {
      const quote1 = marketDataService.getQuote('AAPL');
      const quote2 = marketDataService.getQuote('aapl');
      
      expect(quote1).not.toBeNull();
      expect(quote2).not.toBeNull();
      expect(quote1.symbol).toBe(quote2.symbol);
    });

    test('价格应为正数', () => {
      const quote = marketDataService.getQuote('AAPL');
      
      expect(quote.currentPrice).toBeGreaterThan(0);
      expect(quote.open).toBeGreaterThan(0);
      expect(quote.high).toBeGreaterThan(0);
      expect(quote.low).toBeGreaterThan(0);
    });

    test('高价应大于等于低价', () => {
      const quote = marketDataService.getQuote('AAPL');
      expect(quote.high).toBeGreaterThanOrEqual(quote.low);
    });

    test('当前价应在高低价之间（或相等）', () => {
      const quote = marketDataService.getQuote('AAPL');
      expect(quote.currentPrice).toBeGreaterThanOrEqual(quote.low);
      expect(quote.currentPrice).toBeLessThanOrEqual(quote.high);
    });
  });

  describe('Batch Quote Retrieval', () => {
    test('应能批量获取多个股票行情', () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];
      const quotes = marketDataService.getBatchQuotes(symbols);
      
      expect(quotes).toHaveLength(3);
      expect(quotes[0].symbol).toBe('AAPL');
      expect(quotes[1].symbol).toBe('GOOGL');
      expect(quotes[2].symbol).toBe('MSFT');
    });

    test('应包含不存在的股票代码（使用fallback）', () => {
      const symbols = ['AAPL', 'INVALID', 'GOOGL'];
      const quotes = marketDataService.getBatchQuotes(symbols);
      
      // 实际实现不会过滤掉不存在的股票，会返回fallback数据
      expect(quotes).toHaveLength(3);
      expect(quotes.map(q => q.symbol)).toEqual(['AAPL', 'INVALID', 'GOOGL']);
    });

    test('空数组应返回空结果', () => {
      const quotes = marketDataService.getBatchQuotes([]);
      expect(quotes).toEqual([]);
    });

    test('应处理重复的股票代码', () => {
      const symbols = ['AAPL', 'AAPL', 'GOOGL'];
      const quotes = marketDataService.getBatchQuotes(symbols);
      
      // 实际实现不会自动去重，调用方可以收到重复数据
      expect(quotes).toHaveLength(3);
      expect(quotes[0].symbol).toBe('AAPL');
      expect(quotes[1].symbol).toBe('AAPL');
      expect(quotes[2].symbol).toBe('GOOGL');
    });
  });

  describe('Symbol Search', () => {
    test('应能通过关键词搜索股票', () => {
      const results = marketDataService.searchSymbols('Apple');
      
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol).toBe('AAPL');
      expect(results[0].name).toContain('Apple');
    });

    test('搜索应不区分大小写', () => {
      const results1 = marketDataService.searchSymbols('apple');
      const results2 = marketDataService.searchSymbols('APPLE');
      
      expect(results1).toEqual(results2);
    });

    test('应能通过股票代码搜索', () => {
      const results = marketDataService.searchSymbols('AAPL');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol).toBe('AAPL');
    });

    test('应能部分匹配公司名称', () => {
      const results = marketDataService.searchSymbols('Micro');
      
      const hasMicrosoft = results.some(r => r.symbol === 'MSFT');
      expect(hasMicrosoft).toBe(true);
    });

    test('空关键词应返回所有股票', () => {
      const results = marketDataService.searchSymbols('');
      
      expect(results.length).toBeGreaterThan(0);
      // 应返回所有可用股票
    });

    test('不存在的关键词应返回空数组', () => {
      const results = marketDataService.searchSymbols('NONEXISTENT-COMPANY-XYZ');
      expect(results).toEqual([]);
    });

    test('搜索结果应包含必要字段', () => {
      const results = marketDataService.searchSymbols('Tesla');
      
      expect(results.length).toBeGreaterThan(0);
      const first = results[0];
      expect(first).toHaveProperty('symbol');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('currentPrice');
    });
  });

  describe('Price Updates', () => {
    test('价格应在合理范围内波动', () => {
      const initialQuote = marketDataService.getQuote('AAPL');
      const initialPrice = initialQuote.currentPrice;
      
      // 模拟价格更新（通过直接调用内部方法或等待定时器）
      // 这里我们只验证价格在合理范围内
      expect(initialPrice).toBeGreaterThan(50); // Apple股价应大于50
      expect(initialPrice).toBeLessThan(500); // Apple股价应小于500（合理假设）
    });

    test('涨跌幅应正确计算', () => {
      const quote = marketDataService.getQuote('AAPL');
      
      const expectedChangePercent = ((quote.currentPrice - quote.open) / quote.open) * 100;
      
      expect(Math.abs(quote.changePercent - expectedChangePercent)).toBeLessThan(0.01);
    });

    test('涨跌额应正确计算', () => {
      const quote = marketDataService.getQuote('AAPL');
      
      const expectedChange = quote.currentPrice - quote.open;
      
      expect(Math.abs(quote.change - expectedChange)).toBeLessThan(0.01);
    });
  });

  describe('Available Symbols', () => {
    test('应返回所有可用股票列表', () => {
      const symbols = marketDataService.getAvailableSymbols();
      
      expect(symbols).toBeInstanceOf(Array);
      expect(symbols.length).toBeGreaterThan(0);
      // getAvailableSymbols 返回的是对象数组，需要提取symbol字段
      const symbolStrings = symbols.map(s => s.symbol);
      expect(symbolStrings).toContain('AAPL');
      expect(symbolStrings).toContain('GOOGL');
      expect(symbolStrings).toContain('MSFT');
    });

    test('股票列表应包含主流美股', () => {
      const symbols = marketDataService.getAvailableSymbols();
      
      const majorStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA'];
      const symbolStrings = symbols.map(s => s.symbol);
      
      majorStocks.forEach(symbol => {
        expect(symbolStrings).toContain(symbol);
      });
    });
  });

  describe('Data Format', () => {
    test('价格应保留2位小数', () => {
      const quote = marketDataService.getQuote('AAPL');
      
      expect(quote.currentPrice.toString()).toMatch(/^\d+\.\d{2}$/);
    });

    test('涨跌幅应保留2位小数', () => {
      const quote = marketDataService.getQuote('AAPL');
      
      expect(quote.changePercent.toString()).toMatch(/^-?\d+\.\d{2}$/);
    });

    test('成交量应为整数', () => {
      const quote = marketDataService.getQuote('AAPL');
      
      expect(Number.isInteger(quote.volume)).toBe(true);
    });

    test('lastUpdated应为有效时间戳', () => {
      const quote = marketDataService.getQuote('AAPL');
      
      expect(typeof quote.lastUpdate).toBe('number');
      expect(quote.lastUpdate).toBeLessThanOrEqual(Date.now());
      expect(quote.lastUpdate).toBeGreaterThan(Date.now() - 60000); // 最近1分钟内
    });
  });

  describe('Error Handling', () => {
    test('应处理null参数', () => {
      const quote = marketDataService.getQuote(null);
      expect(quote).toBeNull();
    });

    test('应处理undefined参数', () => {
      const quote = marketDataService.getQuote(undefined);
      expect(quote).toBeNull();
    });

    test('应处理空字符串', () => {
      const quote = marketDataService.getQuote('');
      expect(quote).toBeNull();
    });

    test('批量查询应处理无效输入', () => {
      const quotes = marketDataService.getBatchQuotes(null);
      expect(quotes).toEqual([]);
    });
  });

  describe('Performance', () => {
    test('单个查询应快速响应（<10ms）', () => {
      const start = Date.now();
      marketDataService.getQuote('AAPL');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(10);
    });

    test('批量查询应快速响应（<50ms）', () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA'];
      
      const start = Date.now();
      marketDataService.getBatchQuotes(symbols);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(50);
    });

    test('搜索应快速响应（<20ms）', () => {
      const start = Date.now();
      marketDataService.searchSymbols('Apple');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(20);
    });
  });
});
