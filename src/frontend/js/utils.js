/**
 * MarketBook Frontend Utilities
 * API客户端、通用函数、状态管理
 */

// ============================================
// 1. API Configuration
// ============================================
const API_CONFIG = {
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
};

// ============================================
// 2. HTTP Client
// ============================================
class APIClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || API_CONFIG.baseURL;
        this.timeout = config.timeout || API_CONFIG.timeout;
        this.headers = { ...API_CONFIG.headers, ...config.headers };
    }

    /**
     * 获取存储的认证Token
     */
    getAuthToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    /**
     * 设置认证Token
     */
    setAuthToken(token, remember = false) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('authToken', token);
    }

    /**
     * 清除认证Token
     */
    clearAuthToken() {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
    }

    /**
     * 通用请求方法
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getAuthToken();
        
        const config = {
            method: options.method || 'GET',
            headers: { ...this.headers, ...options.headers },
            ...options
        };

        // 添加认证Header
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // 处理请求体
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new APIError(data.message || '请求失败', response.status, data);
            }

            return data;
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            throw new APIError(error.message || '网络错误', 0);
        }
    }

    // HTTP Methods
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }

    put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }

    patch(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

// 自定义API错误类
class APIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// 创建全局API客户端实例
const api = new APIClient();

// ============================================
// 3. Auth Module
// ============================================
const Auth = {
    /**
     * 用户注册
     */
    async register(userData) {
        const data = await api.post('/auth/register', userData);
        return data;
    },

    /**
     * 用户登录
     */
    async login(credentials, remember = false) {
        const data = await api.post('/auth/login', credentials);
        if (data.token) {
            api.setAuthToken(data.token, remember);
        }
        return data;
    },

    /**
     * 用户登出
     */
    async logout() {
        try {
            await api.post('/auth/logout');
        } finally {
            api.clearAuthToken();
        }
    },

    /**
     * 获取当前用户信息
     */
    async getCurrentUser() {
        return await api.get('/auth/me');
    },

    /**
     * 检查是否已登录
     */
    isAuthenticated() {
        return !!api.getAuthToken();
    },

    /**
     * 刷新Token
     */
    async refreshToken() {
        const data = await api.post('/auth/refresh');
        if (data.token) {
            api.setAuthToken(data.token, true);
        }
        return data;
    }
};

// ============================================
// 4. Form Validation
// ============================================
const Validator = {
    /**
     * 邮箱验证
     */
    email(value) {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(value);
    },

    /**
     * 密码强度验证
     */
    password(value, minLength = 6) {
        if (value.length < minLength) {
            return { valid: false, message: `密码至少需要${minLength}个字符` };
        }
        if (!/[A-Za-z]/.test(value)) {
            return { valid: false, message: '密码必须包含字母' };
        }
        if (!/\d/.test(value)) {
            return { valid: false, message: '密码必须包含数字' };
        }
        return { valid: true };
    },

    /**
     * 手机号验证（中国）
     */
    phone(value) {
        const pattern = /^1[3-9]\d{9}$/;
        return pattern.test(value);
    },

    /**
     * 用户名验证
     */
    username(value) {
        const pattern = /^[a-zA-Z0-9_-]{3,20}$/;
        return pattern.test(value);
    },

    /**
     * 必填项验证
     */
    required(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    }
};

// ============================================
// 5. UI Helpers
// ============================================
const UI = {
    /**
     * 显示Toast通知
     */
    toast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            backgroundColor: type === 'error' ? '#EF4444' : 
                             type === 'success' ? '#10B981' : 
                             type === 'warning' ? '#F59E0B' : '#3B82F6',
            color: 'white',
            fontSize: '0.95rem',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            zIndex: '10000',
            animation: 'slideIn 0.3s ease-out'
        });

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * 显示Loading状态
     */
    showLoading(element, text = '加载中...') {
        if (!element) return;
        
        element.disabled = true;
        element.dataset.originalText = element.textContent;
        element.textContent = text;
        element.classList.add('loading');
    },

    /**
     * 隐藏Loading状态
     */
    hideLoading(element) {
        if (!element) return;
        
        element.disabled = false;
        element.textContent = element.dataset.originalText || '';
        element.classList.remove('loading');
    },

    /**
     * 显示表单错误
     */
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}Error`);
        
        if (field) field.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    },

    /**
     * 清除表单错误
     */
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}Error`);
        
        if (field) field.classList.remove('error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    },

    /**
     * 清除所有表单错误
     */
    clearAllErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        form.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
    }
};

// ============================================
// 6. Storage Helpers
// ============================================
const Storage = {
    /**
     * 设置localStorage项（支持对象）
     */
    set(key, value) {
        try {
            const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
            localStorage.setItem(key, serialized);
        } catch (error) {
            console.error('Storage.set error:', error);
        }
    },

    /**
     * 获取localStorage项（自动反序列化）
     */
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            if (value === null) return defaultValue;
            
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            console.error('Storage.get error:', error);
            return defaultValue;
        }
    },

    /**
     * 删除localStorage项
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Storage.remove error:', error);
        }
    },

    /**
     * 清空localStorage
     */
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Storage.clear error:', error);
        }
    }
};

// ============================================
// 7. Router (Simple SPA Router)
// ============================================
const Router = {
    /**
     * 导航到指定路径
     */
    navigate(path) {
        window.location.href = path;
    },

    /**
     * 重定向到登录页
     */
    redirectToLogin() {
        const returnUrl = encodeURIComponent(window.location.pathname);
        this.navigate(`/login?returnUrl=${returnUrl}`);
    },

    /**
     * 登录后返回原页面
     */
    returnAfterLogin() {
        const params = new URLSearchParams(window.location.search);
        const returnUrl = params.get('returnUrl') || '/';
        this.navigate(returnUrl);
    },

    /**
     * 获取URL参数
     */
    getQueryParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }
};

// ============================================
// 8. Date & Time Utilities
// ============================================
const DateTime = {
    /**
     * 格式化日期
     */
    format(date, format = 'YYYY-MM-DD HH:mm:ss') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    /**
     * 相对时间（几分钟前）
     */
    relative(date) {
        const now = new Date();
        const target = new Date(date);
        const diff = Math.floor((now - target) / 1000);

        if (diff < 60) return '刚刚';
        if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
        if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
        return this.format(date, 'YYYY-MM-DD');
    }
};

// ============================================
// 9. Number Formatting
// ============================================
const Format = {
    /**
     * 格式化货币
     */
    currency(value, currency = 'CNY') {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: currency
        }).format(value);
    },

    /**
     * 格式化百分比
     */
    percent(value, decimals = 2) {
        return `${(value * 100).toFixed(decimals)}%`;
    },

    /**
     * 格式化大数字（10K, 1M等）
     */
    compact(value) {
        if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
        if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
        return value.toString();
    }
};

// ============================================
// 10. Export for use in other files
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { api, Auth, Validator, UI, Storage, Router, DateTime, Format };
}

// Make available globally
window.MarketBook = {
    api,
    Auth,
    Validator,
    UI,
    Storage,
    Router,
    DateTime,
    Format
};

console.log('✅ MarketBook utilities loaded');
