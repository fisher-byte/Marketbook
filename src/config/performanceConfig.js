/**
 * 性能监控配置 - MarketBook平台
 * 优化用户系统的性能监控和错误处理机制
 * 
 * @version 1.0.0
 * @author MarketBook Team
 */

module.exports = {
    // 性能监控配置
    performance: {
        // 缓存配置
        cache: {
            userInfoTTL: 300000, // 5分钟
            statsTTL: 60000,    // 1分钟
            maxCacheSize: 1000,  // 最大缓存条目数
            cleanupInterval: 300000 // 5分钟清理一次
        },
        
        // 监控阈值
        thresholds: {
            slowQueryThreshold: 100, // 慢查询阈值（毫秒）
            highMemoryUsage: 0.8,   // 内存使用率阈值（80%）
            errorRateThreshold: 0.05 // 错误率阈值（5%）
        },
        
        // 采样率配置
        sampling: {
            performanceMetrics: 0.1,  // 性能指标采样率（10%）
            errorTracking: 1.0,      // 错误跟踪采样率（100%）
            userBehavior: 0.05       // 用户行为采样率（5%）
        }
    },
    
    // 错误处理配置
    errorHandling: {
        // 错误分类
        errorTypes: {
            validation: {
                maxRetries: 1,
                retryDelay: 0
            },
            network: {
                maxRetries: 3,
                retryDelay: 1000
            },
            database: {
                maxRetries: 2,
                retryDelay: 2000
            },
            external: {
                maxRetries: 1,
                retryDelay: 500
            }
        },
        
        // 错误报告配置
        reporting: {
            enabled: true,
            level: 'warn', // error, warn, info, debug
            includeStack: true,
            maxErrorLength: 1000
        }
    },
    
    // 用户系统性能优化配置
    userSystem: {
        // 批量操作配置
        batchOperations: {
            maxBatchSize: 100,
            timeout: 30000,
            concurrency: 5
        },
        
        // 懒加载配置
        lazyLoading: {
            enabled: true,
            chunkSize: 50,
            prefetchThreshold: 0.7
        },
        
        // 预加载配置
        preloading: {
            enabled: true,
            strategies: ['recent', 'frequent', 'important'],
            maxPreloadCount: 20
        }
    },
    
    // 监控指标配置
    metrics: {
        // 性能指标
        performance: [
            'responseTime',
            'throughput',
            'errorRate',
            'cacheHitRate',
            'memoryUsage'
        ],
        
        // 业务指标
        business: [
            'userActivity',
            'tradingVolume',
            'contentCreation',
            'engagementRate'
        ],
        
        // 系统指标
        system: [
            'cpuUsage',
            'memoryUsage',
            'diskUsage',
            'networkLatency'
        ]
    }
};