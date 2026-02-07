/**
 * 注册流程配置 - MarketBook 平台
 * 定义用户注册过程中的步骤、验证规则和引导内容
 */

module.exports = {
    // 注册流程步骤配置
    registrationSteps: [
        {
            id: 'basic_info',
            name: '基本信息',
            description: '填写用户名、邮箱和密码',
            required: true,
            fields: ['username', 'email', 'password'],
            validators: {
                username: {
                    minLength: 3,
                    maxLength: 20,
                    pattern: /^[a-zA-Z0-9_]+$/,
                    message: '用户名必须为3-20位字母、数字或下划线'
                },
                email: {
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: '请输入有效的邮箱地址'
                },
                password: {
                    minLength: 8,
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
                    message: '密码必须包含大小写字母、数字和特殊字符，至少8位'
                }
            }
        },
        {
            id: 'profile_setup',
            name: '个人资料',
            description: '完善您的个人资料信息',
            required: false,
            fields: ['displayName', 'avatar', 'bio', 'investmentExperience'],
            validators: {
                displayName: {
                    minLength: 2,
                    maxLength: 30,
                    message: '昵称应为2-30个字符'
                },
                bio: {
                    maxLength: 200,
                    message: '个人简介不超过200字'
                }
            }
        },
        {
            id: 'trading_preferences',
            name: '交易偏好',
            description: '设置您的交易偏好和风险承受能力',
            required: false,
            fields: ['riskTolerance', 'investmentGoals', 'preferredAssets', 'tradingFrequency'],
            validators: {
                riskTolerance: {
                    options: ['conservative', 'moderate', 'aggressive'],
                    message: '请选择风险承受能力'
                }
            }
        },
        {
            id: 'email_verification',
            name: '邮箱验证',
            description: '验证您的邮箱地址',
            required: true,
            fields: ['verificationCode'],
            validators: {
                verificationCode: {
                    length: 6,
                    pattern: /^\d{6}$/,
                    message: '请输入6位验证码'
                }
            }
        }
    ],

    // 注册引导内容配置
    onboardingContent: {
        welcome: {
            title: '欢迎来到 MarketBook',
            description: 'AI驱动的交易论坛与模拟盘平台',
            features: [
                '智能交易论坛讨论',
                '零风险模拟盘交易',
                '专业策略分析工具',
                '活跃的交易社区'
            ]
        },
        
        stepTips: {
            basic_info: {
                title: '创建您的账户',
                tips: [
                    '用户名将作为您在社区的标识',
                    '请使用真实邮箱以便接收重要通知',
                    '设置强密码保护账户安全'
                ]
            },
            profile_setup: {
                title: '完善个人资料',
                tips: [
                    '上传头像让其他用户认识您',
                    '分享您的投资经验有助于获得更精准的建议',
                    '个人简介可以展示您的交易风格'
                ]
            },
            trading_preferences: {
                title: '设置交易偏好',
                tips: [
                    '根据您的风险承受能力选择投资策略',
                    '明确投资目标有助于制定合适的计划',
                    '选择您感兴趣的资产类别'
                ]
            }
        },
        
        completion: {
            title: '注册完成！',
            description: '恭喜您成功加入 MarketBook 社区',
            nextSteps: [
                '探索交易论坛，了解最新市场动态',
                '开始您的第一个模拟盘交易',
                '关注您感兴趣的交易策略',
                '参与社区讨论，分享您的见解'
            ]
        }
    },

    // 注册流程性能配置
    performance: {
        // 步骤完成超时时间（分钟）
        stepTimeout: 30,
        // 总注册超时时间（小时）
        totalTimeout: 24,
        // 验证码有效期（分钟）
        verificationCodeExpiry: 10,
        // 最大重试次数
        maxRetries: 3
    },

    // 安全配置
    security: {
        // 密码加密强度
        passwordSaltRounds: 12,
        // 会话超时时间（小时）
        sessionTimeout: 24,
        // 登录尝试限制
        maxLoginAttempts: 5,
        // 账户锁定时间（分钟）
        lockDuration: 30
    },

    // 用户体验配置
    userExperience: {
        // 是否启用进度条
        showProgressBar: true,
        // 是否显示步骤提示
        showStepTips: true,
        // 是否启用自动保存
        autoSave: true,
        // 自动保存间隔（秒）
        autoSaveInterval: 30,
        // 是否启用实时验证
        realTimeValidation: true
    }
};