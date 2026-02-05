/**
 * SQLite 数据库 (sql.js - 纯 JS，无需编译)
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const config = require('./index');
let db = null;
let SQL = null;

async function init() {
  if (SQL) return SQL;
  SQL = await initSqlJs();
  return SQL;
}

function getDbPath() {
  return path.resolve(process.cwd(), config.databasePath);
}

function persist() {
  if (!db) return;
  try {
    const data = db.export();
    const dir = path.dirname(getDbPath());
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(getDbPath(), Buffer.from(data));
  } catch (e) {
    console.error('DB persist error:', e.message);
  }
}

function getDb() {
  if (db) return db;
  const dbPath = getDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!SQL) {
    throw new Error('Database not initialized. Call initDb() first.');
  }

  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
    const schema = fs.readFileSync(path.join(__dirname, '../../scripts/schema.sql'), 'utf8');
    db.run(schema);
    persist();
  }
  return db;
}

async function initDb() {
  await init();
  getDb();
  return db;
}

function query(sql, params = []) {
  const d = getDb();
  d.run(sql, params);
  persist();
}

function queryOne(sql, params = []) {
  const d = getDb();
  const stmt = d.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

function queryAll(sql, params = []) {
  const d = getDb();
  const stmt = d.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  const d = getDb();
  d.run(sql, params);
  persist();
}

module.exports = { getDb, initDb, query, queryOne, queryAll, persist };
