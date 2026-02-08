/**
 * simulation.js - 模拟盘前端逻辑
 * 
 * 功能概览：
 * - 账户管理：创建、查询、刷新模拟盘账户
 * - 交易操作：买入、卖出股票
 * - 持仓管理：查看持仓、实时计算盈亏
 * - 行情数据：实时获取股票报价，每5秒自动更新
 * - 交易历史：查看历史交易记录
 * 
 * @author MarketBook Team
 * @version 2.0 (实时行情版本)
 */

/** @type {Object|null} 当前模拟盘账户对象 */
let currentAccount = null;

/** @type {Object} 行情数据缓存 (symbol -> quoteData) */
let marketDataCache = {};

/** @type {number|null} 价格更新定时器ID */
let priceUpdateInterval = null;

/** @constant {string} API基础路径 */
const API_BASE = '/api';

/**
 * 页面加载初始化
 * 检查登录状态 → 加载用户信息 → 加载账户信息
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // 加载用户信息
    await loadUserInfo();

    // 加载账户信息
    await loadAccount();
});

/**
 * 加载当前登录用户信息
 * 从服务器获取用户数据并显示在导航栏
 * @async
 * @returns {Promise<void>}
 */
async function loadUserInfo() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('userEmail').textContent = data.user?.email || '用户';
        } else {
            document.getElementById('userEmail').textContent = '未登录';
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
        document.getElementById('userEmail').textContent = '加载失败';
    }
}

/**
 * 加载用户的模拟盘账户信息
 * 如果账户存在则显示账户界面，否则显示创建账户界面
 * @async
 * @returns {Promise<void>}
 */
async function loadAccount() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/trading/accounts`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        document.getElementById('loadingSection').style.display = 'none';

        if (response.ok && data.accounts && data.accounts.length > 0) {
            // 有账户，显示账户信息
            currentAccount = data.accounts[0];
            showAccountSection();
            updateAccountDisplay();
            await loadPositions();
            await loadHistory();
        } else {
            // 无账户，显示创建按钮
            showCreateAccountSection();
        }
    } catch (error) {
        console.error('加载账户失败:', error);
        showAlert('加载账户信息失败', 'error');
        document.getElementById('loadingSection').style.display = 'none';
        showCreateAccountSection();
    }
}

/**
 * 创建新的模拟盘账户
 * 默认初始资金: ¥100,000
 * @async
 * @returns {Promise<void>}
 */
async function createAccount() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/trading/accounts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                initialBalance: 100000,
                name: '我的模拟盘'
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('账户创建成功！初始资金: ¥100,000', 'success');
            currentAccount = data.account;
            showAccountSection();
            updateAccountDisplay();
            await loadPositions();
            await loadHistory();
        } else {
            showAlert(data.message || '创建账户失败', 'error');
        }
    } catch (error) {
        console.error('创建账户失败:', error);
        showAlert('创建账户失败，请稍后重试', 'error');
    }
}

/**
 * 刷新账户数据
 * 重新加载账户信息、持仓和历史记录
 * @async
 * @returns {Promise<void>}
 */
async function refreshAccount() {
    if (!currentAccount) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/trading/accounts/${currentAccount.accountId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            currentAccount = data.account;
            updateAccountDisplay();
            await loadPositions();
            await loadHistory();
            showAlert('刷新成功', 'success');
        } else {
            showAlert('刷新失败', 'error');
        }
    } catch (error) {
        console.error('刷新账户失败:', error);
        showAlert('刷新失败', 'error');
    }
}

/**
 * 买入股票下单
 * 从表单获取股票代码、价格、数量，调用买入API
 * @async
 * @returns {Promise<void>}
 */
async function placeBuyOrder() {
    const symbol = document.getElementById('buySymbol').value.trim().toUpperCase();
    const price = parseFloat(document.getElementById('buyPrice').value);
    const quantity = parseInt(document.getElementById('buyQuantity').value);

    if (!symbol || !price || !quantity) {
        showAlert('请填写完整的买入信息', 'error');
        return;
    }

    if (price <= 0 || quantity <= 0) {
        showAlert('价格和数量必须大于0', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/trading/orders/buy`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accountId: currentAccount.accountId,
                symbol,
                price,
                quantity
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(`买入成功！${symbol} x ${quantity} @ ¥${price}`, 'success');
            // 清空表单
            document.getElementById('buySymbol').value = '';
            document.getElementById('buyPrice').value = '';
            document.getElementById('buyQuantity').value = '';
            // 刷新账户信息
            await refreshAccount();
        } else {
            showAlert(data.message || '买入失败', 'error');
        }
    } catch (error) {
        console.error('买入失败:', error);
        showAlert('买入失败，请稍后重试', 'error');
    }
}

/**
 * 卖出股票下单
 * 从表单获取股票代码、价格、数量，调用卖出API
 * @async
 * @returns {Promise<void>}
 */
