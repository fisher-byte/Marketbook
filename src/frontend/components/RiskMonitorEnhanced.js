/**
 * 增强版风险监控组件 - MarketBook 平台
 * 在原有基础上优化UI/UX，提升用户体验和交互效果
 * 
 * @version 2.0.0
 * @author MarketBook Team
 * @description 增强版风险监控界面，支持实时预警、智能止损、批量操作可视化
 */

import React, { useState, useEffect } from 'react';
import './RiskMonitorEnhanced.css';

const RiskMonitorEnhanced = ({ userId, tradingEngine }) => {
    const [riskData, setRiskData] = useState({
        positions: [],
        alerts: [],
        performance: {},
        batchQueue: [],
        isProcessing: false
    });
    
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedPositions, setSelectedPositions] = useState(new Set());
    const [batchAction, setBatchAction] = useState('sell');
    
    // 模拟数据加载
    useEffect(() => {
        loadRiskData();
        const interval = setInterval(loadRiskData, 5000); // 每5秒更新一次
        return () => clearInterval(interval);
    }, []);
    
    const loadRiskData = async () => {
        try {
            // 模拟从交易引擎获取数据
            const mockData = {
                positions: [
                    {
                        id: 'AAPL_001',
                        symbol: 'AAPL',
                        quantity: 100,
                        avgPrice: 150.25,
                        currentPrice: 148.75,
                        unrealizedPL: -150,
                        unrealizedPLPercent: -1.0,
                        riskLevel: 'medium',
                        stopLossPrice: 145.25,
                        takeProfitPrice: 155.25,
                        holdingDays: 3
                    },
                    {
                        id: 'TSLA_001',
                        symbol: 'TSLA',
                        quantity: 50,
                        avgPrice: 180.50,
                        currentPrice: 195.25,
                        unrealizedPL: 737.5,
                        unrealizedPLPercent: 8.2,
                        riskLevel: 'low',
                        stopLossPrice: 170.50,
                        takeProfitPrice: 200.00,
                        holdingDays: 7
                    },
                    {
                        id: 'NVDA_001',
                        symbol: 'NVDA',
                        quantity: 75,
                        avgPrice: 450.00,
                        currentPrice: 425.50,
                        unrealizedPL: -1837.5,
                        unrealizedPLPercent: -5.5,
                        riskLevel: 'high',
                        stopLossPrice: 430.00,
                        takeProfitPrice: 480.00,
                        holdingDays: 2
                    }
                ],
                alerts: [
                    {
                        id: 'alert_001',
                        type: 'stop_loss',
                        symbol: 'NVDA',
                        message: 'NVDA接近止损价位，当前亏损-5.5%',
                        severity: 'high',
                        timestamp: new Date(),
                        action: '建议减仓或设置移动止损'
                    },
                    {
                        id: 'alert_002',
                        type: 'volatility',
                        symbol: 'AAPL',
                        message: 'AAPL波动率上升，建议调整仓位',
                        severity: 'medium',
                        timestamp: new Date(Date.now() - 300000),
                        action: '监控市场波动'
                    }
                ],
                performance: {
                    totalCapital: 98500,
                    totalUnrealizedPL: -1250,
                    maxDrawdown: -3.2,
                    winRate: 65.5,
                    sharpeRatio: 1.8
                },
                batchQueue: [
                    {
                        id: 'batch_001',
                        symbol: 'AAPL',
                        action: 'sell',
                        quantity: 50,
                        price: 148.75,
                        status: 'pending'
                    }
                ],
                isProcessing: false
            };
            
            setRiskData(mockData);
        } catch (error) {
            console.error('加载风险数据失败:', error);
        }
    };
    
    // 处理批量操作
    const handleBatchAction = async () => {
        if (selectedPositions.size === 0) {
            alert('请选择要操作的持仓');
            return;
        }
        
        setRiskData(prev => ({ ...prev, isProcessing: true }));
        
        try {
            // 模拟批量操作执行
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            alert(`成功执行批量${batchAction}操作，涉及${selectedPositions.size}个持仓`);
            setSelectedPositions(new Set());
        } catch (error) {
            alert('批量操作失败: ' + error.message);
        } finally {
            setRiskData(prev => ({ ...prev, isProcessing: false }));
        }
    };
    
    // 处理单个持仓操作
    const handlePositionAction = (positionId, action) => {
        const position = riskData.positions.find(p => p.id === positionId);
        if (!position) return;
        
        alert(`执行${action}操作: ${position.symbol}, 数量: ${position.quantity}`);
    };
    
    // 切换持仓选择状态
    const togglePositionSelection = (positionId) => {
        const newSelection = new Set(selectedPositions);
        if (newSelection.has(positionId)) {
            newSelection.delete(positionId);
        } else {
            newSelection.add(positionId);
        }
        setSelectedPositions(newSelection);
    };
    
    // 获取风险等级颜色
    const getRiskColor = (riskLevel) => {
        switch (riskLevel) {
            case 'high': return '#ff4444';
            case 'medium': return '#ffaa00';
            case 'low': return '#00aa00';
            default: return '#666666';
        }
    };
    
    // 获取警报图标
    const getAlertIcon = (severity) => {
        switch (severity) {
            case 'high': return '🔴';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚪';
        }
    };
    
    return (
        <div className="risk-monitor-enhanced">
            {/* 顶部导航 */}
            <div className="risk-nav">
                <button 
                    className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    概览
                </button>
                <button 
                    className={`nav-tab ${activeTab === 'positions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('positions')}
                >
                    持仓监控
                </button>
                <button 
                    className={`nav-tab ${activeTab === 'alerts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('alerts')}
                >
                    风险警报
                </button>
                <button 
                    className={`nav-tab ${activeTab === 'batch' ? 'active' : ''}`}
                    onClick={() => setActiveTab('batch')}
                >
                    批量操作
                </button>
            </div>
            
            {/* 内容区域 */}
            <div className="risk-content">
                {/* 概览标签页 */}
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <div className="performance-cards">
                            <div className="performance-card">
                                <h3>总资产</h3>
                                <div className="amount">¥{riskData.performance.totalCapital?.toLocaleString()}</div>
                                <div className="change negative">
                                    ¥{riskData.performance.totalUnrealizedPL?.toLocaleString()}
                                </div>
                            </div>
                            <div className="performance-card">
                                <h3>胜率</h3>
                                <div className="amount">{riskData.performance.winRate}%</div>
                                <div className="change positive">优秀</div>
                            </div>
                            <div className="performance-card">
                                <h3>最大回撤</h3>
                                <div className="amount">{riskData.performance.maxDrawdown}%</div>
                                <div className="change negative">需关注</div>
                            </div>
                            <div className="performance-card">
                                <h3>夏普比率</h3>
                                <div className="amount">{riskData.performance.sharpeRatio}</div>
                                <div className="change positive">良好</div>
                            </div>
                        </div>
                        
                        <div className="risk-summary">
                            <h3>风险概况</h3>
                            <div className="risk-meters">
                                <div className="risk-meter">
                                    <label>整体风险水平</label>
                                    <div className="meter-bar">
                                        <div 
                                            className="meter-fill" 
                                            style={{ width: '60%', backgroundColor: getRiskColor('medium') }}
                                        ></div>
                                    </div>
                                    <span>中等风险</span>
                                </div>
                                <div className="risk-meter">
                                    <label>持仓分散度</label>
                                    <div className="meter-bar">
                                        <div 
                                            className="meter-fill" 
                                            style={{ width: '75%', backgroundColor: getRiskColor('low') }}
                                        ></div>
                                    </div>
                                    <span>良好分散</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* 持仓监控标签页 */}
                {activeTab === 'positions' && (
                    <div className="positions-tab">
                        <div className="positions-header">
                            <h3>持仓监控 ({riskData.positions.length})</h3>
                            <div className="position-actions">
                                <button className="btn-secondary">刷新</button>
                                <button className="btn-primary">导出数据</button>
                            </div>
                        </div>
                        
                        <div className="positions-grid">
                            {riskData.positions.map(position => (
                                <div 
                                    key={position.id}
                                    className={`position-card ${position.riskLevel}`}
                                >
                                    <div className="position-header">
                                        <span className="symbol">{position.symbol}</span>
                                        <span 
                                            className="risk-badge"
                                            style={{ backgroundColor: getRiskColor(position.riskLevel) }}
                                        >
                                            {position.riskLevel === 'high' ? '高风险' : 
                                             position.riskLevel === 'medium' ? '中风险' : '低风险'}
                                        </span>
                                    </div>
                                    
                                    <div className="position-details">
                                        <div className="detail-row">
                                            <span>持仓数量:</span>
                                            <span>{position.quantity} 股</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>持仓成本:</span>
                                            <span>¥{position.avgPrice}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>当前价格:</span>
                                            <span>¥{position.currentPrice}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>浮动盈亏:</span>
                                            <span className={position.unrealizedPL >= 0 ? 'positive' : 'negative'}>
                                                ¥{position.unrealizedPL} ({position.unrealizedPLPercent}%)
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span>止损价位:</span>
                                            <span>¥{position.stopLossPrice}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>持仓天数:</span>
                                            <span>{position.holdingDays} 天</span>
                                        </div>
                                    </div>
                                    
                                    <div className="position-actions">
                                        <button 
                                            className="btn-small"
                                            onClick={() => handlePositionAction(position.id, 'sell')}
                                        >
                                            卖出
                                        </button>
                                        <button 
                                            className="btn-small secondary"
                                            onClick={() => handlePositionAction(position.id, 'adjust')}
                                        >
                                            调整止损
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* 风险警报标签页 */}
                {activeTab === 'alerts' && (
                    <div className="alerts-tab">
                        <div className="alerts-header">
                            <h3>风险警报 ({riskData.alerts.length})</h3>
                            <div className="alert-filters">
                                <select>
                                    <option value="all">全部警报</option>
                                    <option value="high">高风险</option>
                                    <option value="medium">中风险</option>
                                    <option value="low">低风险</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="alerts-list">
                            {riskData.alerts.map(alert => (
                                <div key={alert.id} className={`alert-item ${alert.severity}`}>
                                    <div className="alert-icon">
                                        {getAlertIcon(alert.severity)}
                                    </div>
                                    <div className="alert-content">
                                        <div className="alert-header">
                                            <span className="alert-symbol">{alert.symbol}</span>
                                            <span className="alert-type">{alert.type}</span>
                                            <span className="alert-time">
                                                {new Date(alert.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className="alert-message">{alert.message}</div>
                                        <div className="alert-action">{alert.action}</div>
                                    </div>
                                    <div className="alert-actions">
                                        <button className="btn-small">处理</button>
                                        <button className="btn-small secondary">忽略</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* 批量操作标签页 */}
                {activeTab === 'batch' && (
                    <div className="batch-tab">
                        <div className="batch-header">
                            <h3>批量操作</h3>
                            <div className="batch-controls">
                                <select 
                                    value={batchAction}
                                    onChange={(e) => setBatchAction(e.target.value)}
                                >
                                    <option value="sell">批量卖出</option>
                                    <option value="adjust">批量调整止损</option>
                                    <option value="monitor">批量监控设置</option>
                                </select>
                                <button 
                                    className="btn-primary"
                                    onClick={handleBatchAction}
                                    disabled={riskData.isProcessing || selectedPositions.size === 0}
                                >
                                    {riskData.isProcessing ? '执行中...' : `执行批量${batchAction}`}
                                </button>
                            </div>
                        </div>
                        
                        <div className="batch-content">
                            <div className="positions-selector">
                                <h4>选择持仓 ({selectedPositions.size} 已选)</h4>
                                <div className="selectable-positions">
                                    {riskData.positions.map(position => (
                                        <div 
                                            key={position.id}
                                            className={`selectable-position ${selectedPositions.has(position.id) ? 'selected' : ''}`}
                                            onClick={() => togglePositionSelection(position.id)}
                                        >
                                            <input 
                                                type="checkbox"
                                                checked={selectedPositions.has(position.id)}
                                                onChange={() => togglePositionSelection(position.id)}
                                            />
                                            <span className="symbol">{position.symbol}</span>
                                            <span className="quantity">{position.quantity}股</span>
                                            <span className={`pl ${position.unrealizedPL >= 0 ? 'positive' : 'negative'}`}>
                                                {position.unrealizedPLPercent}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="batch-preview">
                                <h4>操作预览</h4>
                                <div className="preview-list">
                                    {Array.from(selectedPositions).map(positionId => {
                                        const position = riskData.positions.find(p => p.id === positionId);
                                        return position ? (
                                            <div key={positionId} className="preview-item">
                                                <span>{position.symbol}</span>
                                                <span>{batchAction}</span>
                                                <span>{position.quantity}股</span>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiskMonitorEnhanced;