/**
 * 性能监控工具 - MarketBook 平台
 * 用于监控用户界面性能、交易执行效率和系统响应时间
 * 
 * @version 1.0.0
 * @author MarketBook Team
 * @description 前端性能监控和优化工具
 */

class PerformanceMonitor {
    constructor(componentName = 'Unknown') {
        this.componentName = componentName;
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            interactionTime: 0,
            apiResponseTime: 0,
            memoryUsage: 0
        };
        
        this.timers = new Map();
        this.history = [];
        this.maxHistorySize = 100;
        
        // 性能阈值配置
        this.thresholds = {
            loadTime: 3000, // 3秒
            renderTime: 1000, // 1秒
            apiResponseTime: 2000, // 2秒
            memoryUsage: 50 // 50MB
        };
        
        this.init();
    }
    
    /**
     * 初始化性能监控
     */
    init() {
        console.log(`性能监控已启动 - 组件: ${this.componentName}`);
        
        // 监听页面性能
        if (typeof window !== 'undefined' && window.performance) {
            this.setupPerformanceObserver();
        }
        
        // 定期报告性能数据
        this.startPeriodicReporting();
    }
    
    /**
     * 设置性能观察器
     */
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                // 监控长任务
                const longTaskObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.duration > 50) { // 超过50ms的任务
                            this.recordLongTask(entry);
                        }
                    });
                });
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                
                // 监控布局偏移
                const layoutShiftObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.hadRecentInput === false) {
                            this.recordLayoutShift(entry);
                        }
                    });
                });
                layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
                
            } catch (error) {
                console.warn('性能观察器初始化失败:', error);
            }
        }
    }
    
    /**
     * 开始定时性能报告
     */
    startPeriodicReporting() {
        setInterval(() => {
            this.reportPerformance();
        }, 30000); // 每30秒报告一次
    }
    
    /**
     * 开始计时
     * @param {string} timerName 计时器名称
     */
    startTimer(timerName) {
        this.timers.set(timerName, {
            startTime: performance.now(),
            endTime: null,
            duration: null
        });
    }
    
    /**
     * 结束计时
     * @param {string} timerName 计时器名称
     * @returns {number} 耗时（毫秒）
     */
    endTimer(timerName) {
        const timer = this.timers.get(timerName);
        if (!timer) return 0;
        
        timer.endTime = performance.now();
        timer.duration = timer.endTime - timer.startTime;
        
        // 记录到指标
        this.recordMetric(timerName, timer.duration);
        
        return timer.duration;
    }
    
    /**
     * 记录性能指标
     * @param {string} metricName 指标名称
     * @param {number} value 指标值
     */
    recordMetric(metricName, value) {
        this.metrics[metricName] = value;
        
        // 添加到历史记录
        this.history.push({
            timestamp: new Date(),
            metric: metricName,
            value: value,
            component: this.componentName
        });
        
        // 限制历史记录大小
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(-this.maxHistorySize);
        }
        
        // 检查阈值
        this.checkThreshold(metricName, value);
    }
    
    /**
     * 检查性能阈值
     * @param {string} metricName 指标名称
     * @param {number} value 指标值
     */
    checkThreshold(metricName, value) {
        const threshold = this.thresholds[metricName];
        if (threshold && value > threshold) {
            this.triggerAlert(metricName, value, threshold);
        }
    }
    
    /**
     * 触发性能告警
     * @param {string} metricName 指标名称
     * @param {number} value 当前值
     * @param {number} threshold 阈值
     */
    triggerAlert(metricName, value, threshold) {
        console.warn(`性能告警 [${this.componentName}]: ${metricName} = ${value}ms (阈值: ${threshold}ms)`);
        
        // 发送性能告警到监控系统
        this.sendAlertToMonitoring({
            type: 'performance_alert',
            component: this.componentName,
            metric: metricName,
            value: value,
            threshold: threshold,
            timestamp: new Date()
        });
    }
    
    /**
     * 记录长任务
     * @param {object} entry 性能条目
     */
    recordLongTask(entry) {
        this.recordMetric('longTaskDuration', entry.duration);
        
        console.log(`检测到长任务: ${entry.duration}ms`, {
            name: entry.name,
            component: this.componentName
        });
    }
    
    /**
     * 记录布局偏移
     * @param {object} entry 布局偏移条目
     */
    recordLayoutShift(entry) {
        this.recordMetric('layoutShift', entry.value);
        
        if (entry.value > 0.1) { // 明显的布局偏移
            console.warn(`检测到布局偏移: ${entry.value}`, {
                component: this.componentName
            });
        }
    }
    
    /**
     * 监控API响应时间
     * @param {string} apiName API名称
     * @param {number} responseTime 响应时间
     */
    monitorApiResponse(apiName, responseTime) {
        this.recordMetric(`api_${apiName}`, responseTime);
        
        if (responseTime > this.thresholds.apiResponseTime) {
            console.warn(`API响应缓慢: ${apiName} - ${responseTime}ms`);
        }
    }
    
    /**
     * 获取性能报告
     * @returns {object} 性能报告
     */
    getPerformanceReport() {
        const avgLoadTime = this.calculateAverage('loadTime');
        const avgRenderTime = this.calculateAverage('renderTime');
        const avgApiTime = this.calculateAverage('apiResponseTime');
        
        return {
            component: this.componentName,
            timestamp: new Date(),
            metrics: {
                ...this.metrics,
                averageLoadTime: avgLoadTime,
                averageRenderTime: avgRenderTime,
                averageApiResponseTime: avgApiTime
            },
            thresholds: this.thresholds,
            recommendations: this.generateRecommendations()
        };
    }
    
    /**
     * 计算平均值
     * @param {string} metricName 指标名称
     * @returns {number} 平均值
     */
    calculateAverage(metricName) {
        const values = this.history
            .filter(entry => entry.metric === metricName)
            .map(entry => entry.value);
        
        if (values.length === 0) return 0;
        
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }
    
    /**
     * 生成性能优化建议
     * @returns {string[]} 优化建议
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.metrics.loadTime > this.thresholds.loadTime) {
            recommendations.push('页面加载时间过长，建议优化资源加载和代码分割');
        }
        
        if (this.metrics.renderTime > this.thresholds.renderTime) {
            recommendations.push('渲染性能需要优化，建议减少DOM操作和使用虚拟滚动');
        }
        
        if (this.metrics.apiResponseTime > this.thresholds.apiResponseTime) {
            recommendations.push('API响应时间过长，建议优化后端服务和网络请求');
        }
        
        if (this.metrics.memoryUsage > this.thresholds.memoryUsage) {
            recommendations.push('内存使用过高，建议检查内存泄漏和优化数据结构');
        }
        
        return recommendations.length > 0 ? recommendations : ['性能表现良好，继续保持'];
    }
    
    /**
     * 报告性能数据
     */
    reportPerformance() {
        const report = this.getPerformanceReport();
        
        // 发送到性能监控系统
        this.sendToAnalytics(report);
        
        // 控制台输出摘要
        console.log(`性能报告 [${this.componentName}]:`, {
            loadTime: report.metrics.loadTime,
            renderTime: report.metrics.renderTime,
            apiResponseTime: report.metrics.apiResponseTime,
            recommendations: report.recommendations.length
        });
    }
    
    /**
     * 发送告警到监控系统
     * @param {object} alertData 告警数据
     */
    sendAlertToMonitoring(alertData) {
        // 实际项目中这里会发送到监控系统
        console.log('发送性能告警:', alertData);
    }
    
    /**
     * 发送数据到分析系统
     * @param {object} report 性能报告
     */
    sendToAnalytics(report) {
        // 实际项目中这里会发送到分析系统
        console.log('发送性能分析数据:', report);
    }
    
    /**
     * 清理资源
     */
    destroy() {
        this.timers.clear();
        this.history = [];
        console.log(`性能监控已停止 - 组件: ${this.componentName}`);
    }
}

module.exports = PerformanceMonitor;