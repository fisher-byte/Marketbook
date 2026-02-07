/**
 * Risk Monitor Enhanced V2 - MarketBook Platform
 * 设计优化版本：改进视觉层次和交互体验
 */

class RiskMonitorEnhancedV2 {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.riskData = {
            overallRisk: 'medium',
            metrics: {
                portfolioRisk: { value: '12.5%', trend: 'down', change: '-2.1%' },
                marketVolatility: { value: '18.3%', trend: 'up', change: '+1.4%' },
                leverageRatio: { value: '2.8x', trend: 'stable', change: '0.0%' },
                drawdown: { value: '5.2%', trend: 'down', change: '-0.8%' }
            },
            alerts: [
                { type: 'warning', title: '市场波动增加', description: '建议降低仓位', time: '2分钟前' },
                { type: 'info', title: '新策略可用', description: 'AI推荐低风险策略', time: '5分钟前' }
            ]
        };
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="risk-monitor-v2">
                <div class="risk-header-v2">
                    <div class="header-content">
                        <h2 class="risk-title-v2">智能风险监控</h2>
                        <div class="risk-status-v2 ${this.riskData.overallRisk}">
                            <span class="status-icon">🛡️</span>
                            <span class="status-text">${this.getRiskLevelText(this.riskData.overallRisk)}</span>
                            <div class="status-glow"></div>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="action-btn refresh-btn" title="刷新数据">🔄</button>
                        <button class="action-btn settings-btn" title="设置">⚙️</button>
                    </div>
                </div>

                <div class="metrics-grid-v2">
                    ${this.renderMetrics()}
                </div>

                <div class="alerts-section-v2">
                    <div class="alerts-header-v2">
                        <h3>风险提醒</h3>
                        <span class="alerts-count">${this.riskData.alerts.length} 条提醒</span>
                    </div>
                    <div class="alerts-list-v2">
                        ${this.renderAlerts()}
                    </div>
                </div>

                <div class="controls-v2">
                    <button class="control-btn primary-v2" onclick="this.handleQuickAction('riskAnalysis')">
                        <span class="btn-icon">📊</span>
                        深度分析
                    </button>
                    <button class="control-btn secondary-v2" onclick="this.handleQuickAction('riskReport')">
                        <span class="btn-icon">📋</span>
                        生成报告
                    </button>
                    <button class="control-btn tertiary-v2" onclick="this.handleQuickAction('autoAdjust')">
                        <span class="btn-icon">⚡</span>
                        自动调整
                    </button>
                </div>
            </div>
        `;
    }

    renderMetrics() {
        return Object.entries(this.riskData.metrics).map(([key, metric]) => `
            <div class="metric-card-v2" data-metric="${key}">
                <div class="metric-header">
                    <span class="metric-label">${this.getMetricLabel(key)}</span>
                    <span class="metric-trend ${metric.trend}">
                        ${metric.trend === 'up' ? '📈' : metric.trend === 'down' ? '📉' : '➡️'}
                    </span>
                </div>
                <div class="metric-value">${metric.value}</div>
                <div class="metric-change ${metric.change.startsWith('+') ? 'positive' : metric.change.startsWith('-') ? 'negative' : 'neutral'}">
                    ${metric.change}
                </div>
                <div class="metric-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.getProgressWidth(key)}"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderAlerts() {
        return this.riskData.alerts.map(alert => `
            <div class="alert-item-v2 ${alert.type}">
                <div class="alert-icon-v2">
                    ${alert.type === 'critical' ? '🔴' : alert.type === 'warning' ? '🟡' : '🔵'}
                </div>
                <div class="alert-content-v2">
                    <div class="alert-title-v2">${alert.title}</div>
                    <div class="alert-desc-v2">${alert.description}</div>
                    <div class="alert-time-v2">${alert.time}</div>
                </div>
                <button class="alert-action-v2" onclick="this.handleAlertAction('${alert.type}')">处理</button>
            </div>
        `).join('');
    }

    getRiskLevelText(level) {
        const levels = { low: '低风险', medium: '中等风险', high: '高风险' };
        return levels[level] || '未知';
    }

    getMetricLabel(key) {
        const labels = {
            portfolioRisk: '组合风险',
            marketVolatility: '市场波动',
            leverageRatio: '杠杆比率',
            drawdown: '最大回撤'
        };
        return labels[key] || key;
    }

    getProgressWidth(key) {
        const widths = {
            portfolioRisk: '45%',
            marketVolatility: '65%',
            leverageRatio: '35%',
            drawdown: '25%'
        };
        return widths[key] || '50%';
    }

    bindEvents() {
        // 绑定刷新按钮事件
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.refresh-btn')) {
                this.refreshData();
            }
            if (e.target.closest('.metric-card-v2')) {
                this.showMetricDetails(e.target.closest('.metric-card-v2').dataset.metric);
            }
        });
    }

    refreshData() {
        // 模拟数据刷新
        const refreshBtn = this.container.querySelector('.refresh-btn');
        refreshBtn.textContent = '⏳';
        refreshBtn.disabled = true;

        setTimeout(() => {
            // 这里应该是实际的数据更新逻辑
            refreshBtn.textContent = '🔄';
            refreshBtn.disabled = false;
            this.render();
        }, 1000);
    }

    showMetricDetails(metricKey) {
        console.log('查看指标详情:', metricKey);
        // 实际实现中应该打开详细分析面板
    }

    handleQuickAction(action) {
        console.log('执行快速操作:', action);
        // 实际实现中应该执行相应的业务逻辑
    }

    handleAlertAction(alertType) {
        console.log('处理提醒:', alertType);
        // 实际实现中应该处理提醒
    }
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RiskMonitorEnhancedV2;
}