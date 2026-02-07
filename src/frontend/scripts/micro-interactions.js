/**
 * MarketBook 微交互优化脚本
 * 增强用户交互体验的微小动画和效果
 */

class MicroInteractions {
    constructor() {
        this.init();
    }

    init() {
        this.setupHoverEffects();
        this.setupClickAnimations();
        this.setupScrollEffects();
        this.setupFormInteractions();
        this.setupLoadingStates();
    }

    // 悬停效果增强
    setupHoverEffects() {
        // 卡片悬停效果
        const cards = document.querySelectorAll('.card, .feature-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px) scale(1.02)';
                card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            });
        });

        // 按钮悬停效果
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-2px)';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
            });
        });
    }

    // 点击动画效果
    setupClickAnimations() {
        // 按钮点击涟漪效果
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple-animation 0.6s ease-out;
                    pointer-events: none;
                `;
                
                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        });

        // 添加涟漪动画CSS
        if (!document.querySelector('#ripple-animation')) {
            const style = document.createElement('style');
            style.id = 'ripple-animation';
            style.textContent = `
                @keyframes ripple-animation {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 滚动效果优化
    setupScrollEffects() {
        // 滚动时导航栏阴影
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            } else {
                navbar.style.boxShadow = 'none';
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            }
        });

        // 滚动时元素淡入效果
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // 观察需要淡入的元素
        document.querySelectorAll('.feature, .card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // 表单交互优化
    setupFormInteractions() {
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // 聚焦效果
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement.classList.remove('focused');
                }
            });

            // 输入验证反馈
            input.addEventListener('input', () => {
                if (input.checkValidity()) {
                    input.classList.add('valid');
                    input.classList.remove('invalid');
                } else {
                    input.classList.add('invalid');
                    input.classList.remove('valid');
                }
            });
        });
    }

    // 加载状态优化
    setupLoadingStates() {
        // 按钮加载状态
        const buttons = document.querySelectorAll('.btn[type="submit"], .btn.loading');
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                if (this.classList.contains('loading')) return;
                
                const originalText = this.innerHTML;
                this.innerHTML = `
                    <span class="loading-spinner"></span>
                    <span>处理中...</span>
                `;
                this.classList.add('loading');
                this.disabled = true;
                
                // 模拟加载完成（实际应用中应移除这部分）
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('loading');
                    this.disabled = false;
                }, 2000);
            });
        });
    }
}

// 初始化微交互
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MicroInteractions();
    });
} else {
    new MicroInteractions();
}