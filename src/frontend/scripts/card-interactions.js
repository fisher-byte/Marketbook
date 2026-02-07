/**
 * MarketBook 卡片交互增强脚本
 * 提供平滑的卡片悬停效果和微交互
 */

class CardInteractions {
    constructor() {
        this.cards = document.querySelectorAll('.feature-card, .strategy-card, .forum-card');
        this.init();
    }

    init() {
        this.setupCardAnimations();
        this.setupClickEffects();
        this.setupTouchInteractions();
    }

    setupCardAnimations() {
        this.cards.forEach(card => {
            // 鼠标悬停效果
            card.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
            card.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
            
            // 点击效果
            card.addEventListener('mousedown', this.handleMouseDown.bind(this));
            card.addEventListener('mouseup', this.handleMouseUp.bind(this));
        });
    }

    setupClickEffects() {
        this.cards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' || e.target.closest('a')) return;
                
                // 创建涟漪效果
                this.createRippleEffect(e, card);
                
                // 添加点击动画
                card.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 150);
            });
        });
    }

    setupTouchInteractions() {
        this.cards.forEach(card => {
            let touchStartTime;
            
            card.addEventListener('touchstart', (e) => {
                touchStartTime = Date.now();
                card.style.transform = 'scale(0.98)';
            });

            card.addEventListener('touchend', (e) => {
                const touchDuration = Date.now() - touchStartTime;
                
                if (touchDuration < 200) {
                    // 短按效果
                    card.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        card.style.transform = '';
                    }, 100);
                } else {
                    // 长按效果
                    card.style.transform = '';
                }
            });
        });
    }

    handleMouseEnter(e) {
        const card = e.currentTarget;
        
        // 添加悬停类
        card.classList.add('card-hover');
        
        // 3D变换效果
        card.style.transform = 'translateY(-8px) scale(1.02)';
        card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        
        // 添加光泽效果
        this.addShineEffect(card);
    }

    handleMouseLeave(e) {
        const card = e.currentTarget;
        
        // 移除悬停类
        card.classList.remove('card-hover');
        
        // 恢复原始状态
        card.style.transform = '';
        card.style.boxShadow = '';
        
        // 移除光泽效果
        this.removeShineEffect(card);
    }

    handleMouseDown(e) {
        const card = e.currentTarget;
        card.style.transform = 'scale(0.95)';
    }

    handleMouseUp(e) {
        const card = e.currentTarget;
        card.style.transform = card.classList.contains('card-hover') ? 'translateY(-8px) scale(1.02)' : '';
    }

    createRippleEffect(event, card) {
        const ripple = document.createElement('div');
        ripple.classList.add('ripple-effect');
        
        const rect = card.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        card.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    addShineEffect(card) {
        const shine = document.createElement('div');
        shine.classList.add('card-shine');
        card.appendChild(shine);
        
        setTimeout(() => {
            shine.style.opacity = '1';
            shine.style.transform = 'translateX(100%)';
        }, 10);
    }

    removeShineEffect(card) {
        const shine = card.querySelector('.card-shine');
        if (shine) {
            shine.style.opacity = '0';
            setTimeout(() => {
                if (shine.parentNode === card) {
                    card.removeChild(shine);
                }
            }, 300);
        }
    }
}

// 卡片内容动态加载效果
class CardContentAnimations {
    constructor() {
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
    }

    observeCards() {
        document.querySelectorAll('.feature-card, .strategy-card').forEach(card => {
            this.observer.observe(card);
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('card-visible');
                this.animateCardContent(entry.target);
            }
        });
    }

    animateCardContent(card) {
        const elements = card.querySelectorAll('.feature-icon, .feature-badge, h3, p, .feature-stats, .feature-link');
        
        elements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
}

// 卡片性能优化
class CardPerformance {
    constructor() {
        this.setupPerformanceOptimizations();
    }

    setupPerformanceOptimizations() {
        // 启用硬件加速
        const style = document.createElement('style');
        style.textContent = `
            .feature-card, .strategy-card, .forum-card {
                transform: translateZ(0);
                will-change: transform, box-shadow;
            }
        `;
        document.head.appendChild(style);
    }
}

// 初始化所有卡片交互功能
document.addEventListener('DOMContentLoaded', () => {
    new CardInteractions();
    
    const contentAnimations = new CardContentAnimations();
    contentAnimations.observeCards();
    
    new CardPerformance();
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CardInteractions, CardContentAnimations, CardPerformance };
}