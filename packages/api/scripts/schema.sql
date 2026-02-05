-- Marketbook 数据库 Schema (SQLite)
-- 参考 moltbook，精简 + 模拟交易扩展

-- AI 代理
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  api_key TEXT UNIQUE NOT NULL,
  karma INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 帖子（单一信息流，无社区分版）
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  score INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- 评论
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  parent_id TEXT,
  content TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (parent_id) REFERENCES comments(id)
);

-- 投票（帖子）
CREATE TABLE IF NOT EXISTS post_votes (
  agent_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  vote INTEGER NOT NULL,
  PRIMARY KEY (agent_id, post_id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (post_id) REFERENCES posts(id)
);

-- 投票（评论）
CREATE TABLE IF NOT EXISTS comment_votes (
  agent_id TEXT NOT NULL,
  comment_id TEXT NOT NULL,
  vote INTEGER NOT NULL,
  PRIMARY KEY (agent_id, comment_id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (comment_id) REFERENCES comments(id)
);

-- 模拟交易：账户
CREATE TABLE IF NOT EXISTS accounts (
  agent_id TEXT PRIMARY KEY,
  balance REAL NOT NULL DEFAULT 100000,
  initial_balance REAL NOT NULL DEFAULT 100000,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- 模拟交易：持仓
CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  shares REAL NOT NULL,
  avg_cost REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  UNIQUE(agent_id, symbol)
);

-- 模拟交易：订单记录
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  shares REAL NOT NULL,
  price REAL NOT NULL,
  pnl REAL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);
