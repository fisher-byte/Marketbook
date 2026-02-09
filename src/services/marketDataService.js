/**
 * 行情数据服务 - 提供实时行情查询
 * @fileoverview 封装行情数据获取逻辑，支持真实数据源和模拟模式
 * 
 * 真实模式：使用 Yahoo Finance API
 * 模拟模式：内存缓存 + 随机波动
 * 
 * 环境变量控制：
 * MARKET_DATA_MODE=real - 使用真实API（生产环境）
 * MARKET_DATA_MODE=simulation - 使用模拟数据（开发环境，默认）
 */

const yahooFinance = require('./yahooFinanceService');
const logger = require('../utils/logger');

// 运行模式（从环境变量读取，默认为模拟模式）
const MODE = process.env.MARKET_DATA_MODE || 'simulation';

/**
 * 内存行情缓存（仅模拟模式使用）
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
 * 获取股票实时行情（智能路由：真实/模拟）
 * @param {string} symbol - 股票代码
 * @returns {Promise<Object|null>} 行情数据
 */
async function getQuote(symbol) {
    if (!symbol) return null;

    // 标准化大写
    symbol = symbol.toUpperCase();

    // 真实模式：调用 Yahoo Finance API
    if (MODE === 'real') {
        try {
            const quote = await yahooFinance.getQuote(symbol);
            if (quote) {
                logger.info(`[MarketData] Real quote fetched: ${symbol} @ $${quote.currentPrice}`);
                return quote;
            }
            // API失败，降级到模拟模式
            logger.warn(`[MarketData] Real API failed for ${symbol}, falling back to simulation`);
        } catch (error) {
            logger.error(`[MarketData] Real API error for ${symbol}:`, error);
        }
    }

    // 模拟模式 或 真实模式降级
    logger.debug(`[MarketData] Using simulation mode for ${symbol}`);

    // 如果缓存中没有，尝试初始化
    if (!marketCache.has(symbol)) {
        initializeMarketData();
    }

    // 模拟价格波动
    const data = simulatePriceChange(symbol);
    
    if (!data) {
        // 如果还是没有数据，返回默认值
        logger.warn(`[MarketData] Symbol not found: ${symbol}, using fallback price`);
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
 * 批量获取行情（智能路由：真实/模拟）
 * @param {string[]} symbols - 股票代码数组
 * @returns {Promise<Object[]>} 行情数据数组
 */
async function getBatchQuotes(symbols) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
        return [];
    }

    // 真实模式：调用 Yahoo Finance API
    if (MODE === 'real') {
        try {
            const quotes = await yahooFinance.getBatchQuotes(symbols);
            if (quotes && quotes.length > 0) {
                logger.info(`[MarketData] Real batch quotes fetched: ${quotes.length}/${symbols.length}`);
                return quotes;
            }
            logger.warn(`[MarketData] Real batch API failed, falling back to simulation`);
        } catch (error) {
            logger.error(`[MarketData] Real batch API error:`, error);
        }
    }

    // 模拟模式 或 降级
    logger.debug(`[MarketData] Using simulation mode for batch quotes`);
    
    // 使用 Promise.all 并发获取模拟数据
    const promises = symbols.map(symbol => Promise.resolve(getQuote(symbol)));
    const results = await Promise.all(promises);
    
    return results.filter(Boolean);
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
 * 搜索股票（智能路由：真实/模拟）
 * @param {string} keyword - 搜索关键词
 * @returns {Promise<Object[]>} 匹配的股票列表
 */
async function searchSymbols(keyword) {
    if (!keyword) {
        // 无关键词时返回可用列表
        return getAvailableSymbols();
    }

    keyword = keyword.toUpperCase();

    // 真实模式：调用 Yahoo Finance API
    if (MODE === 'real') {
        try {
            const results = await yahooFinance.searchSymbols(keyword);
            if (results && results.length > 0) {
                logger.info(`[MarketData] Real search results: ${results.length} for "${keyword}"`);
                return results;
            }
            logger.warn(`[MarketData] Real search API failed for "${keyword}", falling back to simulation`);
        } catch (error) {
            logger.error(`[MarketData] Real search API error:`, error);
        }
    }

    // 模拟模式 或 降级
    logger.debug(`[MarketData] Using simulation mode for search: ${keyword}`);
    
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

// 初始化模拟市场数据（仅模拟模式需要）
if (MODE === 'simulation') {
    initializeMarketData();
    logger.info('[MarketData] Running in SIMULATION mode');

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
} else {
    logger.info('[MarketData] Running in REAL mode (Yahoo Finance API)');
}

module.exports = {
    getQuote,
    getBatchQuotes,
    getAvailableSymbols,
    searchSymbols,
    resetDailyData,
    // 新增：运行模式查询
    getMode: () => MODE
};
