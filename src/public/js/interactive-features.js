/**
 * MarketBook 交互功能增强
 * 提供平滑的动画效果和用户交互反馈
 */

class InteractiveFeatures {
    constructor() {
        this.init();
    }

    init() {
        this.setupFeatureCards();
        this.setupSmoothScrolling();
        this.setupPerformanceIndicators();
        this.setupAccessibilityFeatures();
        this.setupLoadingStates();
    }

    /**
     * 设置功能卡片交互效果
     */
    setupFeatureCards() {
        const featureCards = document.querySelectorAll('.feature');
        
        featureCards.forEach(card => {
            // 鼠标悬停效果
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
                card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.15)';
                
                // 显示详细统计信息
                const stats = card.querySelector('.feature-stats');
                if (stats) {
                    stats.style.opacity = '1';
                    stats.style.transform = 'translateY(0)';
                }
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                
                const stats = card.querySelector('.feature-stats');
                if (stats) {
                    stats.style.opacity = '0';
                    stats.style.transform = 'translateY(10px)';
                }
            });

            // 点击效果
            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'A') {
                    const link = card.querySelector('.feature-link');
                    if (link) {
                        link.click();
                    }
                }
            });
        });
    }

    /**
     * 设置平滑滚动效果
     */
    setupSmoothScrolling() {
        // 导航链接平滑滚动
        const navLinks = document.querySelectorAll('nav a[href^="#"]');
        navLinks.forEach(link => {
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

        // CTA按钮滚动效果
        const ctaButton = document.querySelector('.cta-button');
        if (ctaButton) {
            ctaButton.addEventListener('click', () => {
                const featuresSection = document.querySelector('.features');
                if (featuresSection) {
                    featuresSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        }
    }

    /**
     * 设置性能指标动画
     */
    setupPerformanceIndicators() {
        const statsElements = document.querySelectorAll('.stat');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statsElements.forEach(stat => observer.observe(stat));
    }

    /**
     * 数字计数器动画
     */
    animateCounter(element) {
        const text = element.textContent;
        const numberMatch = text.match(/\d+(\.\d+)?/);
        
        if (numberMatch) {
            const targetNumber = parseFloat(numberMatch[0]);
            const suffix = text.replace(numberMatch[0], '');
            let currentNumber = 0;
            const duration = 2000; // 2秒动画
            const steps = 60; // 60帧
            const increment = targetNumber / steps;
            
            const timer = setInterval(() => {
                currentNumber += increment;
                if (currentNumber >= targetNumber) {
                    currentNumber = targetNumber;
                    clearInterval(timer);
                }
                
                element.textContent = Math.round(currentNumber) + suffix;
            }, duration / steps);
        }
    }

    /**
     * 设置无障碍功能
     */
    setupAccessibilityFeatures() {
        // 键盘导航支持
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // 焦点管理
        const focusableElements = document.querySelectorAll(
            'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.style.outline = '2px solid #1a73e8';
                element.style.outlineOffset = '2px';
            });

            element.addEventListener('blur', () => {
                element.style.outline = 'none';
            });
        });
    }

    /**
     * 设置加载状态
     */
    setupLoadingStates() {
        // CTA按钮加载状态
        const ctaButton = document.querySelector('.cta-button');
        if (ctaButton) {
            ctaButton.addEventListener('click', function() {
                const originalText = this.textContent;
                this.textContent = '加载中...';
                this.disabled = true;
                
                // 模拟加载延迟
                setTimeout(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                }, 1500);
            });
        }

        // 功能链接加载状态
        const featureLinks = document.querySelectorAll('.feature-link');
        featureLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const originalText = this.textContent;
                this.textContent = '跳转中...';
                this.style.opacity = '0.7';
                
                // 模拟页面跳转延迟
                setTimeout(() => {
                    window.location.href = this.href;
                }, 800);
            });
        });
    }

    /**
     * 添加视觉反馈效果
     */
    addVisualFeedback(element, type = 'success') {
        const feedback = document.createElement('div');
        feedback.className = `feedback ${type}`;
        feedback.textContent = type === 'success' ? '✓ 操作成功' : '⚠ 操作失败';
        
        element.parentNode.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 3000);
    }

    /**
     * 响应式调整处理
     */
    handleResponsiveAdjustments() {
        const handleResize = () => {
            const viewportWidth = window.innerWidth;
            
            if (viewportWidth < 768) {
                document.body.classList.add('mobile-view');
            } else {
                document.body.classList.remove('mobile-view');
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // 初始调用
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new InteractiveFeatures();
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InteractiveFeatures;
}