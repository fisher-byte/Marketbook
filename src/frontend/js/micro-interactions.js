/**
 * MarketBook 微交互增强脚本
 * 提供精细化的用户体验优化
 */

class MicroInteractions {
    constructor() {
        this.init();
    }

    init() {
        this.setupButtonInteractions();
        this.setupFormEnhancements();
        this.setupCardAnimations();
        this.setupProgressIndicators();
        this.setupAccessibilityFeatures();
        this.setupPerformanceOptimizations();
    }

    /**
     * 按钮交互增强
     */
    setupButtonInteractions() {
        const buttons = document.querySelectorAll('.cta-button, .feature-link, .btn-primary');
        
        buttons.forEach(button => {
            // 点击涟漪效果
            button.addEventListener('click', (e) => {
                this.createRippleEffect(e, button);
            });

            // 悬停放大效果
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'scale(1.05)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'scale(1)';
            });

            // 触摸设备优化
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.95)';
            });

            button.addEventListener('touchend', () => {
                button.style.transform = 'scale(1)';
            });
        });
    }

    /**
     * 创建涟漪效果
     */
    createRippleEffect(event, button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
        `;

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * 表单增强
     */
    setupFormEnhancements() {
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // 焦点状态增强
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focused');
                this.validateInput(input);
            });

            // 实时验证反馈
            input.addEventListener('input', () => {
                this.validateInput(input);
            });

            // 键盘导航增强
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.focusNextInput(input);
                }
            });
        });
    }

    /**
     * 输入验证
     */
    validateInput(input) {
        const isValid = input.checkValidity();
        
        if (input.value.trim() === '') {
            input.classList.remove('valid', 'invalid');
        } else if (isValid) {
            input.classList.remove('invalid');
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
        }
    }

    /**
     * 焦点导航
     */
    focusNextInput(currentInput) {
        const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
        const currentIndex = inputs.indexOf(currentInput);
        
        if (currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus();
        }
    }

    /**
     * 卡片动画
     */
    setupCardAnimations() {
        const cards = document.querySelectorAll('.feature, .card, .stats-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    
                    // 为每个卡片添加延迟动画
                    const delay = Array.from(cards).indexOf(entry.target) * 100;
                    entry.target.style.transitionDelay = `${delay}ms`;
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }

    /**
     * 进度指示器
     */
    setupProgressIndicators() {
        // 创建全局进度条
        this.createGlobalProgressBar();
        
        // 页面加载进度模拟
        this.simulatePageLoadProgress();
    }

    createGlobalProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.id = 'global-progress-bar';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0;
            height: 3px;
            background: linear-gradient(90deg, #1a73e8, #4285f4);
            z-index: 9999;
            transition: width 0.3s ease;
        `;
        
        document.body.appendChild(progressBar);

        // 监听路由变化
        this.setupRouteProgress(progressBar);
    }

    simulatePageLoadProgress() {
        const progressBar = document.getElementById('global-progress-bar');
        
        if (progressBar) {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                progressBar.style.width = `${Math.min(progress, 90)}%`;
                
                if (progress >= 90) {
                    clearInterval(interval);
                    
                    // 页面加载完成
                    window.addEventListener('load', () => {
                        progressBar.style.width = '100%';
                        setTimeout(() => {
                            progressBar.style.opacity = '0';
                            setTimeout(() => progressBar.remove(), 300);
                        }, 300);
                    });
                }
            }, 100);
        }
    }

    setupRouteProgress(progressBar) {
        // 监听AJAX请求和路由变化
        const originalFetch = window.fetch;
        
        window.fetch = function(...args) {
            progressBar.style.width = '30%';
            
            return originalFetch.apply(this, args).then(response => {
                progressBar.style.width = '70%';
                return response;
            }).finally(() => {
                progressBar.style.width = '100%';
                setTimeout(() => {
                    progressBar.style.width = '0';
                }, 300);
            });
        };

        // 监听pushState和replaceState
        ['pushState', 'replaceState'].forEach(method => {
            const original = history[method];
            history[method] = function(...args) {
                progressBar.style.width = '50%';
                original.apply(this, args);
                setTimeout(() => {
                    progressBar.style.width = '100%';
                    setTimeout(() => {
                        progressBar.style.width = '0';
                    }, 300);
                }, 100);
            };
        });
    }

    /**
     * 可访问性功能
     */
    setupAccessibilityFeatures() {
        // 键盘导航增强
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // 高对比度模式支持
        this.setupHighContrastMode();
        
        // 字体大小调整
        this.setupFontSizeAdjustment();
    }

    setupHighContrastMode() {
        const contrastToggle = document.createElement('button');
        contrastToggle.textContent = '高对比度';
        contrastToggle.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 8px 12px;
            background: #1a73e8;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            z-index: 1000;
        `;

        contrastToggle.addEventListener('click', () => {
            document.body.classList.toggle('high-contrast');
            
            if (document.body.classList.contains('high-contrast')) {
                contrastToggle.textContent = '标准模式';
            } else {
                contrastToggle.textContent = '高对比度';
            }
        });

        document.body.appendChild(contrastToggle);
    }

    setupFontSizeAdjustment() {
        const fontSizeControls = document.createElement('div');
        fontSizeControls.style.cssText = `
            position: fixed;
            bottom: 60px;
            right: 20px;
            background: white;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
        `;

        fontSizeControls.innerHTML = `
            <button id="font-smaller">A-</button>
            <span style="margin: 0 10px;">字体大小</span>
            <button id="font-larger">A+</button>
        `;

        document.body.appendChild(fontSizeControls);

        document.getElementById('font-smaller').addEventListener('click', () => {
            this.adjustFontSize(-1);
        });

        document.getElementById('font-larger').addEventListener('click', () => {
            this.adjustFontSize(1);
        });
    }

    adjustFontSize(direction) {
        const html = document.documentElement;
        const currentSize = parseFloat(getComputedStyle(html).fontSize);
        const newSize = currentSize + (direction * 2);
        
        if (newSize >= 12 && newSize <= 24) {
            html.style.fontSize = `${newSize}px`;
        }
    }

    /**
     * 性能优化
     */
    setupPerformanceOptimizations() {
        // 图片懒加载
        this.setupLazyLoading();
        
        // 防抖和节流优化
        this.setupDebounceAndThrottle();
        
        // 内存优化
        this.setupMemoryOptimization();
    }

    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => {
            imageObserver.observe(img);
        });
    }

    setupDebounceAndThrottle() {
        // 为窗口调整大小添加防抖
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // 为滚动事件添加节流
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (!scrollTimeout) {
                scrollTimeout = setTimeout(() => {
                    this.handleScroll();
                    scrollTimeout = null;
                }, 100);
            }
        });
    }

    handleResize() {
        // 响应式布局调整
        document.body.classList.toggle('mobile-view', window.innerWidth < 768);
    }

    handleScroll() {
        // 滚动时隐藏/显示导航等优化
        const scrollY = window.scrollY;
        const header = document.querySelector('header');
        
        if (scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    setupMemoryOptimization() {
        // 清理不再需要的监听器
        window.addEventListener('beforeunload', () => {
            // 清理资源
            this.cleanup();
        });
    }

    cleanup() {
        // 清理方法
        console.log('清理微交互资源');
    }
}

// 添加CSS动画定义
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .keyboard-navigation *:focus {
        outline: 2px solid #1a73e8 !important;
        outline-offset: 2px !important;
    }
    
    .high-contrast {
        --bg-color: #000 !important;
        --text-color: #fff !important;
        --primary-color: #ffff00 !important;
    }
    
    .high-contrast * {
        background-color: var(--bg-color) !important;
        color: var(--text-color) !important;
        border-color: var(--text-color) !important;
    }
    
    .high-contrast .cta-button {
        background: var(--primary-color) !important;
        color: #000 !important;
    }
    
    .mobile-view .nav-links {
        flex-direction: column !important;
    }
    
    .scrolled header {
        background: rgba(255, 255, 255, 0.95) !important;
        backdrop-filter: blur(10px) !important;
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1) !important;
    }
`;

document.head.appendChild(style);

// 初始化微交互
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MicroInteractions();
    });
} else {
    new MicroInteractions();
}

export default MicroInteractions;