/**
 * 交易界面优化组件 - MarketBook 平台
 * 提供现代化、响应式的交易界面，增强用户体验和交互性
 * 
 * @version 2.0.0
 * @author MarketBook Team
 * @description 优化交易界面布局、交互反馈和可视化效果
 */

import React, { useState, useEffect } from 'react';
import './TradingInterface.css';

const TradingInterface = ({ userId, initialCapital = 100000 }) => {
    const [currentCapital, setCurrentCapital] = useState(initialCapital);
    const [positions, setPositions] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);
    const [selectedSymbol, setSelectedSymbol] = useState('');
    const [orderType, setOrderType] = useState('market');
    const [quantity, setQuantity] = useState(0);
    const [price, setPrice] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // 模拟市场数据
    const marketSymbols = [
        { symbol: 'AAPL', name: '苹果公司', currentPrice: 182.63, change: '+1.23%' },
        { symbol: 'GOOGL', name: '谷歌', currentPrice: 138.21, change: '-0.45%' },
        { symbol: 'MSFT', name: '微软', currentPrice: 407.54, change: '+2.15%' },
        { symbol: 'TSLA', name: '特斯拉', currentPrice: 234.79, change: '-1.89%' },
        { symbol: 'NVDA', name: '英伟达', currentPrice: 903.63, change: '+3.42%' }
    ];

    // 初始化数据
    useEffect(() => {
        loadUserData();
    }, [userId]);

    const loadUserData = async () => {
        try {
            setIsLoading(true);
            // 模拟API调用
            setTimeout(() => {
                setPositions([
                    { symbol: 'AAPL', quantity: 10, avgCost: 175.50, currentPrice: 182.63, unrealizedPL: 71.30 },
                    { symbol: 'MSFT', quantity: 5, avgCost: 395.20, currentPrice: 407.54, unrealizedPL: 61.70 }
                ]);
                setOrderHistory([
                    { id: '1', symbol: 'AAPL', type: 'buy', quantity: 10, price: 175.50, timestamp: new Date('2024-01-15') },
                    { id: '2', symbol: 'MSFT', type: 'buy', quantity: 5, price: 395.20, timestamp: new Date('2024-01-20') }
                ]);
                setIsLoading(false);
            }, 500);
        } catch (err) {
            setError('加载数据失败');
            setIsLoading(false);
        }
    };

    const executeOrder = async (type) => {
        if (!selectedSymbol || quantity <= 0) {
            setError('请选择交易品种和数量');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // 模拟API调用
            setTimeout(() => {
                const symbolData = marketSymbols.find(s => s.symbol === selectedSymbol);
                const orderPrice = orderType === 'market' ? symbolData.currentPrice : price;
                
                const newOrder = {
                    id: Date.now().toString(),
                    symbol: selectedSymbol,
                    type: type,
                    orderType: orderType,
                    quantity: quantity,
                    price: orderPrice,
                    totalAmount: quantity * orderPrice,
                    timestamp: new Date(),
                    status: 'executed'
                };

                // 更新订单历史
                setOrderHistory(prev => [newOrder, ...prev]);
                
                // 更新持仓
                if (type === 'buy') {
                    setCurrentCapital(prev => prev - newOrder.totalAmount);
                    updatePositionsAfterBuy(newOrder);
                } else {
                    setCurrentCapital(prev => prev + newOrder.totalAmount);
                    updatePositionsAfterSell(newOrder);
                }

                setSuccess(`${type === 'buy' ? '买入' : '卖出'}订单执行成功`);
                setIsLoading(false);
                
                // 3秒后清除成功消息
                setTimeout(() => setSuccess(''), 3000);
            }, 1000);
        } catch (err) {
            setError('订单执行失败');
            setIsLoading(false);
        }
    };

    const updatePositionsAfterBuy = (order) => {
        setPositions(prev => {
            const existing = prev.find(p => p.symbol === order.symbol);
            if (existing) {
                return prev.map(p => 
                    p.symbol === order.symbol 
                        ? { ...p, quantity: p.quantity + order.quantity }
                        : p
                );
            } else {
                return [...prev, {
                    symbol: order.symbol,
                    quantity: order.quantity,
                    avgCost: order.price,
                    currentPrice: order.price,
                    unrealizedPL: 0
                }];
            }
        });
    };

    const updatePositionsAfterSell = (order) => {
        setPositions(prev => {
            const existing = prev.find(p => p.symbol === order.symbol);
            if (existing && existing.quantity >= order.quantity) {
                const newQuantity = existing.quantity - order.quantity;
                if (newQuantity === 0) {
                    return prev.filter(p => p.symbol !== order.symbol);
                } else {
                    return prev.map(p => 
                        p.symbol === order.symbol 
                            ? { ...p, quantity: newQuantity }
                            : p
                    );
                }
            }
            return prev;
        });
    };

    const getPortfolioValue = () => {
        return positions.reduce((total, position) => {
            return total + (position.quantity * position.currentPrice);
        }, currentCapital);
    };

    const getTotalUnrealizedPL = () => {
        return positions.reduce((total, position) => total + position.unrealizedPL, 0);
    };

    return (
        <div className="trading-interface">
            {/* 顶部状态栏 */}
            <div className="trading-header">
                <div className="portfolio-summary">
                    <h2>交易面板</h2>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">总资产</span>
                            <span className="stat-value">${getPortfolioValue().toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">可用资金</span>
                            <span className="stat-value">${currentCapital.toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">浮动盈亏</span>
                            <span className={`stat-value ${getTotalUnrealizedPL() >= 0 ? 'positive' : 'negative'}`}>
                                {getTotalUnrealizedPL() >= 0 ? '+' : ''}${getTotalUnrealizedPL().toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 主内容区域 */}
            <div className="trading-content">
                {/* 左侧：交易面板 */}
                <div className="trading-panel">
                    <div className="order-form">
                        <h3>下单面板</h3>
                        
                        {/* 交易品种选择 */}
                        <div className="form-group">
                            <label>交易品种</label>
                            <select 
                                value={selectedSymbol} 
                                onChange={(e) => setSelectedSymbol(e.target.value)}
                                className="symbol-selector"
                            >
                                <option value="">选择品种</option>
                                {marketSymbols.map(symbol => (
                                    <option key={symbol.symbol} value={symbol.symbol}>
                                        {symbol.symbol} - {symbol.name} (${symbol.currentPrice})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 订单类型选择 */}
                        <div className="form-group">
                            <label>订单类型</label>
                            <div className="order-type-selector">
                                <button 
                                    className={orderType === 'market' ? 'active' : ''}
                                    onClick={() => setOrderType('market')}
                                >
                                    市价单
                                </button>
                                <button 
                                    className={orderType === 'limit' ? 'active' : ''}
                                    onClick={() => setOrderType('limit')}
                                >
                                    限价单
                                </button>
                            </div>
                        </div>

                        {/* 价格输入（限价单） */}
                        {orderType === 'limit' && (
                            <div className="form-group">
                                <label>价格</label>
                                <input 
                                    type="number" 
                                    value={price} 
                                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                                    placeholder="输入价格"
                                />
                            </div>
                        )}

                        {/* 数量输入 */}
                        <div className="form-group">
                            <label>数量</label>
                            <input 
                                type="number" 
                                value={quantity} 
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                                placeholder="输入数量"
                                min="1"
                            />
                        </div>

                        {/* 订单金额预览 */}
                        {selectedSymbol && quantity > 0 && (
                            <div className="order-preview">
                                <div className="preview-item">
                                    <span>预估金额:</span>
                                    <span>${((orderType === 'market' ? 
                                        marketSymbols.find(s => s.symbol === selectedSymbol)?.currentPrice : price) * quantity).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="action-buttons">
                            <button 
                                className="btn-buy"
                                onClick={() => executeOrder('buy')}
                                disabled={isLoading || !selectedSymbol || quantity <= 0}
                            >
                                {isLoading ? '执行中...' : '买入'}
                            </button>
                            <button 
                                className="btn-sell"
                                onClick={() => executeOrder('sell')}
                                disabled={isLoading || !selectedSymbol || quantity <= 0}
                            >
                                {isLoading ? '执行中...' : '卖出'}
                            </button>
                        </div>

                        {/* 消息提示 */}
                        {error && <div className="message error">{error}</div>}
                        {success && <div className="message success">{success}</div>}
                    </div>
                </div>

                {/* 右侧：市场数据和持仓 */}
                <div className="market-data">
                    {/* 市场行情 */}
                    <div className="market-quotes">
                        <h3>实时行情</h3>
                        <div className="quotes-list">
                            {marketSymbols.map(symbol => (
                                <div key={symbol.symbol} className="quote-item">
                                    <div className="symbol-info">
                                        <span className="symbol">{symbol.symbol}</span>
                                        <span className="name">{symbol.name}</span>
                                    </div>
                                    <div className="price-info">
                                        <span className="price">${symbol.currentPrice}</span>
                                        <span className={`change ${symbol.change.includes('+') ? 'positive' : 'negative'}`}>
                                            {symbol.change}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 持仓列表 */}
                    <div className="positions-list">
                        <h3>持仓明细</h3>
                        {positions.length === 0 ? (
                            <div className="empty-state">暂无持仓</div>
                        ) : (
                            <div className="positions-grid">
                                {positions.map(position => (
                                    <div key={position.symbol} className="position-item">
                                        <div className="position-header">
                                            <span className="symbol">{position.symbol}</span>
                                            <span className={`pl ${position.unrealizedPL >= 0 ? 'positive' : 'negative'}`}>
                                                ${position.unrealizedPL.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="position-details">
                                            <div className="detail">
                                                <span>持仓:</span>
                                                <span>{position.quantity}股</span>
                                            </div>
                                            <div className="detail">
                                                <span>成本:</span>
                                                <span>${position.avgCost.toFixed(2)}</span>
                                            </div>
                                            <div className="detail">
                                                <span>现价:</span>
                                                <span>${position.currentPrice.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 底部：订单历史 */}
            <div className="order-history">
                <h3>订单历史</h3>
                {orderHistory.length === 0 ? (
                    <div className="empty-state">暂无订单记录</div>
                ) : (
                    <div className="history-table">
                        <div className="table-header">
                            <span>时间</span>
                            <span>品种</span>
                            <span>类型</span>
                            <span>数量</span>
                            <span>价格</span>
                            <span>金额</span>
                        </div>
                        {orderHistory.map(order => (
                            <div key={order.id} className="table-row">
                                <span>{order.timestamp.toLocaleString()}</span>
                                <span>{order.symbol}</span>
                                <span className={`type ${order.type}`}>{order.type === 'buy' ? '买入' : '卖出'}</span>
                                <span>{order.quantity}</span>
                                <span>${order.price.toFixed(2)}</span>
                                <span>${order.totalAmount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TradingInterface;