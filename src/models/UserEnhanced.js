/**
 * MarketBook - 增强版用户模型
 * 包含完整的用户认证和个人资料管理功能
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // 基础信息
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/ // 只允许字母、数字、下划线
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // 默认不返回密码字段
  },
  
  // 个人资料信息
  profile: {
    displayName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    
    avatar: {
      type: String,
      default: '/images/default-avatar.png'
    },
    
    bio: {
      type: String,
      maxlength: 500
    },
    
    location: String,
    
    tradingExperience: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'professional'],
      default: 'beginner'
    },
    
    preferredMarkets: [{
      type: String,
      enum: ['stocks', 'forex', 'crypto', 'futures', 'options']
    }],
    
    riskTolerance: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate'
    }
  },
  
  // 账户状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned'],
    default: 'active'
  },
  
  // 认证相关
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // 安全相关
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // 统计信息
  stats: {
    postsCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    simulationTrades: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 }
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // 移除敏感信息
      delete ret.password;
      delete ret.verificationToken;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      delete ret.lockUntil;
      delete ret.loginAttempts;
      return ret;
    }
  }
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// JWT令牌生成
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      userId: this._id,
      username: this.username,
      email: this.email 
    },
    process.env.JWT_SECRET || 'marketbook-secret-key',
    { expiresIn: '24h' }
  );
};

// 检查账户是否被锁定
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// 增加登录尝试次数
userSchema.methods.incrementLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.update({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 锁定2小时
  }
  
  return this.update(updates);
};

// 重置登录尝试次数
userSchema.methods.resetLoginAttempts = function() {
  return this.update({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// 静态方法：通过邮箱查找用户（包含密码）
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email }).select('+password');
};

// 静态方法：通过用户名查找用户（包含密码）
userSchema.statics.findByUsernameWithPassword = function(username) {
  return this.findOne({ username }).select('+password');
};

// 虚拟字段：用户等级
userSchema.virtual('userLevel').get(function() {
  const score = this.stats.postsCount + this.stats.commentsCount * 0.5 + this.stats.simulationTrades * 0.3;
  if (score >= 1000) return 'expert';
  if (score >= 500) return 'advanced';
  if (score >= 100) return 'intermediate';
  return 'beginner';
});

// 索引优化
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'stats.totalProfit': -1 });

module.exports = mongoose.model('UserEnhanced', userSchema);