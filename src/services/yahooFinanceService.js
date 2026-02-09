/**
 * Yahoo Finance API 服务
 * @fileoverview 封装 Yahoo Finance API 调用，提供真实股票行情数据
 * 
 * 使用 yahoo-finance2 库（无需API Key）
 * 文档: https://github.com/gadicc/yahoo-finance2
 */

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const logger = require('../utils/logger');

// 缓存配置
const CACHE_TTL = 60 * 1000; // 1分钟缓存
const cache = new Map();

/**
 * 获取单个股票实时行情
 * @param {string} symbol - 股票代码
 * @returns {Promise<Object|null>} 行情数据
 */
async function getQuote(symbol) {
    if (!symbol) {
        return null;
    }

    // 标准化大写
    symbol = symbol.toUpperCase();

    // 检查缓存
    const cached = cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.debug(`[YahooFinance] Cache hit: ${symbol}`);
        return cached.data;
    }

    try {
        logger.info(`[YahooFinance] Fetching quote: ${symbol}`);
        const result = await yahooFinance.quote(symbol, {
            fields: [
                'symbol',
                'shortName',
                'longName',
                'regularMarketPrice',
                'regularMarketChange',
                'regularMarketChangePercent',
                'regularMarketDayHigh',
                'regularMarketDayLow',
                'regularMarketOpen',
                'regularMarketVolume',
                'regularMarketTime'
            ]
        });

        if (!result || !result.regularMarketPrice) {
            logger.warn(`[YahooFinance] Invalid response for ${symbol}`);
            return null;
        }

        // 转换为标准格式
        const quote = {
            symbol: result.symbol,
            name: result.longName || result.shortName || symbol,
            currentPrice: parseFloat(result.regularMarketPrice.toFixed(2)),
            change: parseFloat((result.regularMarketChange || 0).toFixed(2)),
            changePercent: parseFloat((result.regularMarketChangePercent || 0).toFixed(2)),
            high: parseFloat((result.regularMarketDayHigh || result.regularMarketPrice).toFixed(2)),
            low: parseFloat((result.regularMarketDayLow || result.regularMarketPrice).toFixed(2)),
            open: parseFloat((result.regularMarketOpen || result.regularMarketPrice).toFixed(2)),
            volume: result.regularMarketVolume || 0,
            lastUpdate: result.regularMarketTime ? result.regularMarketTime.getTime() : Date.now()
        };

        // 更新缓存
        cache.set(symbol, {
            data: quote,
            timestamp: Date.now()
        });

        logger.info(`[YahooFinance] Quote fetched successfully: ${symbol} @ $${quote.currentPrice}`);
        return quote;

    } catch (error) {
        logger.error(`[YahooFinance] Failed to fetch quote for ${symbol}:`, error);
        
        // 如果缓存有过期数据，返回过期数据
        if (cached) {
            logger.warn(`[YahooFinance] Returning stale cache for ${symbol}`);
            return cached.data;
        }

        return null;
    }
}

/**
 * 批量获取行情
 * @param {string[]} symbols - 股票代码数组
 * @returns {Promise<Object[]>} 行情数据数组
 */
async function getBatchQuotes(symbols) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
        return [];
    }

    logger.info(`[YahooFinance] Batch fetching ${symbols.length} symbols`);

    // 并发获取所有股票行情
    const promises = symbols.map(symbol => 
        getQuote(symbol).catch(err => {
            logger.error(`[YahooFinance] Batch fetch error for ${symbol}:`, err);
            return null;
        })
    );

    const results = await Promise.all(promises);
    
    // 过滤掉失败的请求
    return results.filter(Boolean);
}

/**
 * 搜索股票（模糊匹配）
 * @param {string} keyword - 搜索关键词
 * @returns {Promise<Object[]>} 匹配的股票列表
 */
async function searchSymbols(keyword) {
    if (!keyword || keyword.length < 2) {
        return [];
    }

    try {
        logger.info(`[YahooFinance] Searching symbols: ${keyword}`);
        
        const searchResults = await yahooFinance.search(keyword, {
            newsCount: 0,
            enableNavLinks: false,
            enableEnhancedTrivialQuery: false
        });

        if (!searchResults || !searchResults.quotes || searchResults.quotes.length === 0) {
            logger.warn(`[YahooFinance] No results for search: ${keyword}`);
            return [];
        }

        // 只返回股票（过滤掉ETF、期权等）
        const stocks = searchResults.quotes
            .filter(item => item.quoteType === 'EQUITY' || item.quoteType === 'MUTUALFUND')
            .slice(0, 20) // 限制最多20个结果
            .map(item => ({
                symbol: item.symbol,
                name: item.longname || item.shortname || item.symbol,
                exchange: item.exchange,
                type: item.quoteType
            }));

        logger.info(`[YahooFinance] Search found ${stocks.length} results`);
        return stocks;

    } catch (error) {
        logger.error(`[YahooFinance] Search failed for keyword "${keyword}":`, error);
        return [];
    }
}

/**
 * 获取历史K线数据（可选功能）
 * @param {string} symbol - 股票代码
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @returns {Promise<Object[]>} K线数据数组
 */
async function getHistoricalData(symbol, startDate, endDate) {
    if (!symbol || !startDate || !endDate) {
        return [];
    }

    try {
        logger.info(`[YahooFinance] Fetching historical data: ${symbol} from ${startDate} to ${endDate}`);
        
        const result = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: endDate,
            interval: '1d'
        });

        if (!result || result.length === 0) {
            logger.warn(`[YahooFinance] No historical data for ${symbol}`);
            return [];
        }

        // 转换为标准格式
        const klines = result.map(item => ({
            date: item.date.toISOString().split('T')[0],
            open: parseFloat(item.open.toFixed(2)),
            high: parseFloat(item.high.toFixed(2)),
            low: parseFloat(item.low.toFixed(2)),
            close: parseFloat(item.close.toFixed(2)),
            volume: item.volume
        }));

        logger.info(`[YahooFinance] Historical data fetched: ${klines.length} records`);
        return klines;

    } catch (error) {
        logger.error(`[YahooFinance] Failed to fetch historical data for ${symbol}:`, error);
        return [];
    }
}

/**
 * 清除缓存
 */
function clearCache() {
    cache.clear();
    logger.info('[YahooFinance] Cache cleared');
}

module.exports = {
    getQuote,
    getBatchQuotes,
    searchSymbols,
    getHistoricalData,
    clearCache
};
