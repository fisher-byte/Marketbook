/**
 * SEO优化配置文件 - MarketBook平台
 * 包含结构化数据、元标签配置和性能优化设置
 */

module.exports = {
    // 基础SEO配置
    base: {
        siteName: 'MarketBook',
        siteDescription: 'AI智能交易论坛与模拟盘平台，专业交易学习社区',
        baseUrl: 'https://marketbook.example.com',
        defaultLanguage: 'zh-CN',
        supportedLanguages: ['zh-CN', 'en-US'],
        
        // 社交媒体配置
        social: {
            twitter: '@marketbook',
            facebook: 'marketbook',
            linkedin: 'company/marketbook',
            github: 'marketbook'
        }
    },
    
    // 结构化数据配置
    structuredData: {
        // FAQ页面结构化数据
        faq: {
            enabled: true,
            autoGenerate: true,
            maxQuestions: 10,
            categories: [
                '交易基础',
                '模拟盘使用',
                '风险控制',
                '策略分析',
                '账户管理'
            ]
        },
        
        // 面包屑导航结构化数据
        breadcrumb: {
            enabled: true,
            showCurrentPage: true,
            includeHome: true
        },
        
        // 本地企业信息结构化数据
        localBusiness: {
            enabled: true,
            businessType: 'FinancialService',
            address: {
                street: '金融科技园区',
                city: '深圳',
                region: '广东',
                postalCode: '518000',
                country: 'CN'
            },
            contact: {
                phone: '+86-400-123-4567',
                email: 'support@marketbook.example.com'
            },
            openingHours: 'Mo-Fr 09:00-18:00'
        },
        
        // 产品/服务结构化数据
        product: {
            enabled: true,
            categories: [
                {
                    name: '模拟交易平台',
                    description: '虚拟交易环境，零风险学习交易技能',
                    price: '0',
                    priceCurrency: 'CNY',
                    category: '金融教育工具'
                },
                {
                    name: 'AI策略分析',
                    description: '智能交易策略分析和风险预警',
                    price: '0',
                    priceCurrency: 'CNY',
                    category: '数据分析服务'
                }
            ]
        }
    },
    
    // 元标签配置
    metaTags: {
        // 通用页面元标签
        default: {
            title: 'MarketBook - AI智能交易论坛与模拟盘平台',
            description: '领先的AI驱动交易平台，提供实时模拟盘交易、智能策略分析和专业交易社区',
            keywords: 'AI交易论坛,模拟盘交易平台,股票交易学习,投资策略分析,交易社区',
            robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        },
        
        // 特定页面配置
        pages: {
            forum: {
                title: '交易论坛 - MarketBook AI智能交易社区',
                description: 'AI驱动的专业交易讨论社区，实时热点分析，智能内容推荐',
                keywords: '交易论坛,股票讨论,投资交流,交易策略分享,市场分析'
            },
            simulation: {
                title: '模拟盘交易 - MarketBook 零风险交易学习平台',
                description: '实时模拟盘交易环境，支持多种资产类别，AI风险监控，专业交易学习工具',
                keywords: '模拟盘交易,虚拟交易,交易学习,风险控制,实时行情'
            },
            strategies: {
                title: '策略分析 - MarketBook AI智能交易策略平台',
                description: 'AI分析交易策略，成功率评估，风险预警，个性化投资建议',
                keywords: '交易策略,投资分析,AI分析,风险预警,策略回测'
            }
        }
    },
    
    // 性能优化配置
    performance: {
        // 预加载关键资源
        preload: [
            '/src/public/css/main.css',
            '/src/public/css/auth.css',
            '/src/public/fonts/iconfont.woff2'
        ],
        
        // 预连接外部域名
        preconnect: [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdnjs.cloudflare.com'
        ],
        
        // 延迟加载非关键资源
        lazyLoad: [
            '/src/public/js/analytics.js',
            '/src/public/js/chat-widget.js'
        ],
        
        // 缓存策略
        cache: {
            staticAssets: 'public, max-age=31536000, immutable',
            htmlPages: 'public, max-age=3600',
            apiResponses: 'private, max-age=300'
        }
    },
    
    // 搜索引擎提交配置
    searchEngines: {
        // Google Search Console
        google: {
            siteVerification: 'your-google-verification-code',
            sitemapUrl: '/sitemap.xml'
        },
        
        // Bing Webmaster Tools
        bing: {
            siteVerification: 'your-bing-verification-code',
            sitemapUrl: '/sitemap.xml'
        },
        
        // 百度站长平台
        baidu: {
            siteVerification: 'your-baidu-verification-code',
            sitemapUrl: '/sitemap.xml'
        }
    },
    
    // 社交媒体优化
    socialMedia: {
        openGraph: {
            defaultImage: '/images/og-image-1200x630.jpg',
            imageWidth: 1200,
            imageHeight: 630,
            imageAlt: 'MarketBook AI交易平台界面预览'
        },
        
        twitter: {
            cardType: 'summary_large_image',
            siteHandle: '@marketbook',
            creatorHandle: '@marketbook'
        }
    },
    
    // 国际化SEO配置
    internationalization: {
        hreflang: {
            'zh-CN': 'https://marketbook.example.com',
            'en-US': 'https://marketbook.example.com/en',
            'zh-HK': 'https://marketbook.example.com/hk',
            'zh-TW': 'https://marketbook.example.com/tw'
        },
        
        alternateUrls: {
            canonical: 'https://marketbook.example.com',
            mobile: 'https://m.marketbook.example.com',
            amp: 'https://marketbook.example.com/amp'
        }
    },
    
    // 分析工具配置
    analytics: {
        googleAnalytics: 'GA-XXXXXXXXX-X',
        googleTagManager: 'GTM-XXXXXXX',
        baiduTongji: 'your-baidu-tongji-id',
        microsoftClarity: 'your-clarity-project-id'
    }
};