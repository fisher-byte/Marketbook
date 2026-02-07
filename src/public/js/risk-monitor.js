/**
 * 智能风险监控组件 - MarketBook 平台
 * 实时监控交易风险，提供可视化风险预警和智能建议
 * 
 * @version 1.0.0
 * @author MarketBook Team
 * @description 实时风险监控和预警系统
 */

class RiskMonitor {
    constructor(containerId, tradingEngine) {
        this.container = document.getElementById(containerId);
        this.tradingEngine = tradingEngine;
        this.riskLevels = {
            low: { color: '#10b981', label: '低风险', icon: '✅' },
            medium: { color: '#f59e0b', label: '中等风险', icon: '⚠️' },
            high: { color: '#ef4444', label: '高风险', icon: '🚨' }
        };
        
        this.init();
    }

    /**
     * 初始化风险监控器
     */
    init() {
        this.render();
        this.startMonitoring();
    }

    /**
     * 渲染风险监控界面
     */
    render() {
        this.container.innerHTML = `
            <div class="risk-monitor">
                <div class="risk-header">
                    <h3>🔍 智能风险监控</h3>
                    <div class="risk-status" id="riskStatus">
                        <span class="risk-level">正在检测...</span>
                        <span class="risk-icon">⏳</span>
                    </div>
                </div>
                
                <div class="risk-metrics">
                    <div class="metric-card">
                        <div class="metric-label">当前风险等级</div>
                        <div class="metric-value" id="currentRiskLevel">-</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-label">账户回撤</div>
                        <div class="metric-value" id="drawdownValue">-</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-label">波动率</div>
                        <div class="metric-value" id="volatilityValue">-</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-label">胜率</div>
                        <div class="metric-value" id="winRateValue">-</div>
                    </div>
                </div>
                
                <div class="risk-warnings" id="riskWarnings">
                    <h4>⚠️ 风险预警</h4>
                    <div class="warnings-list" id="warningsList">
                        <div class="no-warnings">暂无风险预警</div>
                    </div>
                </div>
                
                <div class="risk-suggestions" id="riskSuggestions">
                    <h4>💡 智能建议</h4>
                    <div class="suggestions-list" id="suggestionsList">
                        <div class="no-suggestions">暂无建议</div>
                    </div>
                </div>
                
                <div class="risk-timeline" id="riskTimeline">
                    <h4>📊 风险趋势</h4>
                    <canvas id="riskChart" width="400" height="200"></canvas>
                </div>
            </div>
        `;
        
        this.applyStyles();
    }

