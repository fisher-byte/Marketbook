/**
 * 模拟交易服务
 * 方案 A：Alpaca 价格 + 自建模拟（每个 agent 独立虚拟账户）
 */
const { queryOne, queryAll, query } = require('../config/database');
const { generateId } = require('../utils/auth');
const { BadRequestError } = require('../utils/errors');
const AlpacaPriceService = require('./AlpacaPriceService');

const INITIAL_BALANCE = 100000;

function getPrice(symbol) {
  return AlpacaPriceService.getPrice(symbol);
}

function ensureAccount(agentId) {
  let acc = queryOne('SELECT * FROM accounts WHERE agent_id = ?', [agentId]);
  if (!acc) {
    query(
      'INSERT INTO accounts (agent_id, balance, initial_balance) VALUES (?, ?, ?)',
      [agentId, INITIAL_BALANCE, INITIAL_BALANCE]
    );
    acc = queryOne('SELECT * FROM accounts WHERE agent_id = ?', [agentId]);
  }
  return acc;
}

class TradingService {
  static async buy(agentId, symbol, shares) {
    if (!symbol || !shares || shares <= 0) {
      throw new BadRequestError('symbol and shares (positive) required');
    }
    const sym = symbol.toUpperCase();
    const price = getPrice(sym);
    const cost = price * shares;

    ensureAccount(agentId);
    const acc = queryOne('SELECT balance FROM accounts WHERE agent_id = ?', [agentId]);
    if (acc.balance < cost) throw new BadRequestError('Insufficient balance');

    query('UPDATE accounts SET balance = balance - ? WHERE agent_id = ?', [cost, agentId]);

    let pos = queryOne('SELECT * FROM positions WHERE agent_id = ? AND symbol = ?', [agentId, sym]);
    if (pos) {
      const totalShares = pos.shares + shares;
      const avgCost = (pos.avg_cost * pos.shares + cost) / totalShares;
      query('UPDATE positions SET shares = ?, avg_cost = ? WHERE agent_id = ? AND symbol = ?', [
        totalShares,
        avgCost,
        agentId,
        sym,
      ]);
    } else {
      const id = generateId('pos_');
      query('INSERT INTO positions (id, agent_id, symbol, shares, avg_cost) VALUES (?, ?, ?, ?, ?)', [
        id,
        agentId,
        sym,
        shares,
        price,
      ]);
    }

    const orderId = generateId('o_');
    query(
      'INSERT INTO orders (id, agent_id, symbol, side, shares, price, pnl) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [orderId, agentId, sym, 'buy', shares, price, null]
    );

    return { success: true, symbol: sym, shares, price, orderId };
  }

  static async sell(agentId, symbol, shares) {
    if (!symbol || !shares || shares <= 0) {
      throw new BadRequestError('symbol and shares (positive) required');
    }
    const sym = symbol.toUpperCase();
    const pos = queryOne('SELECT * FROM positions WHERE agent_id = ? AND symbol = ?', [agentId, sym]);
    if (!pos || pos.shares < shares) {
      throw new BadRequestError('Insufficient position');
    }

    const price = getPrice(sym);
    const proceeds = price * shares;
    let pnl = null;
    if (pos.shares === shares) {
      pnl = (price - pos.avg_cost) * shares;
      query('DELETE FROM positions WHERE agent_id = ? AND symbol = ?', [agentId, sym]);
    } else {
      pnl = (price - pos.avg_cost) * shares;
      query('UPDATE positions SET shares = shares - ? WHERE agent_id = ? AND symbol = ?', [
        shares,
        agentId,
        sym,
      ]);
    }

    query('UPDATE accounts SET balance = balance + ? WHERE agent_id = ?', [proceeds, agentId]);

    const orderId = generateId('o_');
    query(
      'INSERT INTO orders (id, agent_id, symbol, side, shares, price, pnl) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [orderId, agentId, sym, 'sell', shares, price, pnl]
    );

    return { success: true, symbol: sym, shares, price, pnl, orderId };
  }

  static getPositions(agentId) {
    ensureAccount(agentId);
    return queryAll('SELECT symbol, shares, avg_cost FROM positions WHERE agent_id = ?', [agentId]);
  }

  static getAccount(agentId) {
    const acc = ensureAccount(agentId);
    const positions = queryAll('SELECT symbol, shares, avg_cost FROM positions WHERE agent_id = ?', [agentId]);
    const totalCost = positions.reduce((s, p) => s + p.shares * p.avg_cost, 0);
    const currentPrices = positions.reduce((s, p) => s + p.shares * getPrice(p.symbol), 0);
    const totalValue = acc.balance + currentPrices;
    const pnlPct = acc.initial_balance > 0 ? ((totalValue - acc.initial_balance) / acc.initial_balance) * 100 : 0;
    return {
      balance: acc.balance,
      total_value: totalValue,
      initial_balance: acc.initial_balance,
      pnl_pct: Math.round(pnlPct * 100) / 100,
      positions,
    };
  }
}

module.exports = TradingService;
