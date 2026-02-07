/**
 * MarketBook 移动端导航增强脚本
 * 提供更好的移动端用户体验和交互效果
 */

class MobileNav {
    constructor() {
        this.nav = document.querySelector('nav');
        this.navLinks = document.querySelector('.nav-links');
        this.menuToggle = null;
        this.isMobileMenuOpen = false;
        
        this.init();
    }
    
    init() {
        this.createMobileToggle();
        this.setupEventListeners();
        this.addTouchEnhancements();
    }
    
    createMobileToggle() {
        this.menuToggle = document.createElement('button');
        this.menuToggle.className = 'mobile-menu-toggle';
        this.menuToggle.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        this.menuToggle.setAttribute('aria-label', '切换菜单');
        this.menuToggle.setAttribute('aria-expanded', 'false');
        
        this.nav.appendChild(this.menuToggle);
    }
    
    setupEventListeners() {
        this.menuToggle.addEventListener('click', () => this.toggleMobileMenu());
        
        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (this.isMobileMenuOpen && !this.nav.contains(e.target)) {
                this.closeMobileMenu();
            }
        });
        
        // ESC键关闭菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
        
        // 窗口大小变化时重置菜单状态
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }
    
    addTouchEnhancements() {
        // 为移动端链接添加触摸反馈
        const links = this.navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('touchstart', () => {
                link.style.transform = 'scale(0.95)';
            });
            
            link.addEventListener('touchend', () => {
                link.style.transform = 'scale(1)';
            });
        });
    }
    
    toggleMobileMenu() {
        if (this.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }
    
    openMobileMenu() {
        this.navLinks.style.display = 'flex';
        this.navLinks.style.flexDirection = 'column';
        this.navLinks.style.position = 'absolute';
        this.navLinks.style.top = '100%';
        this.navLinks.style.left = '0';
        this.navLinks.style.right = '0';
        this.navLinks.style.background = 'var(--bg-primary)';
        this.navLinks.style.borderBottom = '1px solid var(--border-color)';
        this.navLinks.style.padding = 'var(--spacing-md)';
        this.navLinks.style.boxShadow = 'var(--shadow-lg)';
        
        this.menuToggle.classList.add('active');
        this.menuToggle.setAttribute('aria-expanded', 'true');
        this.isMobileMenuOpen = true;
        
        // 添加动画效果
        this.navLinks.style.opacity = '0';
        this.navLinks.style.transform = 'translateY(-10px)';
        
        requestAnimationFrame(() => {
            this.navLinks.style.transition = 'all 0.3s ease';
            this.navLinks.style.opacity = '1';
            this.navLinks.style.transform = 'translateY(0)';
        });
    }
    
    closeMobileMenu() {
        this.navLinks.style.opacity = '0';
        this.navLinks.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            this.navLinks.style.display = 'none';
            this.navLinks.style.position = '';
            this.navLinks.style.flexDirection = '';
            this.navLinks.style.background = '';
            this.navLinks.style.borderBottom = '';
            this.navLinks.style.padding = '';
            this.navLinks.style.boxShadow = '';
            this.navLinks.style.transition = '';
        }, 300);
        
        this.menuToggle.classList.remove('active');
        this.menuToggle.setAttribute('aria-expanded', 'false');
        this.isMobileMenuOpen = false;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth <= 768) {
        new MobileNav();
    }
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileNav;
}