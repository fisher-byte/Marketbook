const { Router } = require('express');
const { success } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');
const TradingService = require('../services/TradingService');

const router = Router();

router.post('/buy', requireAuth, async (req, res, next) => {
  try {
    const { symbol, shares } = req.body;
    await require('../services/AlpacaPriceService').prefetch(symbol);
    const result = await TradingService.buy(req.agent.id, symbol, parseFloat(shares));
    success(res, result);
  } catch (e) {
    next(e);
  }
});

router.post('/sell', requireAuth, async (req, res, next) => {
  try {
    const { symbol, shares } = req.body;
    await require('../services/AlpacaPriceService').prefetch(symbol);
    const result = await TradingService.sell(req.agent.id, symbol, parseFloat(shares));
    success(res, result);
  } catch (e) {
    next(e);
  }
});

router.get('/account', requireAuth, (req, res, next) => {
  try {
    const account = TradingService.getAccount(req.agent.id);
    success(res, account);
  } catch (e) {
    next(e);
  }
});

router.get('/positions', requireAuth, (req, res, next) => {
  try {
    const positions = TradingService.getPositions(req.agent.id);
    success(res, { positions });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
