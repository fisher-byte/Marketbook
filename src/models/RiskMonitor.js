/**
 * 实时风险监控器 - MarketBook 模拟盘平台
 * 增强交易引擎的风险监控能力，提供实时预警和智能风控
 * 
 * @version 1.0.0
 * @author MarketBook Team
 * @description 实时风险监控，支持多维度风险指标和预警机制
 */

class RiskMonitor {
    constructor(tradingEngine) {
        this.tradingEngine = tradingEngine;
        this.riskThresholds = {
            // 基础风险阈值
            maxDrawdown: 0.15, // 最大回撤15%
            volatilityLimit: 0.12, // 波动率限制12%
            concentrationLimit: 0.3, // 单一持仓集中度30%
            leverageLimit: 3.0, // 杠杆限制3倍
            dailyLossLimit: 0.05, // 单日亏损限制5%
            
            // 新增智能阈值
            correlationThreshold: 0.8, // 相关性阈值
            sectorConcentration: 0.4, // 行业集中度
            momentumRisk: 0.2, // 动量风险
            liquidityRisk: 0.1, // 流动性风险
        };
        
        this.alerts = [];
        this.monitoringInterval = null;
        this.isMonitoring = false;
        
        // 风险指标缓存
        this.riskMetrics = {
            currentDrawdown: 0,
            volatility: 0,
            concentration: 0,
            correlation: 0,
            momentum: 0,
            liquidity: 0,
            overallRiskScore: 0
        };
    }

    // ==================== 核心监控方法 ====================

