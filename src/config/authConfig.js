/**
 * 认证配置常量
 * 集中管理JWT、密码策略等配置
 */

module.exports = {
    // JWT配置
    jwt: {
        secret: process.env.JWT_SECRET || 'marketbook-secret-key',
        expiresIn: '24h',
        issuer: 'marketbook-platform',
        audience: 'marketbook-users'
    },
    
    // 密码策略
    password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: false,
        saltRounds: 10
    },
    
    // 会话管理
    session: {
        maxLoginAttempts: 5,
        lockoutDuration: 30 * 60 * 1000, // 30分钟
        sessionTimeout: 24 * 60 * 60 * 1000 // 24小时
    },
    
    // 安全配置
    security: {
        requireEmailVerification: false, // 是否要求邮箱验证
        requireTwoFactorAuth: false, // 是否要求双因素认证
        passwordResetExpiry: 1 * 60 * 60 * 1000 // 密码重置链接有效期1小时
    }
};