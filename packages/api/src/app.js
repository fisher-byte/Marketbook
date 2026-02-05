const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter, writeLimiter } = require('./middleware/rateLimit');

const app = express();
app.use(cors());
app.use(express.json());

app.use(generalLimiter);

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/v1', routes);
app.use(errorHandler);

module.exports = app;
