/**
 * 行情数据服务 - 提供实时行情查询
 * @fileoverview 封装行情数据获取逻辑，支持多个数据源
 */

/**
 * 内存行情缓存（模拟实时行情）
 * 真实场景应接入：
 * - Alpha Vantage API
 * - Yahoo Finance API
 * - IEX Cloud API
 * - 新浪/腾讯财经接口
 */
const marketCache = new Map();

/**
 * 初始化行情数据（模拟波动）
 * 基础价格 + 随机波动
 */
function initializeMarketData() {
    const symbols = [
        { symbol: 'AAPL', basePrice: 175.50, name: 'Apple Inc.' },
        { symbol: 'GOOGL', basePrice: 142.30, name: 'Alphabet Inc.' },
        { symbol: 'MSFT', basePrice: 378.90, name: 'Microsoft Corp.' },
        { symbol: 'AMZN', basePrice: 151.75, name: 'Amazon.com Inc.' },
        { symbol: 'TSLA', basePrice: 207.40, name: 'Tesla Inc.' },
        { symbol: 'META', basePrice: 325.60, name: 'Meta Platforms Inc.' },
        { symbol: 'NVDA', basePrice: 485.20, name: 'NVIDIA Corp.' },
        { symbol: 'NFLX', basePrice: 445.30, name: 'Netflix Inc.' },
    ];

    symbols.forEach(item => {
        marketCache.set(item.symbol, {
            symbol: item.symbol,
            name: item.name,
            basePrice: item.basePrice,
            currentPrice: item.basePrice,
            lastUpdate: Date.now(),
            change: 0,
            changePercent: 0,
            high: item.basePrice,
            low: item.basePrice,
            open: item.basePrice,
            volume: Math.floor(Math.random() * 10000000) + 1000000
        });
    });
}

/**
 * 模拟价格波动（每次波动 ±0.5%~2%）
 * @param {string} symbol - 股票代码
 */
function simulatePriceChange(symbol) {
    const data = marketCache.get(symbol);
    if (!data) return null;

    // 随机波动幅度 -2% ~ +2%
    const changePercent = (Math.random() * 4 - 2) / 100;
    const newPrice = data.basePrice * (1 + changePercent);
    
    // 更新数据
    data.currentPrice = parseFloat(newPrice.toFixed(2));
    data.change = parseFloat((newPrice - data.open).toFixed(2));
    data.changePercent = parseFloat((data.change / data.open * 100).toFixed(2));
    data.high = Math.max(data.high, data.currentPrice);
    data.low = Math.min(data.low, data.currentPrice);
    data.lastUpdate = Date.now();
    data.volume += Math.floor(Math.random() * 100000);

    marketCache.set(symbol, data);
    return data;
}

/**
 * 获取股票实时行情
 * @param {string} symbol - 股票代码
 * @returns {Object|null} 行情数据
 */
function getQuote(symbol) {
    if (!symbol) return null;

    // 标准化大写
    symbol = symbol.toUpperCase();

    // 如果缓存中没有，尝试初始化
    if (!marketCache.has(symbol)) {
        initializeMarketData();
    }

    // 模拟价格波动
    const data = simulatePriceChange(symbol);
    
    if (!data) {
        // 如果还是没有数据，返回默认值
        console.warn(`[MarketData] Symbol not found: ${symbol}, using fallback price`);
        return {
            symbol,
            name: symbol,
            currentPrice: 100.00,
            basePrice: 100.00,
            change: 0,
            changePercent: 0,
            high: 100.00,
            low: 100.00,
            open: 100.00,
            volume: 1000000,
            lastUpdate: Date.now()
        };
    }

    return data;
}

/**
 * 批量获取行情
 * @param {string[]} symbols - 股票代码数组
 * @returns {Object[]} 行情数据数组
 */
function getBatchQuotes(symbols) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
        return [];
    }

    return symbols.map(symbol => getQuote(symbol)).filter(Boolean);
}

/**
 * 获取所有可用股票列表
 * @returns {Object[]} 股票列表
 */
function getAvailableSymbols() {
    if (marketCache.size === 0) {
        initializeMarketData();
    }

    return Array.from(marketCache.values()).map(data => ({
        symbol: data.symbol,
        name: data.name,
        currentPrice: data.currentPrice,
        changePercent: data.changePercent
    }));
}

/**
 * 搜索股票（模糊匹配）
 * @param {string} keyword - 搜索关键词
 * @returns {Object[]} 匹配的股票列表
 */
function searchSymbols(keyword) {
    if (!keyword) return getAvailableSymbols();

    keyword = keyword.toUpperCase();
    
    if (marketCache.size === 0) {
        initializeMarketData();
    }

    const results = [];
    for (const [symbol, data] of marketCache.entries()) {
        if (symbol.includes(keyword) || data.name.toUpperCase().includes(keyword)) {
            results.push({
                symbol: data.symbol,
                name: data.name,
                currentPrice: data.currentPrice,
                changePercent: data.changePercent
            });
        }
    }

    return results;
}

/**
 * 重置市场数据（每日开盘使用）
 */
function resetDailyData() {
    for (const [symbol, data] of marketCache.entries()) {
        data.open = data.currentPrice;
        data.high = data.currentPrice;
        data.low = data.currentPrice;
        data.change = 0;
        data.changePercent = 0;
        data.volume = 0;
        marketCache.set(symbol, data);
    }
    console.log('[MarketData] Daily data reset completed');
}

// 初始化市场数据
initializeMarketData();

// 定时模拟价格波动（每5秒）
setInterval(() => {
    for (const symbol of marketCache.keys()) {
        simulatePriceChange(symbol);
    }
}, 5000);

// 每天凌晨重置数据（生产环境应使用cron）
// 这里简化为每24小时重置一次
setInterval(() => {
    resetDailyData();
}, 24 * 60 * 60 * 1000);

module.exports = {
    getQuote,
    getBatchQuotes,
    getAvailableSymbols,
    searchSymbols,
    resetDailyData
};
