/**
 * 用户注册表单前端验证
 * 提供实时表单验证和用户友好的错误提示
 */

class RegisterValidation {
    constructor() {
        this.form = document.getElementById('registerForm');
        this.usernameInput = document.getElementById('username');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        // 实时输入验证
        this.usernameInput.addEventListener('blur', () => this.validateUsername());
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());
        this.confirmPasswordInput.addEventListener('blur', () => this.validateConfirmPassword());
        
        // 表单提交验证
        this.form.addEventListener('submit', (e) => this.validateForm(e));
    }
    
    validateUsername() {
        const username = this.usernameInput.value.trim();
        const errorElement = document.getElementById('usernameError');
        
        if (!username) {
            this.showError(errorElement, '用户名不能为空');
            return false;
        }
        
        if (username.length < 3 || username.length > 20) {
            this.showError(errorElement, '用户名长度必须在3-20个字符之间');
            return false;
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            this.showError(errorElement, '用户名只能包含字母、数字和下划线');
            return false;
        }
        
        this.hideError(errorElement);
        return true;
    }
    
    validateEmail() {
        const email = this.emailInput.value.trim();
        const errorElement = document.getElementById('emailError');
        
        if (!email) {
            this.showError(errorElement, '邮箱不能为空');
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError(errorElement, '请输入有效的邮箱地址');
            return false;
        }
        
        this.hideError(errorElement);
        return true;
    }
    
    validatePassword() {
        const password = this.passwordInput.value;
        const errorElement = document.getElementById('passwordError');
        
        if (!password) {
            this.showError(errorElement, '密码不能为空');
            return false;
        }
        
        if (password.length < 8) {
            this.showError(errorElement, '密码长度至少8位');
            return false;
        }
        
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            this.showError(errorElement, '密码必须包含大小写字母和数字');
            return false;
        }
        
        this.hideError(errorElement);
        return true;
    }
    
    validateConfirmPassword() {
        const password = this.passwordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;
        const errorElement = document.getElementById('confirmPasswordError');
        
        if (!confirmPassword) {
            this.showError(errorElement, '请确认密码');
            return false;
        }
        
        if (password !== confirmPassword) {
            this.showError(errorElement, '两次输入的密码不一致');
            return false;
        }
        
        this.hideError(errorElement);
        return true;
    }
    
    validateForm(e) {
        const isValid = this.validateUsername() && 
                       this.validateEmail() && 
                       this.validatePassword() && 
                       this.validateConfirmPassword();
        
        if (!isValid) {
            e.preventDefault();
            this.showToast('请检查表单中的错误');
        }
        
        return isValid;
    }
    
    showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        element.previousElementSibling.classList.add('error');
    }
    
    hideError(element) {
        element.textContent = '';
        element.style.display = 'none';
        element.previousElementSibling.classList.remove('error');
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 1000;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }
}

// 初始化验证器
document.addEventListener('DOMContentLoaded', () => {
    new RegisterValidation();
});