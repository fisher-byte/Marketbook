/**
 * MarketBook 用户认证工具函数 - 增强版
 * 提供完整的认证状态管理和API调用功能
 */

class AuthManager {
    constructor() {
        this.tokenKey = 'marketbook_token';
        this.userKey = 'marketbook_user';
        this.isAuthenticated = this.checkAuthStatus();
    }

    // 检查认证状态
    checkAuthStatus() {
        const token = this.getToken();
        return !!token && !this.isTokenExpired(token);
    }

    // 获取JWT Token
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // 设置Token
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
        this.isAuthenticated = true;
    }

    // 移除Token
    removeToken() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.isAuthenticated = false;
    }

    // 检查Token是否过期
    isTokenExpired(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch (error) {
            return true;
        }
    }

    // 获取用户信息
    getUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    // 设置用户信息
    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    // 用户注册
    async register(userData) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            
            if (response.ok) {
                this.setToken(result.token);
                this.setUser(result.user);
                return { success: true, data: result };
            } else {
                return { success: false, error: result.message };
            }
        } catch (error) {
            return { success: false, error: '网络错误，请稍后重试' };
        }
    }

    // 用户登录
    async login(credentials) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();
            
            if (response.ok) {
                this.setToken(result.token);
                this.setUser(result.user);
                return { success: true, data: result };
            } else {
                return { success: false, error: result.message };
            }
        } catch (error) {
            return { success: false, error: '网络错误，请稍后重试' };
        }
    }

    // 用户登出
    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('登出请求失败:', error);
        } finally {
            this.removeToken();
            window.location.href = '/login';
        }
    }

    // 更新用户资料
    async updateProfile(userData) {
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            
            if (response.ok) {
                this.setUser(result.user);
                return { success: true, data: result };
            } else {
                return { success: false, error: result.message };
            }
        } catch (error) {
            return { success: false, error: '网络错误，请稍后重试' };
        }
    }

    // 验证Token有效性
    async validateToken() {
        try {
            const response = await fetch('/api/auth/validate', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (response.ok) {
                return { valid: true };
            } else {
                this.removeToken();
                return { valid: false };
            }
        } catch (error) {
            return { valid: false };
        }
    }

    // 获取认证头信息
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json'
        };
    }
}

// 全局认证管理器实例
window.marketbookAuth = new AuthManager();

// 页面加载时检查认证状态
document.addEventListener('DOMContentLoaded', function() {
    const auth = window.marketbookAuth;
    
    // 如果用户已登录，更新界面状态
    if (auth.isAuthenticated) {
        updateUIForAuthenticatedUser();
    }
    
    // 为所有需要认证的链接添加事件监听器
    document.querySelectorAll('[data-requires-auth]').forEach(element => {
        element.addEventListener('click', function(e) {
            if (!auth.isAuthenticated) {
                e.preventDefault();
                showLoginModal();
            }
        });
    });
});

// 更新界面为已认证状态
function updateUIForAuthenticatedUser() {
    const user = window.marketbookAuth.getUser();
    
    // 更新导航栏
    const authElements = document.querySelectorAll('[data-auth-state]');
    authElements.forEach(element => {
        const state = element.getAttribute('data-auth-state');
        if (state === 'authenticated') {
            element.style.display = 'block';
        } else if (state === 'anonymous') {
            element.style.display = 'none';
        }
    });
    
    // 更新用户信息
    const userElements = document.querySelectorAll('[data-user-info]');
    userElements.forEach(element => {
        const infoType = element.getAttribute('data-user-info');
        if (user && user[infoType]) {
            element.textContent = user[infoType];
        }
    });
}

// 显示登录模态框
function showLoginModal() {
    // 实现登录模态框逻辑
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div class="login-modal-overlay">
            <div class="login-modal">
                <h3>请先登录</h3>
                <p>此功能需要登录后才能使用</p>
                <div class="modal-actions">
                    <button onclick="window.location.href='/login'">前往登录</button>
                    <button onclick="this.closest('.login-modal-overlay').remove()">取消</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 导出认证管理器
export default AuthManager;