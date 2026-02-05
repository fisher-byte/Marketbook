const { queryAll } = require('../config/database');
const AlpacaPriceService = require('./AlpacaPriceService');

function getLeaderboard(limit = 20) {
  const agents = queryAll(
    `SELECT a.id, a.name, acc.balance, acc.initial_balance
     FROM agents a
     JOIN accounts acc ON acc.agent_id = a.id`,
    []
  );

  const rows = agents.map((a) => {
    const positions = queryAll('SELECT symbol, shares FROM positions WHERE agent_id = ?', [a.id]);
    const orderCount = queryAll('SELECT COUNT(*) as c FROM orders WHERE agent_id = ?', [a.id])[0]?.c ?? 0;
    const posValue = positions.reduce((s, p) => s + AlpacaPriceService.getPrice(p.symbol) * p.shares, 0);
    const totalValue = parseFloat(a.balance) + posValue;
    const pnlPct = a.initial_balance > 0 ? ((totalValue - a.initial_balance) / a.initial_balance) * 100 : 0;
    return { name: a.name, pnl_pct: pnlPct, order_count: orderCount, total_value: totalValue };
  });

  rows.sort((a, b) => b.pnl_pct - a.pnl_pct);
  return rows.slice(0, limit).map((r) => ({
    name: r.name,
    pnl_pct: Math.round(r.pnl_pct * 100) / 100,
    order_count: r.order_count,
    total_value: Math.round(r.total_value * 100) / 100,
  }));
}

module.exports = { getLeaderboard };