    /**
     * 启动实时监控
     */
    startMonitoring(intervalMs = 30000) {
        if (this.isMonitoring) {
            console.warn('风险监控已启动');
            return;
        }
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.performRiskAssessment();
        }, intervalMs);
        
        console.log(`风险监控已启动，检查间隔: ${intervalMs}ms`);
    }

    /**
     * 停止监控
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        console.log('风险监控已停止');
    }

    /**
     * 执行全面风险评估
     */
    performRiskAssessment() {
        try {
            // 计算各项风险指标
            this.calculateRiskMetrics();
            
            // 检查风险阈值
            this.checkRiskThresholds();
            
            // 生成风险评估报告
            const report = this.generateRiskReport();
            
            // 触发预警（如果需要）
            if (report.riskLevel !== 'low') {
                this.triggerAlerts(report);
            }
            
            return report;
        } catch (error) {
            console.error('风险评估执行失败:', error);
            return this.generateErrorReport(error);
        }
    }

    // ==================== 风险指标计算 ====================

    /**
     * 计算所有风险指标
     */
    calculateRiskMetrics() {
        const portfolio = this.tradingEngine.getPortfolioOverview();
        
        // 计算当前回撤
        this.riskMetrics.currentDrawdown = this.calculateCurrentDrawdown(portfolio);
        
        // 计算波动率
        this.riskMetrics.volatility = this.calculatePortfolioVolatility();
        
        // 计算持仓集中度
        this.riskMetrics.concentration = this.calculateConcentration(portfolio);
        
        // 计算相关性风险
        this.riskMetrics.correlation = this.calculateCorrelationRisk();
        
        // 计算动量风险
        this.riskMetrics.momentum = this.calculateMomentumRisk();
        
        // 计算流动性风险
        this.riskMetrics.liquidity = this.calculateLiquidityRisk();
        
        // 计算综合风险评分
        this.riskMetrics.overallRiskScore = this.calculateOverallRiskScore();
    }

    /**
     * 计算当前回撤
     */
    calculateCurrentDrawdown(portfolio) {
        const peakValue = Math.max(
            this.tradingEngine.initialCapital,
            ...this.tradingEngine.transactionHistory.map(tx => tx.amount)
        );
        
        const currentValue = portfolio.totalValue || this.tradingEngine.currentCapital;
        return (peakValue - currentValue) / peakValue;
    }

    /**
     * 计算组合波动率
     */
    calculatePortfolioVolatility() {
        const returns = [];
        const transactions = this.tradingEngine.transactionHistory;
        
        for (let i = 1; i < transactions.length; i++) {
            const prevValue = transactions[i-1].amount;
            const currValue = transactions[i].amount;
            if (prevValue > 0) {
                returns.push((currValue - prevValue) / prevValue);
            }
        }
        
        if (returns.length === 0) return 0;
        
        const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        
        return Math.sqrt(variance);
    }

    /**
     * 计算持仓集中度
     */
    calculateConcentration(portfolio) {
        if (!portfolio.positions || portfolio.positions.length === 0) return 0;
        
        const positions = portfolio.positions;
        const totalValue = portfolio.totalValue || this.tradingEngine.currentCapital;
        
        if (totalValue === 0) return 0;
        
        // 计算最大持仓占比
        const maxPositionValue = Math.max(...positions.map(pos => pos.currentValue || 0));
        return maxPositionValue / totalValue;
    }

    /**
     * 计算相关性风险（简化版）
     */
    calculateCorrelationRisk() {
        // 简化实现：基于持仓品种数量评估分散度
        const portfolio = this.tradingEngine.getPortfolioOverview();
        const positionCount = portfolio.positions ? portfolio.positions.length : 0;
        
        if (positionCount <= 1) return 1.0; // 高度集中
        if (positionCount <= 3) return 0.7; // 中等集中
        if (positionCount <= 5) return 0.4; // 适度分散
        return 0.2; // 良好分散
    }

    /**
     * 计算动量风险
     */
    calculateMomentumRisk() {
        const recentTrades = this.tradingEngine.orderHistory
            .filter(order => order.status === 'executed')
            .slice(-10);
        
        if (recentTrades.length < 3) return 0;
        
        // 计算交易频率指标
        const tradeFrequency = recentTrades.length / 10; // 最近10笔交易
        return Math.min(tradeFrequency * 0.5, 1.0);
    }

    /**
     * 计算流动性风险
     */
    calculateLiquidityRisk() {
        const portfolio = this.tradingEngine.getPortfolioOverview();
        const cashRatio = this.tradingEngine.currentCapital / portfolio.totalValue;
        
        // 现金比例越低，流动性风险越高
        return Math.max(0, 1 - cashRatio * 2);
    }

    /**
     * 计算综合风险评分
     */
    calculateOverallRiskScore() {
        const weights = {
            drawdown: 0.25,
            volatility: 0.20,
            concentration: 0.20,
            correlation: 0.15,
            momentum: 0.10,
            liquidity: 0.10
        };
        
        let score = 0;
        score += this.riskMetrics.currentDrawdown / this.riskThresholds.maxDrawdown * weights.drawdown;
        score += this.riskMetrics.volatility / this.riskThresholds.volatilityLimit * weights.volatility;
        score += this.riskMetrics.concentration / this.riskThresholds.concentrationLimit * weights.concentration;
        score += this.riskMetrics.correlation / this.riskThresholds.correlationThreshold * weights.correlation;
        score += this.riskMetrics.momentum / this.riskThresholds.momentumRisk * weights.momentum;
        score += this.riskMetrics.liquidity / this.riskThresholds.liquidityRisk * weights.liquidity;
        
        return Math.min(score, 1.0);
    }

    // ==================== 风险阈值检查 ====================

    /**
     * 检查风险阈值
     */
    checkRiskThresholds() {
        const newAlerts = [];
        
        // 检查回撤风险
        if (this.riskMetrics.currentDrawdown > this.riskThresholds.maxDrawdown) {
            newAlerts.push({
                level: 'high',
                type: 'drawdown',
                message: `回撤超过阈值: ${(this.riskMetrics.currentDrawdown * 100).toFixed(1)}% > ${(this.riskThresholds.maxDrawdown * 100).toFixed(1)}%`,
                suggestion: '考虑减仓或设置止损'
            });
        }
        
        // 检查波动率风险
        if (this.riskMetrics.volatility > this.riskThresholds.volatilityLimit) {
            newAlerts.push({
                level: 'medium',
                type: 'volatility',
                message: `波动率过高: ${(this.riskMetrics.volatility * 100).toFixed(1)}% > ${(this.riskThresholds.volatilityLimit * 100).toFixed(1)}%`,
                suggestion: '降低交易频率或减小仓位'
            });
        }
        
        // 检查集中度风险
        if (this.riskMetrics.concentration > this.riskThresholds.concentrationLimit) {
            newAlerts.push({
                level: 'medium',
                type: 'concentration',
                message: `持仓集中度过高: ${(this.riskMetrics.concentration * 100).toFixed(1)}% > ${(this.riskThresholds.concentrationLimit * 100).toFixed(1)}%`,
                suggestion: '分散投资到不同品种'
            });
        }
        
        // 检查相关性风险
        if (this.riskMetrics.correlation > this.riskThresholds.correlationThreshold) {
            newAlerts.push({
                level: 'low',
                type: 'correlation',
                message: '投资组合相关性较高，分散效果有限',
                suggestion: '增加不同资产类别的配置'
            });
        }
        
        // 更新警报列表
        this.alerts = [...newAlerts, ...this.alerts].slice(0, 20); // 保留最近20条
    }

    // ==================== 预警和报告 ====================

    /**
     * 触发风险预警
     */
    triggerAlerts(report) {
        const highRiskAlerts = this.alerts.filter(alert => alert.level === 'high');
        
        if (highRiskAlerts.length > 0) {
            console.warn('🚨 高风险预警触发:', highRiskAlerts.map(a => a.message).join('; '));
            
            // 在实际应用中，这里可以发送邮件、短信或推送通知
            this.sendRiskNotification(highRiskAlerts, report);
        }
    }

    /**
     * 发送风险通知（模拟实现）
     */
    sendRiskNotification(alerts, report) {
        // 模拟发送通知到前端或外部系统
        const notification = {
            timestamp: new Date(),
            userId: this.tradingEngine.userId,
            riskLevel: report.riskLevel,
            alerts: alerts,
            riskScore: report.riskScore,
            recommendations: report.recommendations
        };
        
        console.log('风险通知已发送:', notification);
        
        // 在实际实现中，这里可以调用消息推送服务
        // this.notificationService.send(notification);
    }

    /**
     * 生成风险评估报告
     */
    generateRiskReport() {
        const riskScore = this.riskMetrics.overallRiskScore;
        
        let riskLevel, color;
        if (riskScore >= 0.8) {
            riskLevel = 'high';
            color = '#ff4444';
        } else if (riskScore >= 0.5) {
            riskLevel = 'medium';
            color = '#ffaa00';
        } else {
            riskLevel = 'low';
            color = '#00aa00';
        }
        
        return {
            timestamp: new Date(),
            riskScore: riskScore,
            riskLevel: riskLevel,
            color: color,
            metrics: this.riskMetrics,
            alerts: this.alerts.slice(0, 5), // 返回最近5条警报
            recommendations: this.generateRecommendations(),
            summary: this.generateSummary()
        };
    }

    /**
     * 生成风险应对建议
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.riskMetrics.currentDrawdown > this.riskThresholds.maxDrawdown * 0.8) {
            recommendations.push('考虑设置更严格的止损点');
        }
        
        if (this.riskMetrics.volatility > this.riskThresholds.volatilityLimit * 0.8) {
            recommendations.push('降低交易频率，避免过度交易');
        }
        
        if (this.riskMetrics.concentration > this.riskThresholds.concentrationLimit * 0.8) {
            recommendations.push('分散投资，降低单一品种持仓比例');
        }
        
        if (this.riskMetrics.correlation > this.riskThresholds.correlationThreshold * 0.8) {
            recommendations.push('增加不同资产类别的配置');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('当前风险可控，继续保持');
        }
        
        return recommendations;
    }

    /**
     * 生成风险摘要
     */
    generateSummary() {
        const riskScore = this.riskMetrics.overallRiskScore;
        
        if (riskScore >= 0.8) {
            return '高风险状态：需要立即采取风险控制措施';
        } else if (riskScore >= 0.5) {
            return '中等风险：建议关注并适当调整策略';
        } else {
            return '低风险：当前投资组合风险可控';
        }
    }

    /**
     * 生成错误报告
     */
    generateErrorReport(error) {
        return {
            timestamp: new Date(),
            riskScore: 0,
            riskLevel: 'unknown',
            color: '#999999',
            error: error.message,
            metrics: {},
            alerts: [],
            recommendations: ['系统错误，请联系技术支持'],
            summary: '风险评估暂时不可用'
        };
    }

    // ==================== 工具方法 ====================

    /**
     * 获取当前警报数量
     */
    getAlertCount() {
        return this.alerts.length;
    }

    /**
     * 清除历史警报
     */
    clearAlerts() {
        this.alerts = [];
        console.log('历史警报已清除');
    }

    /**
     * 更新风险阈值
     */
    updateRiskThresholds(newThresholds) {
        this.riskThresholds = { ...this.riskThresholds, ...newThresholds };
        console.log('风险阈值已更新');
    }

    /**
     * 获取监控状态
     */
    getMonitoringStatus() {
        return {
            isMonitoring: this.isMonitoring,
            interval: this.monitoringInterval ? '运行中' : '已停止',
            alertCount: this.alerts.length,
            lastAssessment: new Date()
        };
    }
}

module.exports = RiskMonitor;