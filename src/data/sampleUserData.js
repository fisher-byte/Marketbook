/**
 * 示例用户数据 - 用于演示UserDashboard组件
 * 包含完整的用户信息和交易统计数据
 */

const sampleUserData = {
  // 基础用户信息
  user: {
    id: 'user_001',
    username: 'trader_john',
    email: 'john.trader@example.com',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-02-06T14:30:00Z',
    lastLoginAt: '2026-02-06T14:30:00Z',
    isActive: true,
    emailVerified: true,
    failedLoginAttempts: 0,
    lockedUntil: null
  },

  // 用户资料信息
  profile: {
    userId: 'user_001',
    displayName: '交易者约翰',
    avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNDVCN0QxIi8+CiAgICA8dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRKPC90ZXh0Pgo8L3N2Zz4=',
    bio: '专注于量化交易和AI策略开发，拥有5年交易经验。喜欢分享交易心得，帮助新手成长。',
    location: '上海',
    website: 'https://traderjohn.blog.com',
    socialLinks: {
      twitter: 'https://twitter.com/traderjohn',
      linkedin: 'https://linkedin.com/in/traderjohn',
      github: 'https://github.com/traderjohn',
      wechat: 'trader_john_2026'
    },
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'zh-CN',
      emailUpdates: true,
      privacyLevel: 'friends'
    },
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-02-06T14:30:00Z'
  },

  // 交易统计数据
  tradingStats: {
    totalTrades: 156,
    successfulTrades: 98,
    totalProfit: 12500.50,
    winRate: 62.8,
    averageTradeValue: 80.13,
    riskExposure: 'medium',
    tradingExperience: 'advanced',
    portfolioDiversity: 'high',
    strategyEffectiveness: 'good',
    assetTypes: ['股票', '期货', '外汇', '加密货币'],
    recentPerformance: [
      { date: '2026-02-01', profit: 350.25 },
      { date: '2026-02-02', profit: -120.50 },
      { date: '2026-02-03', profit: 280.75 },
      { date: '2026-02-04', profit: 450.00 },
      { date: '2026-02-05', profit: 320.25 }
    ]
  },

  // 账户统计信息
  accountStats: {
    accountAgeDays: 23,
    isRecentlyCreated: false,
    hasRecentActivity: true,
    lastLoginDays: 0,
    securityStatus: 'normal',
    activityLevel: 'very_active',
    accountHealth: 95,
    loginFrequency: 'daily',
    accountStrength: 85,
    riskLevel: 'none'
  },

  // 资料统计信息
  profileStats: {
    completeness: 90,
    hasAvatar: true,
    hasBio: true,
    hasSocialLinks: true,
    profileAgeDays: 23,
    updateFrequency: 'frequent',
    socialConnectivity: 75,
    qualityRating: 'excellent'
  }
};

// 新用户示例数据（用于对比）
const newUserData = {
  user: {
    id: 'user_002',
    username: 'new_trader',
    email: 'new.trader@example.com',
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-02-05T10:00:00Z',
    lastLoginAt: '2026-02-05T10:00:00Z',
    isActive: true,
    emailVerified: false,
    failedLoginAttempts: 0,
    lockedUntil: null
  },
  profile: {
    userId: 'user_002',
    displayName: '',
    avatar: null,
    bio: '',
    location: '',
    website: '',
    socialLinks: {
      twitter: '',
      linkedin: '',
      github: '',
      wechat: ''
    },
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'zh-CN',
      emailUpdates: false,
      privacyLevel: 'public'
    },
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-02-05T10:00:00Z'
  },
  tradingStats: {
    totalTrades: 0,
    successfulTrades: 0,
    totalProfit: 0,
    winRate: 0,
    averageTradeValue: 0,
    riskExposure: 'low',
    tradingExperience: 'novice',
    portfolioDiversity: 'low',
    strategyEffectiveness: 'needs_improvement',
    assetTypes: [],
    recentPerformance: []
  },
  accountStats: {
    accountAgeDays: 2,
    isRecentlyCreated: true,
    hasRecentActivity: true,
    lastLoginDays: 2,
    securityStatus: 'warning',
    activityLevel: 'active',
    accountHealth: 70,
    loginFrequency: 'daily',
    accountStrength: 60,
    riskLevel: 'low'
  },
  profileStats: {
    completeness: 0,
    hasAvatar: false,
    hasBio: false,
    hasSocialLinks: false,
    profileAgeDays: 2,
    updateFrequency: 'rare',
    socialConnectivity: 0,
    qualityRating: 'poor'
  }
};

module.exports = {
  sampleUserData,
  newUserData
};