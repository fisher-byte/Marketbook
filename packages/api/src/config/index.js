require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databasePath: process.env.DATABASE_PATH || './data/marketbook.db',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
};
