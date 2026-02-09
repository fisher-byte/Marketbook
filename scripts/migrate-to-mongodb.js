/**
 * 数据库迁移脚本：内存存储 → MongoDB
 * 
 * 功能：
 * 1. 将当前内存中的用户数据导出为 JSON
 * 2. 连接到 MongoDB
 * 3. 创建数据库集合（users, trading_accounts, trading_records）
 * 4. 导入数据到 MongoDB
 * 5. 验证数据完整性
 * 
 * 使用：
 * 1. 确保 .env 配置了 MONGODB_URI
 * 2. 运行：node scripts/migrate-to-mongodb.js
 * 3. 根据提示确认数据备份
 * 4. 迁移完成后测试应用
 * 
 * 注意：
 * - 本脚本不会删除内存数据，仅导出到 MongoDB
 * - 建议先在测试环境运行
 * - 迁移前会自动创建数据备份
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const memoryStore = require('../src/db/memoryStore');
const UserStore = require('../src/models/UserStore');
const TradingAccountStore = require('../src/models/TradingAccountStore');
const TradingRecordStore = require('../src/models/TradingRecordStore');
const logger = require('../src/utils/logger');

// ==========================================
// 配置
// ==========================================
const BACKUP_DIR = path.join(__dirname, '../backups');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketbook';

// ==========================================
// MongoDB Schema 定义
// ==========================================

// 用户 Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const UserModel = mongoose.model('User', UserSchema);

// 交易账户 Schema
const TradingAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accountId: { type: String, required: true, unique: true },
  balance: { type: Number, required: true, default: 100000 },
  initialBalance: { type: Number, required: true, default: 100000 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const TradingAccountModel = mongoose.model('TradingAccount', TradingAccountSchema);

// 交易记录 Schema
const TradingRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accountId: { type: String, required: true },
  type: { type: String, required: true, enum: ['buy', 'sell'] },
  symbol: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

const TradingRecordModel = mongoose.model('TradingRecord', TradingRecordSchema);

// ==========================================
// 工具函数
// ==========================================

/**
 * 询问用户确认
 */
async function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question + ' (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * 创建备份目录
 */
async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

/**
 * 导出内存数据为 JSON
 */
async function exportMemoryData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `memory-backup-${timestamp}.json`);

  // 获取所有内存数据
  const users = Array.from(memoryStore.getAll('users') || new Map()).map(([key, value]) => ({
    key,
    ...value,
  }));

  const tradingAccounts = Array.from(memoryStore.getAll('trading_accounts') || new Map()).map(
    ([key, value]) => ({
      key,
      ...value,
    })
  );

  const tradingRecords = Array.from(memoryStore.getAll('trading_records') || new Map()).map(
    ([key, value]) => ({
      key,
      ...value,
    })
  );

  const backup = {
    timestamp: new Date().toISOString(),
    users,
    tradingAccounts,
    tradingRecords,
    stats: {
      usersCount: users.length,
      accountsCount: tradingAccounts.length,
      recordsCount: tradingRecords.length,
    },
  };

  await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
  logger.info(`✅ 数据备份完成: ${backupFile}`);
  return backup;
}

/**
 * 连接到 MongoDB
 */
async function connectMongoDB() {
  logger.info(`🔌 正在连接 MongoDB: ${MONGODB_URI.replace(/:[^:]*@/, ':***@')}`);
  await mongoose.connect(MONGODB_URI);
  logger.info('✅ MongoDB 连接成功');
}

/**
 * 清空现有集合（如果存在）
 */
async function clearCollections() {
  logger.info('🗑️ 清空现有集合...');
  await UserModel.deleteMany({});
  await TradingAccountModel.deleteMany({});
  await TradingRecordModel.deleteMany({});
  logger.info('✅ 集合已清空');
}

/**
 * 导入用户数据
 */
async function importUsers(users) {
  logger.info(`📥 导入 ${users.length} 个用户...`);

  const userIdMap = new Map(); // 内存ID → MongoDB ObjectId

  for (const user of users) {
    const doc = new UserModel({
      username: user.username,
      email: user.email,
      password: user.password,
      isVerified: user.isVerified || false,
      verificationToken: user.verificationToken,
      verificationExpires: user.verificationExpires,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
    });

    await doc.save();
    userIdMap.set(user.key || user.id, doc._id);
    logger.info(`  ✓ ${user.username} (${user.email})`);
  }

  logger.info(`✅ 用户导入完成（${users.length}条）`);
  return userIdMap;
}

/**
 * 导入交易账户数据
 */
async function importTradingAccounts(accounts, userIdMap) {
  logger.info(`📥 导入 ${accounts.length} 个交易账户...`);

  for (const account of accounts) {
    const mongoUserId = userIdMap.get(account.userId);
    if (!mongoUserId) {
      logger.warn(`  ⚠️ 跳过账户 ${account.accountId}：用户ID ${account.userId} 不存在`);
      continue;
    }

    const doc = new TradingAccountModel({
      userId: mongoUserId,
      accountId: account.accountId || account.id,
      balance: account.balance,
      initialBalance: account.initialBalance || account.balance,
      createdAt: account.createdAt || new Date(),
      updatedAt: account.updatedAt || new Date(),
    });

    await doc.save();
    logger.info(`  ✓ 账户 ${account.accountId} (余额: $${account.balance})`);
  }

  logger.info(`✅ 交易账户导入完成（${accounts.length}条）`);
}

/**
 * 导入交易记录数据
 */
