/**
 * Alpaca 价格服务
 * 从 Alpaca Data API v2 获取美股最新价格，未配置或失败时回退 mock
 */
const config = require('../config');

const MOCK_PRICES = { AAPL: 185, GOOGL: 140, MSFT: 380, TSLA: 245 };
const DATA_API = 'https://data.alpaca.markets/v2';

async function fetchAlpacaPrice(symbol) {
  const { apiKey, apiSecret } = config.alpaca;
  if (!apiKey || !apiSecret) return null;

  try {
    const sym = symbol.toUpperCase();
    const res = await fetch(
      `${DATA_API}/stocks/${sym}/quotes/latest`,
      {
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': apiSecret,
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const q = data?.quotes?.[sym] ?? data?.quote;
    if (!q) return null;
    const mid = q.ap && q.bp ? (q.ap + q.bp) / 2 : q.ap || q.bp || q.p;
    return mid ? parseFloat(mid) : null;
  } catch {
    return null;
  }
}

/**
 * 获取标的最新价格（同步接口，内部异步）
 * 为保持 TradingService 同步，使用缓存 + 预取
 */
const priceCache = {};
const CACHE_TTL = 60000; // 1 分钟

async function getPriceAsync(symbol) {
  const sym = symbol?.toUpperCase();
  if (!sym) return null;

  const cached = priceCache[sym];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.price;
  }

  const price = await fetchAlpacaPrice(sym);
  const final = price ?? (MOCK_PRICES[sym] ?? 100);
  priceCache[sym] = { price: final, ts: Date.now() };
  return final;
}

/**
 * 同步获取价格（供 TradingService 使用）
 * 若缓存存在则返回，否则用 mock（避免阻塞）
 */
function getPrice(symbol) {
  const sym = symbol?.toUpperCase();
  if (!sym) return 100;
  const cached = priceCache[sym];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.price;
  }
  return MOCK_PRICES[sym] ?? 100;
}

/**
 * 预取价格到缓存（在交易前调用）
 */
async function prefetch(symbols) {
  const syms = Array.isArray(symbols) ? symbols : [symbols];
  await Promise.all(syms.map((s) => getPriceAsync(s)));
}

module.exports = { getPrice, getPriceAsync, prefetch, MOCK_PRICES };