async function placeSellOrder() {
    const symbol = document.getElementById('sellSymbol').value.trim().toUpperCase();
    const price = parseFloat(document.getElementById('sellPrice').value);
    const quantity = parseInt(document.getElementById('sellQuantity').value);

    if (!symbol || !price || !quantity) {
        showAlert('请填写完整的卖出信息', 'error');
        return;
    }

    if (price <= 0 || quantity <= 0) {
        showAlert('价格和数量必须大于0', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/trading/orders/sell`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accountId: currentAccount.accountId,
                symbol,
                price,
                quantity
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(`卖出成功！${symbol} x ${quantity} @ ¥${price}`, 'success');
            // 清空表单
            document.getElementById('sellSymbol').value = '';
            document.getElementById('sellPrice').value = '';
            document.getElementById('sellQuantity').value = '';
            // 刷新账户信息
            await refreshAccount();
        } else {
            showAlert(data.message || '卖出失败', 'error');
        }
    } catch (error) {
        console.error('卖出失败:', error);
        showAlert('卖出失败，请稍后重试', 'error');
    }
}

/**
 * 查询股票实时报价并自动填入表单
 * @async
 * @param {string} symbol - 股票代码 (如 'AAPL')
 * @param {string} targetField - 目标价格输入框ID (如 'buyPrice' 或 'sellPrice')
 * @returns {Promise<void>}
 */
async function fetchQuote(symbol, targetField) {
    if (!symbol) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/trading/quotes/${symbol.toUpperCase()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.quote) {
            const quote = data.quote;
            document.getElementById(targetField).value = quote.price.toFixed(2);
            showAlert(`${symbol} 当前价: ¥${quote.price.toFixed(2)} (${quote.change >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)`, 'info');
        } else {
            showAlert('未找到该股票行情', 'error');
        }
    } catch (error) {
        console.error('查询报价失败:', error);
        showAlert('查询报价失败', 'error');
    }
}

/**
 * 加载持仓列表
 * 获取账户持仓数据，并同步加载实时行情用于盈亏计算
 * @async
 * @returns {Promise<void>}
 */
async function loadPositions() {
    if (!currentAccount) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/trading/accounts/${currentAccount.accountId}/positions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const positions = data.positions || [];
            
            // 获取所有持仓股票的实时行情
            if (positions.length > 0) {
                const symbols = positions.map(p => p.symbol).join(',');
                await loadMarketData(symbols);
                
                // 启动实时价格更新（每5秒）
                startPriceUpdates(positions);
            }
            
            displayPositions(positions);
        } else {
            document.getElementById('positionsContent').innerHTML = '<div class="empty-state">加载持仓失败</div>';
        }
    } catch (error) {
        console.error('加载持仓失败:', error);
        document.getElementById('positionsContent').innerHTML = '<div class="empty-state">加载持仓失败</div>';
    }
}

/**
 * 批量加载市场行情数据
 * 获取多个股票的实时报价并缓存到 marketDataCache
 * @async
 * @param {string} symbols - 股票代码列表，逗号分隔 (如 'AAPL,GOOGL,MSFT')
 * @returns {Promise<void>}
 */
async function loadMarketData(symbols) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/trading/quotes?symbols=${symbols}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.quotes) {
            // 更新缓存
            data.quotes.forEach(quote => {
                marketDataCache[quote.symbol] = quote;
            });
        }
    } catch (error) {
        console.error('加载行情数据失败:', error);
    }
}

/**
 * 启动价格实时更新定时器
 * 每5秒自动刷新持仓行情和盈亏计算
 * @param {Array} positions - 持仓列表
 */
function startPriceUpdates(positions) {
    // 清除旧的定时器
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }

    // 每5秒更新一次行情和持仓显示
    priceUpdateInterval = setInterval(async () => {
        if (positions.length > 0) {
            const symbols = positions.map(p => p.symbol).join(',');
            await loadMarketData(symbols);
            displayPositions(positions); // 用最新行情重新渲染持仓
            updateAccountDisplay(); // 更新账户总览
        }
    }, 5000);
}

/**
 * 停止价格更新定时器
 * 清除定时器，停止自动刷新行情
 */
function stopPriceUpdates() {
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
        priceUpdateInterval = null;
    }
}

/**
 * 加载交易历史记录
 * 获取账户的历史交易记录并显示在表格中
 * @async
 * @returns {Promise<void>}
 */
async function loadHistory() {
    if (!currentAccount) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/trading/accounts/${currentAccount.accountId}/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displayHistory(data.history || []);
        } else {
            document.getElementById('historyContent').innerHTML = '<div class="empty-state">加载历史失败</div>';
        }
    } catch (error) {
        console.error('加载历史失败:', error);
        document.getElementById('historyContent').innerHTML = '<div class="empty-state">加载历史失败</div>';
    }
}

/**
 * 渲染持仓列表
 * 基于实时行情数据计算持仓盈亏、市值、盈亏率
 * @param {Array} positions - 持仓数据数组
 */
function displayPositions(positions) {
    const container = document.getElementById('positionsContent');
    
    if (positions.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无持仓</div>';
        return;
    }

    let html = `
        <table class="positions-table">
            <thead>
                <tr>
                    <th>股票代码</th>
                    <th>持仓数量</th>
                    <th>成本价</th>
                    <th>当前价 <span style="font-size:0.8em;color:#888;">(实时)</span></th>
                    <th>市值</th>
                    <th>盈亏</th>
                    <th>盈亏率</th>
                </tr>
            </thead>
            <tbody>
    `;

    positions.forEach(pos => {
        // 获取实时价格
        const quote = marketDataCache[pos.symbol];
        const currentPrice = quote ? quote.price : pos.avgCost; // 无行情时用成本价
        const marketValue = currentPrice * pos.quantity;
        const unrealizedPnl = marketValue - (pos.avgCost * pos.quantity);
        const returnRate = ((currentPrice - pos.avgCost) / pos.avgCost) * 100;
        
        const pnlClass = unrealizedPnl >= 0 ? 'positive' : 'negative';
        const pnlSign = unrealizedPnl >= 0 ? '+' : '';
        
        // 价格变化指示
        const priceChangeIndicator = quote ? 
            `<span class="${quote.change >= 0 ? 'positive' : 'negative'}" style="font-size:0.8em;">
                (${quote.change >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)
            </span>` : '';
        
        html += `
            <tr>
                <td><strong>${pos.symbol}</strong></td>
                <td>${pos.quantity}</td>
                <td>¥${pos.avgCost.toFixed(2)}</td>
                <td>
                    ¥${currentPrice.toFixed(2)}
                    ${priceChangeIndicator}
                </td>
                <td>¥${marketValue.toFixed(2)}</td>
                <td class="${pnlClass}">${pnlSign}¥${unrealizedPnl.toFixed(2)}</td>
                <td class="${pnlClass}">${pnlSign}${returnRate.toFixed(2)}%</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// 显示交易历史
function displayHistory(history) {
    const container = document.getElementById('historyContent');
    
    if (history.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无交易记录</div>';
        return;
    }

    let html = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>时间</th>
                    <th>类型</th>
                    <th>股票代码</th>
                    <th>价格</th>
                    <th>数量</th>
                    <th>金额</th>
                </tr>
            </thead>
            <tbody>
    `;

    history.forEach(record => {
        const typeText = record.type === 'buy' ? '买入' : '卖出';
        const typeClass = record.type === 'buy' ? 'positive' : 'negative';
        const date = new Date(record.timestamp).toLocaleString('zh-CN');
        
        html += `
            <tr>
                <td>${date}</td>
                <td class="${typeClass}">${typeText}</td>
                <td><strong>${record.symbol}</strong></td>
                <td>¥${record.price.toFixed(2)}</td>
                <td>${record.quantity}</td>
                <td>¥${record.amount.toFixed(2)}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

/**
 * 更新账户总览显示
 * 基于实时行情计算持仓市值和总盈亏
 * @async
 * @returns {Promise<void>}
 */
async function updateAccountDisplay() {
    if (!currentAccount) return;

    document.getElementById('accountBalance').textContent = `¥${currentAccount.balance.toFixed(2)}`;
    document.getElementById('initialBalance').textContent = `¥${currentAccount.initialBalance.toFixed(2)}`;
    
    // 从持仓数据计算总市值（基于实时价格）
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/trading/accounts/${currentAccount.accountId}/positions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        let positionsValue = 0;

        if (response.ok && data.positions) {
            data.positions.forEach(pos => {
                // 使用实时价格计算市值
                const quote = marketDataCache[pos.symbol];
                const currentPrice = quote ? quote.price : pos.avgCost;
                positionsValue += currentPrice * pos.quantity;
            });
        }

        document.getElementById('positionsValue').textContent = `¥${positionsValue.toFixed(2)}`;
        
        // 总盈亏 = 当前余额 + 持仓市值 - 初始资金
        const totalAssets = currentAccount.balance + positionsValue;
        const totalPnl = totalAssets - currentAccount.initialBalance;
        const pnlElement = document.getElementById('totalPnl');
        pnlElement.textContent = `${totalPnl >= 0 ? '+' : ''}¥${totalPnl.toFixed(2)}`;
        pnlElement.className = `info-value ${totalPnl >= 0 ? 'positive' : 'negative'}`;
    } catch (error) {
        console.error('更新账户显示失败:', error);
    }
}

// 显示/隐藏区域
function showCreateAccountSection() {
    document.getElementById('createAccountSection').style.display = 'block';
    document.getElementById('accountSection').style.display = 'none';
}

function showAccountSection() {
    document.getElementById('createAccountSection').style.display = 'none';
    document.getElementById('accountSection').style.display = 'block';
}

/**
 * 显示提示消息
 * 在页面顶部显示临时提示框，5秒后自动消失
 * @param {string} message - 提示内容
 * @param {string} [type='info'] - 提示类型 ('success'|'error'|'warning'|'info')
 */
function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

/**
 * 退出登录
 * 清除本地token并跳转到登录页
 */
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}