async function importTradingRecords(records, userIdMap) {
  logger.info(`📥 导入 ${records.length} 条交易记录...`);

  for (const record of records) {
    const mongoUserId = userIdMap.get(record.userId);
    if (!mongoUserId) {
      logger.warn(`  ⚠️ 跳过记录 ${record.id}：用户ID ${record.userId} 不存在`);
      continue;
    }

    const doc = new TradingRecordModel({
      userId: mongoUserId,
      accountId: record.accountId,
      type: record.type,
      symbol: record.symbol,
      price: record.price,
      quantity: record.quantity,
      total: record.total,
      timestamp: record.timestamp || new Date(),
    });

    await doc.save();
  }

  logger.info(`✅ 交易记录导入完成（${records.length}条）`);
}

/**
 * 验证数据完整性
 */
async function verifyMigration(originalData) {
  logger.info('🔍 验证数据完整性...');

  const usersCount = await UserModel.countDocuments();
  const accountsCount = await TradingAccountModel.countDocuments();
  const recordsCount = await TradingRecordModel.countDocuments();

  const results = {
    users: {
      original: originalData.stats.usersCount,
      migrated: usersCount,
      success: usersCount === originalData.stats.usersCount,
    },
    accounts: {
      original: originalData.stats.accountsCount,
      migrated: accountsCount,
      success: accountsCount === originalData.stats.accountsCount,
    },
    records: {
      original: originalData.stats.recordsCount,
      migrated: recordsCount,
      success: recordsCount === originalData.stats.recordsCount,
    },
  };

  console.log('\n📊 迁移结果对比：');
  console.log('┌──────────────┬──────────┬──────────┬────────┐');
  console.log('│ 数据类型     │ 原始数量 │ 迁移数量 │ 状态   │');
  console.log('├──────────────┼──────────┼──────────┼────────┤');
  console.log(
    `│ 用户         │ ${String(results.users.original).padEnd(8)} │ ${String(results.users.migrated).padEnd(8)} │ ${results.users.success ? '✅ 成功' : '❌ 失败'} │`
  );
  console.log(
    `│ 交易账户     │ ${String(results.accounts.original).padEnd(8)} │ ${String(results.accounts.migrated).padEnd(8)} │ ${results.accounts.success ? '✅ 成功' : '❌ 失败'} │`
  );
  console.log(
    `│ 交易记录     │ ${String(results.records.original).padEnd(8)} │ ${String(results.records.migrated).padEnd(8)} │ ${results.records.success ? '✅ 成功' : '❌ 失败'} │`
  );
  console.log('└──────────────┴──────────┴──────────┴────────┘\n');

  return results.users.success && results.accounts.success && results.records.success;
}

// ==========================================
// 主流程
// ==========================================
async function main() {
  console.log(`
╔════════════════════════════════════════════╗
║   MarketBook 数据库迁移工具               ║
║   内存存储 → MongoDB                      ║
╚════════════════════════════════════════════╝
  `);

  try {
    // 1. 检查 MongoDB URI
    if (!process.env.MONGODB_URI) {
      console.log('⚠️ 未检测到 MONGODB_URI 环境变量');
      console.log('使用默认值: mongodb://localhost:27017/marketbook\n');
    }

    // 2. 备份数据
    await ensureBackupDir();
    const backupData = await exportMemoryData();

    if (backupData.stats.usersCount === 0) {
      logger.warn('⚠️ 内存中无用户数据，无需迁移');
      process.exit(0);
    }

    // 3. 确认迁移
    console.log(`\n📊 待迁移数据统计：`);
    console.log(`  - 用户: ${backupData.stats.usersCount}`);
    console.log(`  - 交易账户: ${backupData.stats.accountsCount}`);
    console.log(`  - 交易记录: ${backupData.stats.recordsCount}\n`);

    const confirmed = await askConfirmation('确认开始迁移？');
    if (!confirmed) {
      logger.info('❌ 用户取消迁移');
      process.exit(0);
    }

    // 4. 连接 MongoDB
    await connectMongoDB();

    // 5. 清空现有数据（可选）
    const clearExisting = await askConfirmation('是否清空 MongoDB 中的现有数据？');
    if (clearExisting) {
      await clearCollections();
    }

    // 6. 导入数据
    const userIdMap = await importUsers(backupData.users);
    await importTradingAccounts(backupData.tradingAccounts, userIdMap);
    await importTradingRecords(backupData.tradingRecords, userIdMap);

    // 7. 验证数据
    const success = await verifyMigration(backupData);

    // 8. 完成
    if (success) {
      console.log(`
╔════════════════════════════════════════════╗
║   ✅ 数据迁移成功！                       ║
╚════════════════════════════════════════════╝

下一步：
1. 修改 src/models/*.js 使用 Mongoose 模型
2. 更新 .env 设置 MONGODB_URI
3. 重启应用测试功能
4. 确认无误后删除内存存储代码

备份文件保存在: ${BACKUP_DIR}
      `);
    } else {
      console.log(`
╔════════════════════════════════════════════╗
║   ⚠️ 数据迁移存在差异                     ║
╚════════════════════════════════════════════╝

请检查日志，确认原因后重新迁移。
备份文件保存在: ${BACKUP_DIR}
      `);
    }
  } catch (error) {
    logger.error('❌ 迁移失败:', error);
    console.error('\n错误详情:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// 运行主流程
if (require.main === module) {
  main().catch((error) => {
    console.error('未捕获的错误:', error);
    process.exit(1);
  });
}

module.exports = {
  exportMemoryData,
  connectMongoDB,
  importUsers,
  importTradingAccounts,
  importTradingRecords,
  verifyMigration,
};
