/**
 * 风险监控仪表板组件 - MarketBook 模拟盘功能增强
 * 实时显示风险指标、智能止损建议和批量操作界面
 * 
 * @version 1.0.0
 * @author MarketBook Team
 * @description 增强版风险监控和交易管理界面
 */

import React, { useState, useEffect } from 'react';
import './RiskDashboard.css';

const RiskDashboard = ({ tradingEngine, onRiskAlert, onBatchOperation }) => {
    const [riskMetrics, setRiskMetrics] = useState({
        riskLevel: 'low',
        drawdown: 0,
        volatility: 0,
        concentration: 0,
        warnings: [],
        suggestions: []
    });
    
    const [batchOrders, setBatchOrders] = useState([]);
    const [isMonitoring, setIsMonitoring] = useState(false);
    
    // 实时监控风险指标
    useEffect(() => {
        if (!tradingEngine) return;
        
        const monitorRisk = () => {
            const portfolio = tradingEngine.getPortfolioOverview();
            const riskCheck = tradingEngine.performRiskCheck();
            
            const metrics = {
                riskLevel: riskCheck.riskLevel,
                drawdown: portfolio.totalPL / tradingEngine.initialCapital * 100,
                volatility: tradingEngine.calculateVolatility() * 100,
                concentration: Math.max(...Array.from(tradingEngine.positions.values()).map(p => 
                    p.totalCost / tradingEngine.initialCapital * 100
                )),
                warnings: riskCheck.warnings,
                suggestions: riskCheck.suggestedActions
            };
            
            setRiskMetrics(metrics);
            
            // 高风险警报
            if (riskCheck.riskLevel === 'high' && riskCheck.warnings.length > 0) {
                onRiskAlert && onRiskAlert({
                    level: 'high',
                    message: '检测到高风险状态',
                    details: riskCheck.warnings
                });
            }
        };
        
        const interval = setInterval(monitorRisk, 5000); // 每5秒更新一次
        setIsMonitoring(true);
        
        return () => {
            clearInterval(interval);
            setIsMonitoring(false);
        };
    }, [tradingEngine, onRiskAlert]);
    
    // 智能止损建议
    const getSmartStopLossSuggestions = () => {
        if (!tradingEngine || !tradingEngine.checkSmartStopLoss) return [];
        
        const suggestions = [];
        tradingEngine.positions.forEach((position, symbol) => {
            const suggestion = tradingEngine.checkSmartStopLoss(symbol, position.currentValue / position.quantity);
            if (suggestion.action !== 'hold') {
                suggestions.push({
                    symbol,
                    ...suggestion,
                    currentPrice: position.currentValue / position.quantity
                });
            }
        });
        
        return suggestions;
    };
    
    // 批量操作处理
    const handleBatchOperation = async (operationType) => {
        if (!tradingEngine || !tradingEngine.processBatchOrders) return;
        
        try {
            const result = await tradingEngine.processBatchOrders();
            onBatchOperation && onBatchOperation(result);
        } catch (error) {
            console.error('批量操作失败:', error);
        }
    };
    
    // 添加批量订单
    const addBatchOrder = (order) => {
        setBatchOrders(prev => [...prev, { ...order, id: Date.now() }]);
    };
    
    // 移除批量订单
    const removeBatchOrder = (orderId) => {
        setBatchOrders(prev => prev.filter(order => order.id !== orderId));
    };
    
    return (
        <div className="risk-dashboard">
            {/* 风险状态概览 */}
            <div className="risk-overview">
                <h3>风险监控面板</h3>
                <div className={`risk-level ${riskMetrics.riskLevel}`}>
                    <span>风险等级: {riskMetrics.riskLevel.toUpperCase()}</span>
                </div>
                
                <div className="metrics-grid">
                    <div className="metric">
                        <label>最大回撤</label>
                        <span className={riskMetrics.drawdown < -10 ? 'warning' : ''}>
                            {riskMetrics.drawdown.toFixed(2)}%
                        </span>
                    </div>
                    <div className="metric">
                        <label>波动率</label>
                        <span className={riskMetrics.volatility > 5 ? 'warning' : ''}>
                            {riskMetrics.volatility.toFixed(2)}%
                        </span>
                    </div>
                    <div className="metric">
                        <label>持仓集中度</label>
                        <span className={riskMetrics.concentration > 30 ? 'warning' : ''}>
                            {riskMetrics.concentration.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
            
            {/* 智能止损建议 */}
            <div className="stop-loss-suggestions">
                <h4>智能止损建议</h4>
                {getSmartStopLossSuggestions().map((suggestion, index) => (
                    <div key={index} className="suggestion-item">
                        <span className="symbol">{suggestion.symbol}</span>
                        <span className="action">{suggestion.action}</span>
                        <span className="reason">{suggestion.reason}</span>
                        <button 
                            className="apply-btn"
                            onClick={() => {
                                // 应用止损建议
                                tradingEngine.executeSellOrder(
                                    suggestion.symbol, 
                                    suggestion.suggestedQuantity, 
                                    suggestion.currentPrice
                                );
                            }}
                        >
                            应用
                        </button>
                    </div>
                ))}
            </div>
            
            {/* 批量操作界面 */}
            <div className="batch-operations">
                <h4>批量交易操作</h4>
                <div className="batch-controls">
                    <button 
                        className="batch-btn"
                        onClick={() => handleBatchOperation('process')}
                        disabled={batchOrders.length === 0}
                    >
                        执行批量交易 ({batchOrders.length})
                    </button>
                    <button 
                        className="clear-btn"
                        onClick={() => setBatchOrders([])}
                    >
                        清空队列
                    </button>
                </div>
                
                <div className="batch-orders">
                    {batchOrders.map(order => (
                        <div key={order.id} className="batch-order-item">
                            <span>{order.symbol} - {order.type} {order.quantity} @ {order.price}</span>
                            <button onClick={() => removeBatchOrder(order.id)}>移除</button>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* 风险警告和建议 */}
            {riskMetrics.warnings.length > 0 && (
                <div className="risk-warnings">
                    <h4>风险警告</h4>
                    {riskMetrics.warnings.map((warning, index) => (
                        <div key={index} className="warning-item">
                            ⚠️ {warning}
                        </div>
                    ))}
                </div>
            )}
            
            {riskMetrics.suggestions.length > 0 && (
                <div className="risk-suggestions">
                    <h4>风险缓解建议</h4>
                    {riskMetrics.suggestions.map((suggestion, index) => (
                        <div key={index} className="suggestion-item">
                            💡 {suggestion}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RiskDashboard;