    /**
     * 应用样式
     */
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .risk-monitor {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .risk-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .risk-header h3 {
                margin: 0;
                color: #1e293b;
                font-size: 18px;
                font-weight: 600;
            }
            
            .risk-status {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 500;
            }
            
            .risk-level {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 14px;
            }
            
            .risk-metrics {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .metric-card {
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                text-align: center;
            }
            
            .metric-label {
                font-size: 12px;
                color: #64748b;
                margin-bottom: 8px;
                text-transform: uppercase;
                font-weight: 500;
            }
            
            .metric-value {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
            }
            
            .risk-warnings, .risk-suggestions {
                background: white;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .risk-warnings h4, .risk-suggestions h4 {
                margin: 0 0 10px 0;
                color: #1e293b;
                font-size: 14px;
                font-weight: 600;
            }
            
            .warnings-list, .suggestions-list {
                font-size: 13px;
                line-height: 1.4;
            }
            
            .warning-item, .suggestion-item {
                padding: 8px 12px;
                margin: 5px 0;
                border-radius: 6px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .warning-item {
                background: #fef2f2;
                border-left: 3px solid #ef4444;
                color: #dc2626;
            }
            
            .suggestion-item {
                background: #f0f9ff;
                border-left: 3px solid #0ea5e9;
                color: #0369a1;
            }
            
            .risk-timeline {
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .risk-timeline h4 {
                margin: 0 0 15px 0;
                color: #1e293b;
                font-size: 14px;
                font-weight: 600;
            }
            
            .no-warnings, .no-suggestions {
                color: #64748b;
                font-style: italic;
                text-align: center;
                padding: 20px;
            }
            
            /* 风险等级颜色 */
            .risk-low { background: #d1fae5; color: #065f46; }
            .risk-medium { background: #fef3c7; color: #92400e; }
            .risk-high { background: #fee2e2; color: #991b1b; }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * 开始实时监控
     */
    startMonitoring() {
        // 初始更新
        this.updateRiskData();
        
        // 每30秒更新一次风险数据
        this.monitorInterval = setInterval(() => {
            this.updateRiskData();
        }, 30000);
    }

    /**
     * 更新风险数据
     */
    updateRiskData() {
        try {
            const report = this.tradingEngine.getTradingReport();
            const riskAnalysis = this.tradingEngine.performRiskCheck();
            
            this.updateRiskLevel(riskAnalysis.riskLevel);
            this.updateMetrics(report);
            this.updateWarnings(riskAnalysis.warnings);
            this.updateSuggestions(riskAnalysis.suggestedActions);
            this.updateChart(report);
            
        } catch (error) {
            console.error('风险监控更新失败:', error);
            this.showError('风险监控暂时不可用');
        }
    }

    /**
     * 更新风险等级显示
     */
    updateRiskLevel(riskLevel) {
        const riskStatus = document.getElementById('riskStatus');
        const riskLevelEl = document.getElementById('currentRiskLevel');
        
        const levelInfo = this.riskLevels[riskLevel] || this.riskLevels.medium;
        
        riskStatus.innerHTML = `
            <span class="risk-level ${'risk-' + riskLevel}">${levelInfo.label}</span>
            <span class="risk-icon">${levelInfo.icon}</span>
        `;
        
        riskLevelEl.textContent = levelInfo.label;
        riskLevelEl.className = `metric-value ${'risk-' + riskLevel}`;
        riskLevelEl.style.color = levelInfo.color;
    }

    /**
     * 更新指标数据
     */
    updateMetrics(report) {
        const drawdownEl = document.getElementById('drawdownValue');
        const volatilityEl = document.getElementById('volatilityValue');
        const winRateEl = document.getElementById('winRateValue');
        
        // 账户回撤
        const drawdown = Math.abs(report.performance.maxDrawdown || 0);
        drawdownEl.textContent = `${drawdown.toFixed(2)}%`;
        drawdownEl.style.color = drawdown > 10 ? '#ef4444' : drawdown > 5 ? '#f59e0b' : '#10b981';
        
        // 波动率（简化计算）
        const volatility = this.calculateVolatility(report.tradingHistory.recentTransactions);
        volatilityEl.textContent = `${volatility.toFixed(2)}%`;
        volatilityEl.style.color = volatility > 15 ? '#ef4444' : volatility > 8 ? '#f59e0b' : '#10b981';
        
        // 胜率
        const winRate = report.performance.winRate || 0;
        winRateEl.textContent = `${winRate.toFixed(1)}%`;
        winRateEl.style.color = winRate > 60 ? '#10b981' : winRate > 40 ? '#f59e0b' : '#ef4444';
    }

    /**
     * 更新风险预警
     */
    updateWarnings(warnings) {
        const warningsList = document.getElementById('warningsList');
        
        if (warnings.length === 0) {
            warningsList.innerHTML = '<div class="no-warnings">暂无风险预警</div>';
            return;
        }
        
        warningsList.innerHTML = warnings.map(warning => `
            <div class="warning-item">
                <span>⚠️</span>
                <span>${warning}</span>
            </div>
        `).join('');
    }

    /**
     * 更新智能建议
     */
    updateSuggestions(suggestions) {
        const suggestionsList = document.getElementById('suggestionsList');
        
        if (suggestions.length === 0) {
            suggestionsList.innerHTML = '<div class="no-suggestions">暂无建议</div>';
            return;
        }
        
        suggestionsList.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item">
                <span>💡</span>
                <span>${suggestion}</span>
            </div>
        `).join('');
    }

    /**
     * 更新风险趋势图表
     */
    updateChart(report) {
        const canvas = document.getElementById('riskChart');
        const ctx = canvas.getContext('2d');
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 简化图表：绘制风险趋势线
        const transactions = report.tradingHistory.recentTransactions.slice(-10);
        if (transactions.length < 2) return;
        
        const values = transactions.map(tx => Math.abs(tx.profitLoss || 0));
        const maxValue = Math.max(...values, 1);
        
        const padding = 20;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        
        // 绘制坐标轴
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();
        
        // 绘制风险趋势线
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        transactions.forEach((tx, index) => {
            const x = padding + (index * chartWidth) / (transactions.length - 1);
            const y = canvas.height - padding - (values[index] / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // 绘制数据点
        transactions.forEach((tx, index) => {
            const x = padding + (index * chartWidth) / (transactions.length - 1);
            const y = canvas.height - padding - (values[index] / maxValue) * chartHeight;
            
            ctx.fillStyle = values[index] > maxValue * 0.7 ? '#ef4444' : 
                           values[index] > maxValue * 0.4 ? '#f59e0b' : '#10b981';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * 计算波动率（简化版）
     */
    calculateVolatility(transactions) {
        if (transactions.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < transactions.length; i++) {
            const prev = Math.abs(transactions[i-1].profitLoss || 0);
            const curr = Math.abs(transactions[i].profitLoss || 0);
            if (prev > 0) {
                returns.push((curr - prev) / prev);
            }
        }
        
        if (returns.length === 0) return 0;
        
        const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        
        return Math.sqrt(variance) * 100; // 转换为百分比
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        const riskStatus = document.getElementById('riskStatus');
        riskStatus.innerHTML = `
            <span class="risk-level risk-high">错误</span>
            <span class="risk-icon">❌</span>
        `;
        
        const warningsList = document.getElementById('warningsList');
        warningsList.innerHTML = `<div class="warning-item">⚠️ ${message}</div>`;
    }

    /**
     * 停止监控
     */
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
    }

    /**
     * 销毁监控器
     */
    destroy() {
        this.stopMonitoring();
        this.container.innerHTML = '';
    }
}

// 导出到全局作用域
window.RiskMonitor = RiskMonitor;