/**
 * MarketBook 交互增强脚本
 * 提供更流畅的用户体验和微交互效果
 */

class InteractiveEnhancements {
    constructor() {
        this.init();
    }

    init() {
        this.setupSmoothScrolling();
        this.setupFeatureCards();
        this.setupPerformanceMonitoring();
        this.setupAccessibilityFeatures();
        this.setupLoadingStates();
    }

    // ==================== 平滑滚动增强 ====================

    setupSmoothScrolling() {
        // 为所有内部链接添加平滑滚动
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // ==================== 功能卡片增强 ====================

    setupFeatureCards() {
        const featureCards = document.querySelectorAll('.feature');
        
        featureCards.forEach(card => {
            // 鼠标悬停效果
            card.addEventListener('mouseenter', () => {
                this.animateCardHover(card, true);
            });
            
            card.addEventListener('mouseleave', () => {
                this.animateCardHover(card, false);
            });
            
            // 点击效果
            card.addEventListener('click', () => {
                this.animateCardClick(card);
            });
            
            // 触摸设备优化
            card.addEventListener('touchstart', () => {
                this.animateCardTouch(card, true);
            });
            
            card.addEventListener('touchend', () => {
                this.animateCardTouch(card, false);
            });
        });
    }

    animateCardHover(card, isHovering) {
        if (isHovering) {
            card.style.transform = 'translateY(-5px) scale(1.02)';
            card.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.15)';
        } else {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        }
    }

    animateCardClick(card) {
        card.style.transform = 'translateY(-2px) scale(0.98)';
        setTimeout(() => {
            card.style.transform = 'translateY(-5px) scale(1.02)';
        }, 150);
    }

    animateCardTouch(card, isTouching) {
        if (isTouching) {
            card.style.transform = 'scale(0.95)';
        } else {
            card.style.transform = 'scale(1)';
        }
    }

    // ==================== 性能监控增强 ====================

    setupPerformanceMonitoring() {
        // 监控页面加载性能
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log(`MarketBook 页面加载时间: ${loadTime}ms`);
            
            // 如果加载时间过长，显示优化提示
            if (loadTime > 3000) {
                this.showPerformanceTip('页面加载较慢，建议检查网络连接');
            }
        });
        
        // 监控用户交互延迟
        document.addEventListener('click', (e) => {
            const startTime = performance.now();
            
            setTimeout(() => {
                const endTime = performance.now();
                const responseTime = endTime - startTime;
                
                if (responseTime > 100) {
                    console.warn(`交互响应延迟: ${responseTime}ms`);
                }
            }, 0);
        });
    }

    showPerformanceTip(message) {
        const tip = document.createElement('div');
        tip.className = 'performance-tip';
        tip.innerHTML = `
            <span>⚡ ${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        tip.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ffeb3b;
            color: #333;
            padding: 10px 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
        `;
        
        document.body.appendChild(tip);
        
        setTimeout(() => tip.remove(), 5000);
    }

    // ==================== 可访问性增强 ====================

    setupAccessibilityFeatures() {
        // 键盘导航支持
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.highlightFocusedElement();
            }
        });
        
        // 高对比度模式检测
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }
        
        // 减少动画偏好检测
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }
    }

    highlightFocusedElement() {
        const focused = document.activeElement;
        if (focused && focused.classList.contains('feature')) {
            focused.style.outline = '3px solid #1a73e8';
            focused.style.outlineOffset = '2px';
        }
    }

    // ==================== 加载状态管理 ====================

    setupLoadingStates() {
        // 模拟加载状态（实际项目中替换为真实数据加载）
        this.simulateFeatureLoading();
    }

    simulateFeatureLoading() {
        const features = document.querySelectorAll('.feature');
        
        features.forEach((feature, index) => {
            // 添加骨架屏效果
            const skeleton = document.createElement('div');
            skeleton.className = 'feature-skeleton';
            skeleton.innerHTML = `
                <div class="skeleton-icon"></div>
                <div class="skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-stats"></div>
            `;
            
            feature.style.opacity = '0';
            feature.parentNode.insertBefore(skeleton, feature);
            
            // 模拟延迟加载
            setTimeout(() => {
                skeleton.remove();
                feature.style.opacity = '1';
                feature.style.animation = 'fadeInUp 0.6s ease-out';
            }, index * 200 + 500);
        });
    }

    // ==================== 工具方法 ====================

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// 初始化交互增强
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new InteractiveEnhancements();
    });
} else {
    new InteractiveEnhancements();
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InteractiveEnhancements;
}