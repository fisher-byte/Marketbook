/**
 * MarketBook 功能卡片增强交互脚本
 * 提供3D悬停效果、微动画和性能优化
 */

class FeatureCardsEnhanced {
    constructor() {
        this.cards = document.querySelectorAll('.feature');
        this.isMobile = this.detectMobile();
        this.init();
    }

    /**
     * 检测移动设备
     */
    detectMobile() {
        return window.matchMedia('(max-width: 768px)').matches || 
               'ontouchstart' in window;
    }

    /**
     * 初始化功能卡片增强效果
     */
    init() {
        if (this.cards.length === 0) return;

        // 为每个卡片添加事件监听器
        this.cards.forEach((card, index) => {
            this.setupCard(card, index);
        });

        // 添加性能优化
        this.addPerformanceOptimizations();
        
        console.log('FeatureCardsEnhanced initialized with', this.cards.length, 'cards');
    }

    /**
     * 设置单个卡片的事件监听器
     */
    setupCard(card, index) {
        // 添加数据属性用于性能优化
        card.dataset.cardIndex = index;
        card.dataset.animationState = 'idle';

        // 鼠标悬停效果（桌面设备）
        if (!this.isMobile) {
            card.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
            card.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
            card.addEventListener('mousemove', this.handleMouseMove.bind(this));
        }

        // 触摸设备交互
        card.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        card.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // 点击效果
        card.addEventListener('click', this.handleClick.bind(this));

        // 键盘导航支持
        card.addEventListener('focus', this.handleFocus.bind(this));
        card.addEventListener('blur', this.handleBlur.bind(this));

        // 添加可访问性属性
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `查看${card.querySelector('h3')?.textContent || '功能'}详情`);
    }

    /**
     * 鼠标进入处理
     */
    handleMouseEnter(e) {
        const card = e.currentTarget;
        if (card.dataset.animationState === 'animating') return;
        
        card.dataset.animationState = 'hover';
        this.animateCardHover(card, true);
    }

    /**
     * 鼠标离开处理
     */
    handleMouseLeave(e) {
        const card = e.currentTarget;
        card.dataset.animationState = 'idle';
        this.animateCardHover(card, false);
    }

    /**
     * 鼠标移动处理（3D效果）
     */
    handleMouseMove(e) {
        const card = e.currentTarget;
        if (card.dataset.animationState !== 'hover') return;
        
        this.apply3DEffect(card, e);
    }

    /**
     * 触摸开始处理
     */
    handleTouchStart(e) {
        const card = e.currentTarget;
        card.dataset.animationState = 'touch';
        this.animateCardHover(card, true);
        
        // 防止滚动冲突
        e.preventDefault();
    }

    /**
     * 触摸结束处理
     */
    handleTouchEnd(e) {
        const card = e.currentTarget;
        card.dataset.animationState = 'idle';
        this.animateCardHover(card, false);
        this.reset3DEffect(card);
    }

    /**
     * 点击处理
     */
    handleClick(e) {
        const card = e.currentTarget;
        const link = card.querySelector('.feature-link');
        
        if (link) {
            // 添加点击反馈动画
            this.animateClick(card);
            
            // 延迟跳转以显示动画效果
            setTimeout(() => {
                window.location.href = link.href;
            }, 200);
        }
    }

    /**
     * 焦点处理（键盘导航）
     */
    handleFocus(e) {
        const card = e.currentTarget;
        card.dataset.animationState = 'focus';
        this.animateCardHover(card, true);
    }

    /**
     * 失去焦点处理
     */
    handleBlur(e) {
        const card = e.currentTarget;
        card.dataset.animationState = 'idle';
        this.animateCardHover(card, false);
        this.reset3DEffect(card);
    }

    /**
     * 卡片悬停动画
     */
    animateCardHover(card, isHovering) {
        if (card.dataset.animationState === 'animating') return;
        
        card.dataset.animationState = 'animating';
        
        const duration = isHovering ? 300 : 200;
        const scale = isHovering ? 1.02 : 1;
        const translateY = isHovering ? -8 : 0;
        const rotateX = isHovering ? 5 : 0;
        
        card.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        card.style.transform = `translateY(${translateY}px) scale(${scale}) rotateX(${rotateX}deg)`;
        
        // 更新阴影和边框
        if (isHovering) {
            card.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(37, 99, 235, 0.1)';
            card.style.borderColor = 'var(--primary-light)';
        } else {
            card.style.boxShadow = 'var(--shadow-md)';
            card.style.borderColor = 'var(--border-color)';
        }
        
        // 图标动画
        const icon = card.querySelector('.feature-icon');
        if (icon) {
            icon.style.transition = `all ${duration}ms ease-out`;
            icon.style.transform = isHovering ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)';
        }
        
        // 徽章动画
        const badge = card.querySelector('.feature-badge');
        if (badge) {
            badge.style.transition = `all ${duration}ms ease-out`;
            badge.style.transform = isHovering ? 'scale(1.1)' : 'scale(1)';
        }
        
        setTimeout(() => {
            card.dataset.animationState = isHovering ? 'hover' : 'idle';
        }, duration);
    }

    /**
     * 应用3D鼠标跟随效果
     */
    apply3DEffect(card, e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateY = ((x - centerX) / centerX) * 3; // 最大旋转角度3度
        const rotateX = ((centerY - y) / centerY) * 3;
        
        const currentTransform = card.style.transform.split(' ');
        const baseTransform = currentTransform.slice(0, 3).join(' '); // 保留基础变换
        
        card.style.transform = `${baseTransform} rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        
        // 添加光效跟随
        this.updateLightEffect(card, x, y);
    }

    /**
     * 重置3D效果
     */
    reset3DEffect(card) {
        const currentTransform = card.style.transform.split(' ');
        const baseTransform = currentTransform.slice(0, 3).join(' ');
        card.style.transform = `${baseTransform} rotateX(0deg) rotateY(0deg)`;
        
        // 移除光效
        this.removeLightEffect(card);
    }

    /**
     * 更新光效位置
     */
    updateLightEffect(card, x, y) {
        let lightEffect = card.querySelector('.light-effect');
        
        if (!lightEffect) {
            lightEffect = document.createElement('div');
            lightEffect.className = 'light-effect';
            lightEffect.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle at ${x}px ${y}px, 
                    rgba(255, 255, 255, 0.1) 0%, 
                    transparent 50%);
                pointer-events: none;
                border-radius: var(--radius-lg);
                z-index: 1;
            `;
            card.appendChild(lightEffect);
        } else {
            lightEffect.style.background = `radial-gradient(circle at ${x}px ${y}px, 
                rgba(255, 255, 255, 0.1) 0%, 
                transparent 50%)`;
        }
    }

    /**
     * 移除光效
     */
    removeLightEffect(card) {
        const lightEffect = card.querySelector('.light-effect');
        if (lightEffect) {
            lightEffect.remove();
        }
    }

    /**
     * 点击动画效果
     */
    animateClick(card) {
        card.style.transition = 'all 150ms ease-out';
        card.style.transform = 'scale(0.98)';
        
        // 添加涟漪效果
        this.createRippleEffect(card);
        
        setTimeout(() => {
            card.style.transform = card.dataset.animationState === 'hover' ? 
                'translateY(-8px) scale(1.02) rotateX(5deg)' : 'scale(1)';
        }, 150);
    }

    /**
     * 创建涟漪点击效果
     */
    createRippleEffect(card) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(37, 99, 235, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 2;
        `;
        
        card.appendChild(ripple);
        
        // 动画
        setTimeout(() => {
            ripple.style.transition = 'all 400ms ease-out';
            ripple.style.width = '200px';
            ripple.style.height = '200px';
            ripple.style.opacity = '0';
        }, 10);
        
        // 清理
        setTimeout(() => {
            ripple.remove();
        }, 410);
    }

    /**
     * 添加性能优化
     */
    addPerformanceOptimizations() {
        // 使用 requestAnimationFrame 优化动画性能
        this.optimizeWithRAF();
        
        // 添加 Intersection Observer 实现懒加载效果
        this.addLazyLoading();
    }

    /**
     * 使用 RAF 优化动画性能
     */
    optimizeWithRAF() {
        let ticking = false;
        
        const updateCards = () => {
            this.cards.forEach(card => {
                if (card.dataset.animationState === 'hover') {
                    // 可以在这里添加需要每帧更新的效果
                }
            });
            ticking = false;
        };
        
        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateCards);
                ticking = true;
            }
        };
        
        // 监听滚动等可能影响卡片位置的事件
        window.addEventListener('scroll', requestTick, { passive: true });
        window.addEventListener('resize', requestTick);
    }

    /**
     * 添加懒加载效果
     */
    addLazyLoading() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(30px)';
                    
                    setTimeout(() => {
                        card.style.transition = 'all 600ms ease-out';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 100);
                    
                    observer.unobserve(card);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        this.cards.forEach(card => {
            observer.observe(card);
        });
    }

    /**
     * 销毁方法（清理事件监听器）
     */
    destroy() {
        this.cards.forEach(card => {
            card.removeEventListener('mouseenter', this.handleMouseEnter);
            card.removeEventListener('mouseleave', this.handleMouseLeave);
            card.removeEventListener('mousemove', this.handleMouseMove);
            card.removeEventListener('touchstart', this.handleTouchStart);
            card.removeEventListener('touchend', this.handleTouchEnd);
            card.removeEventListener('click', this.handleClick);
            card.removeEventListener('focus', this.handleFocus);
            card.removeEventListener('blur', this.handleBlur);
        });
    }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.featureCardsEnhanced = new FeatureCardsEnhanced();
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeatureCardsEnhanced;
}