/**
 * 统一配置管理系统
 * 
 * 提供环境变量管理、配置验证、默认值设置
 * 支持开发/测试/生产环境差异化配置
 * 
 * @module config
 */

const path = require('path');

/**
 * 环境配置
 */
const env = process.env.NODE_ENV || 'development';

/**
 * 服务器配置
 */
const server = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  env,
  isDevelopment: env === 'development',
  isProduction: env === 'production',
  isTest: env === 'test',
};

/**
 * 数据库配置
 */
const database = {
  // MongoDB 配置（未来使用）
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/marketbook',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  // 当前使用内存存储
  useMemoryStore: process.env.USE_MEMORY_STORE !== 'false',
};

/**
 * JWT 认证配置
 */
const jwt = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '24h',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  issuer: process.env.JWT_ISSUER || 'marketbook',
};

/**
 * 安全配置
 */
const security = {
  // CORS 配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  // 速率限制
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15分钟
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 每窗口最多100请求
  },
  // 密码策略
  password: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
    requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL === 'true',
    // 开发环境放宽限制
    lenient: env === 'development',
  },
  // 会话安全
  session: {
    secure: process.env.SESSION_SECURE === 'true' || env === 'production',
    httpOnly: true,
    sameSite: 'strict',
  },
};

/**
 * 日志配置
 */
const logging = {
  level: process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug'),
  format: process.env.LOG_FORMAT || 'json', // 'json' | 'simple' | 'combined'
  // 日志文件配置
  file: {
    enabled: process.env.LOG_FILE_ENABLED !== 'false',
    dirname: process.env.LOG_DIR || path.join(__dirname, '../../logs'),
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || '7d',
  },
  // 控制台输出
  console: {
    enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
    colorize: env !== 'production',
  },
  // 错误日志单独配置
  error: {
    enabled: process.env.LOG_ERROR_ENABLED !== 'false',
    filename: 'error.log',
  },
};

/**
 * 邮件配置
 */
const email = {
  enabled: process.env.EMAIL_ENABLED === 'true',
  from: process.env.EMAIL_FROM || 'noreply@marketbook.com',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
};

/**
 * 交易模拟配置
 */
const trading = {
  // 初始资金
  initialBalance: parseFloat(process.env.TRADING_INITIAL_BALANCE || '100000'),
  // 行情更新频率（毫秒）
  marketDataUpdateInterval: parseInt(process.env.MARKET_UPDATE_INTERVAL || '5000', 10),
  // 价格波动范围（百分比）
  priceVolatility: parseFloat(process.env.PRICE_VOLATILITY || '0.02'), // 2%
  // 支持的交易品种
  supportedSymbols: (process.env.SUPPORTED_SYMBOLS || 'AAPL,GOOGL,MSFT,AMZN,TSLA,META,NVDA,NFLX').split(','),
};

/**
 * 外部API配置
 */
const api = {
  // Alpha Vantage（行情数据，未来使用）
  alphaVantage: {
    apiKey: process.env.ALPHA_VANTAGE_KEY || '',
    enabled: process.env.ALPHA_VANTAGE_ENABLED === 'true',
  },
  // Yahoo Finance（备用行情源）
  yahooFinance: {
    enabled: process.env.YAHOO_FINANCE_ENABLED === 'true',
  },
};

/**
 * 上传配置
 */
const upload = {
  maxFileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10), // 5MB
  allowedMimeTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif').split(','),
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
};

/**
 * 完整配置对象
 */
const config = {
  server,
  database,
  jwt,
  security,
  logging,
  email,
  trading,
  api,
  upload,
};

/**
 * 配置验证
 * 在生产环境强制检查必需配置
 */
function validateConfig() {
  const errors = [];

  // 生产环境必需配置
  if (env === 'production') {
    if (jwt.secret === 'your-secret-key-change-in-production') {
      errors.push('JWT_SECRET must be set in production');
    }
    if (security.cors.origin === '*') {
      errors.push('CORS_ORIGIN must be set in production (not *)');
    }
    if (!security.session.secure) {
      errors.push('SESSION_SECURE must be true in production');
    }
  }

  // 邮件功能启用时检查配置
  if (email.enabled) {
    if (!email.smtp.auth.user || !email.smtp.auth.pass) {
      errors.push('SMTP_USER and SMTP_PASS must be set when email is enabled');
    }
  }

  // 外部API启用时检查密钥
  if (api.alphaVantage.enabled && !api.alphaVantage.apiKey) {
    errors.push('ALPHA_VANTAGE_KEY must be set when Alpha Vantage is enabled');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    if (env === 'production') {
      process.exit(1);
    }
  }
}

// 自动验证配置
validateConfig();

/**
 * 获取配置值（支持点号路径）
 * @example
 * get('server.port') // 3000
 * get('jwt.secret') // 'your-secret-key'
 */
function get(path) {
  return path.split('.').reduce((obj, key) => obj?.[key], config);
}

/**
 * 判断是否为生产环境
 */
function isProduction() {
  return env === 'production';
}

/**
 * 判断是否为开发环境
 */
function isDevelopment() {
  return env === 'development';
}

/**
 * 判断是否为测试环境
 */
function isTest() {
  return env === 'test';
}

/**
 * 导出配置和工具方法
 */
module.exports = {
  ...config,
  get,
  isProduction,
  isDevelopment,
  isTest,
  validate: validateConfig,
};
