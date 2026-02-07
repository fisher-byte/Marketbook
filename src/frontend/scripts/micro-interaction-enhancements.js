/**
 * MarketBook 微交互增强脚本
 * 提供更流畅的用户交互体验和视觉反馈
 */

class MicroInteractionEnhancer {
    constructor() {
        this.init();
    }

    init() {
        this.setupCardInteractions();
        this.setupButtonInteractions();
        this.setupNavigationInteractions();
        this.setupFormInteractions();
        this.setupScrollAnimations();
        this.setupLoadingStates();
    }

    // 卡片交互增强
    setupCardInteractions() {
        const cards = document.querySelectorAll('.feature-card, .card, .post-card');
        
        cards.forEach(card => {
            // 悬停效果
            card.addEventListener('mouseenter', (e) => {
                this.animateCardHover(e.currentTarget, true);
            });
            
            card.addEventListener('mouseleave', (e) => {
                this.animateCardHover(e.currentTarget, false);
            });

            // 点击反馈
            card.addEventListener('mousedown', (e) => {
                this.animateCardClick(e.currentTarget);
            });

            card.addEventListener('mouseup', (e) => {
                this.animateCardRelease(e.currentTarget);
            });
        });
    }

    // 按钮交互增强
    setupButtonInteractions() {
        const buttons = document.querySelectorAll('button, .btn, .cta-button, .feature-link');
        
        buttons.forEach(button => {
            // 悬停效果
            button.addEventListener('mouseenter', (e) => {
                this.animateButtonHover(e.currentTarget, true);
            });
            
            button.addEventListener('mouseleave', (e) => {
                this.animateButtonHover(e.currentTarget, false);
            });

            // 点击反馈
            button.addEventListener('mousedown', (e) => {
                this.animateButtonClick(e.currentTarget);
            });

            button.addEventListener('mouseup', (e) => {
                this.animateButtonRelease(e.currentTarget);
            });

            // 触摸设备优化
            button.addEventListener('touchstart', (e) => {
                this.animateButtonClick(e.currentTarget);
            });

            button.addEventListener('touchend', (e) => {
                this.animateButtonRelease(e.currentTarget);
            });
        });
    }

    // 导航交互增强
    setupNavigationInteractions() {
        const navLinks = document.querySelectorAll('.nav-link, .menu-item');
        
        navLinks.forEach(link => {
            link.addEventListener('mouseenter', (e) => {
                this.animateNavHover(e.currentTarget);
            });
            
            link.addEventListener('mouseleave', (e) => {
                this.animateNavLeave(e.currentTarget);
            });
        });
    }

    // 表单交互增强
    setupFormInteractions() {
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                this.animateInputFocus(e.currentTarget);
            });
            
            input.addEventListener('blur', (e) => {
                this.animateInputBlur(e.currentTarget);
            });
        });
    }

    // 滚动动画
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateScrollReveal(entry.target);
                }
            });
        }, observerOptions);

        // 观察需要动画的元素
        const animatedElements = document.querySelectorAll('.feature-card, .section-title, .hero-content');
        animatedElements.forEach(el => observer.observe(el));
    }

    // 加载状态管理
    setupLoadingStates() {
        // 模拟异步操作加载状态
        const asyncButtons = document.querySelectorAll('[data-async="true"]');
        
        asyncButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.showLoadingState(e.currentTarget);
                
                // 模拟异步操作完成
                setTimeout(() => {
                    this.hideLoadingState(e.currentTarget);
                }, 2000);
            });
        });
    }

    // 动画方法
    animateCardHover(card, isHovering) {
        if (isHovering) {
            card.style.transform = 'translateY(-4px) scale(1.02)';
            card.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
        } else {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        }
    }

    animateCardClick(card) {
        card.style.transform = 'translateY(2px) scale(0.98)';
        card.style.transition = 'transform 0.1s ease';
    }

    animateCardRelease(card) {
        card.style.transform = 'translateY(-4px) scale(1.02)';
        card.style.transition = 'transform 0.2s ease';
    }

    animateButtonHover(button, isHovering) {
        if (isHovering) {
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        } else {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
        }
    }

    animateButtonClick(button) {
        button.style.transform = 'translateY(2px)';
        button.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        button.style.transition = 'all 0.1s ease';
    }

    animateButtonRelease(button) {
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        button.style.transition = 'all 0.2s ease';
    }

    animateNavHover(link) {
        link.style.transform = 'translateX(4px)';
        link.style.color = '#1a73e8';
    }

    animateNavLeave(link) {
        link.style.transform = 'translateX(0)';
        link.style.color = '';
    }

    animateInputFocus(input) {
        input.parentElement.style.transform = 'scale(1.02)';
        input.style.borderColor = '#1a73e8';
    }

    animateInputBlur(input) {
        input.parentElement.style.transform = 'scale(1)';
        input.style.borderColor = '#ccc';
    }

    animateScrollReveal(element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        element.style.transition = 'all 0.6s ease-out';
    }

    showLoadingState(button) {
        const originalText = button.textContent;
        button.textContent = '加载中...';
        button.disabled = true;
        button.style.opacity = '0.7';
        
        // 存储原始文本以便恢复
        button.dataset.originalText = originalText;
    }

    hideLoadingState(button) {
        button.textContent = button.dataset.originalText || '完成';
        button.disabled = false;
        button.style.opacity = '1';
    }
}

// 初始化微交互增强器
document.addEventListener('DOMContentLoaded', () => {
    new MicroInteractionEnhancer();
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MicroInteractionEnhancer;
}