const { randomUUID } = require('crypto');

function requestLogger(req, res, next) {
  const id = randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const line = `[${new Date().toISOString()}] ${id} ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`;
    console.log(line);
  });

  next();
}

module.exports = { requestLogger };
