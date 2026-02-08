// simulation.js - 模拟盘前端逻辑

let currentAccount = null;
const API_BASE = '/api';

// 页面加载
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

// 加载用户信息
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

// 加载账户信息
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

// 创建账户
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

// 刷新账户
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

// 买入下单
async function placeBuyOrder() {
    const symbol = document.getElementById('buySymbol').value.trim();
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

// 卖出下单
async function placeSellOrder() {
    const symbol = document.getElementById('sellSymbol').value.trim();
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

// 加载持仓
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
            displayPositions(data.positions || []);
        } else {
            document.getElementById('positionsContent').innerHTML = '<div class="empty-state">加载持仓失败</div>';
        }
    } catch (error) {
        console.error('加载持仓失败:', error);
        document.getElementById('positionsContent').innerHTML = '<div class="empty-state">加载持仓失败</div>';
    }
}

// 加载交易历史
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

// 显示持仓
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
                    <th>市值</th>
                    <th>盈亏</th>
                    <th>盈亏率</th>
                </tr>
            </thead>
            <tbody>
    `;

    positions.forEach(pos => {
        const pnlClass = pos.unrealizedPnl >= 0 ? 'positive' : 'negative';
        const pnlSign = pos.unrealizedPnl >= 0 ? '+' : '';
        
        html += `
            <tr>
                <td><strong>${pos.symbol}</strong></td>
                <td>${pos.quantity}</td>
                <td>¥${pos.avgCost.toFixed(2)}</td>
                <td>¥${pos.marketValue.toFixed(2)}</td>
                <td class="${pnlClass}">${pnlSign}¥${pos.unrealizedPnl.toFixed(2)}</td>
                <td class="${pnlClass}">${pnlSign}${pos.returnRate.toFixed(2)}%</td>
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

// 更新账户显示
function updateAccountDisplay() {
    if (!currentAccount) return;

    document.getElementById('accountBalance').textContent = `¥${currentAccount.balance.toFixed(2)}`;
    document.getElementById('initialBalance').textContent = `¥${currentAccount.initialBalance.toFixed(2)}`;
    
    // 这里简化处理，实际应该从持仓计算
    const positionsValue = 0; // TODO: 从持仓数据计算
    document.getElementById('positionsValue').textContent = `¥${positionsValue.toFixed(2)}`;
    
    const totalPnl = currentAccount.balance - currentAccount.initialBalance + positionsValue;
    const pnlElement = document.getElementById('totalPnl');
    pnlElement.textContent = `${totalPnl >= 0 ? '+' : ''}¥${totalPnl.toFixed(2)}`;
    pnlElement.className = `info-value ${totalPnl >= 0 ? 'positive' : 'negative'}`;
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

// 显示提示
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

// 退出登录
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}
