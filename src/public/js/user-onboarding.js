/**
 * 用户引导系统 - MarketBook 平台
 * 为新用户提供渐进式引导体验
 */

class UserOnboarding {
    constructor(userId) {
        this.userId = userId;
        this.currentStep = 0;
        this.steps = [
            {
                id: 'welcome',
                title: '欢迎来到 MarketBook',
                description: '让我们快速了解平台功能',
                target: '.hero-section',
                position: 'bottom'
            },
            {
                id: 'forum-intro',
                title: '智能交易论坛',
                description: '与交易爱好者交流，获取AI推荐内容',
                target: '.forum-section',
                position: 'right'
            },
            {
                id: 'simulation-intro',
                title: '模拟盘交易',
                description: '零风险体验真实交易环境',
                target: '.simulation-section',
                position: 'left'
            },
            {
                id: 'strategy-intro',
                title: '策略分析',
                description: 'AI分析您的交易策略，提供专业建议',
                target: '.strategy-section',
                position: 'top'
            },
            {
                id: 'profile-setup',
                title: '完善个人资料',
                description: '设置交易偏好和风险承受能力',
                target: '.profile-section',
                position: 'bottom'
            }
        ];
        
        this.isActive = false;
        this.onboardingData = this.loadOnboardingData();
    }
    
    /**
     * 加载引导数据
     */
    loadOnboardingData() {
        const saved = localStorage.getItem(`onboarding_${this.userId}`);
        return saved ? JSON.parse(saved) : {
            completedSteps: [],
            startedAt: new Date().toISOString(),
            completedAt: null
        };
    }
    
    /**
     * 保存引导数据
     */
    saveOnboardingData() {
        localStorage.setItem(`onboarding_${this.userId}`, JSON.stringify(this.onboardingData));
    }
    
    /**
     * 开始引导流程
     */
    start() {
        if (this.onboardingData.completedAt) {
            console.log('引导流程已完成');
            return;
        }
        
        this.isActive = true;
        this.currentStep = 0;
        this.showStep(this.currentStep);
    }
    
    /**
     * 显示指定步骤
     */
    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.completeOnboarding();
            return;
        }
        
        const step = this.steps[stepIndex];
        this.currentStep = stepIndex;
        
        // 创建引导覆盖层
        this.createOverlay(step);
        
        // 更新进度条
        this.updateProgressBar();
    }
    
    /**
     * 创建引导覆盖层
     */
    createOverlay(step) {
        // 移除现有覆盖层
        this.removeOverlay();
        
        const overlay = document.createElement('div');
        overlay.className = 'onboarding-overlay';
        overlay.innerHTML = `
            <div class="onboarding-content onboarding-${step.position}">
                <div class="onboarding-header">
                    <h3>${step.title}</h3>
                    <button class="onboarding-skip">跳过</button>
                </div>
                <div class="onboarding-body">
                    <p>${step.description}</p>
                </div>
                <div class="onboarding-footer">
                    <button class="onboarding-prev">上一步</button>
                    <button class="onboarding-next">下一步</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 绑定事件
        this.bindOverlayEvents(overlay, step);
    }
    
    /**
     * 绑定覆盖层事件
     */
    bindOverlayEvents(overlay, step) {
        const nextBtn = overlay.querySelector('.onboarding-next');
        const prevBtn = overlay.querySelector('.onboarding-prev');
        const skipBtn = overlay.querySelector('.onboarding-skip');
        
        nextBtn.addEventListener('click', () => this.nextStep());
        prevBtn.addEventListener('click', () => this.prevStep());
        skipBtn.addEventListener('click', () => this.skipOnboarding());
        
        // 点击外部关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.skipOnboarding();
            }
        });
    }
    
    /**
     * 下一步
     */
    nextStep() {
        this.markStepCompleted(this.currentStep);
        this.showStep(this.currentStep + 1);
    }
    
    /**
     * 上一步
     */
    prevStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }
    
    /**
     * 标记步骤完成
     */
    markStepCompleted(stepIndex) {
        if (!this.onboardingData.completedSteps.includes(stepIndex)) {
            this.onboardingData.completedSteps.push(stepIndex);
            this.saveOnboardingData();
        }
    }
    
    /**
     * 跳过引导
     */
    skipOnboarding() {
        this.completeOnboarding();
    }
    
    /**
     * 完成引导流程
     */
    completeOnboarding() {
        this.isActive = false;
        this.onboardingData.completedAt = new Date().toISOString();
        this.saveOnboardingData();
        this.removeOverlay();
        
        // 发送完成事件
        this.sendCompletionEvent();
    }
    
    /**
     * 移除覆盖层
     */
    removeOverlay() {
        const existingOverlay = document.querySelector('.onboarding-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
    }
    
    /**
     * 更新进度条
     */
    updateProgressBar() {
        const progress = ((this.currentStep + 1) / this.steps.length) * 100;
        
        // 更新进度条显示
        const progressBar = document.querySelector('.onboarding-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }
    
    /**
     * 发送完成事件
     */
    sendCompletionEvent() {
        // 发送AJAX请求记录引导完成
        fetch('/api/onboarding/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: this.userId,
                completedSteps: this.onboardingData.completedSteps,
                duration: new Date() - new Date(this.onboardingData.startedAt)
            })
        });
    }
    
    /**
     * 检查是否需要引导
     */
    shouldShowOnboarding() {
        return !this.onboardingData.completedAt;
    }
    
    /**
     * 获取引导进度
     */
    getProgress() {
        return {
            totalSteps: this.steps.length,
            completedSteps: this.onboardingData.completedSteps.length,
            progressPercentage: (this.onboardingData.completedSteps.length / this.steps.length) * 100,
            isCompleted: !!this.onboardingData.completedAt
        };
    }
}

// CSS样式（可放入单独CSS文件）
const onboardingStyles = `
.onboarding-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.onboarding-content {
    background: white;
    border-radius: 12px;
    padding: 20px;
    max-width: 400px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    position: relative;
}

.onboarding-content.bottom {
    margin-top: 20px;
}

.onboarding-content.top {
    margin-bottom: 20px;
}

.onboarding-content.left {
    margin-right: 20px;
}

.onboarding-content.right {
    margin-left: 20px;
}

.onboarding-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.onboarding-header h3 {
    margin: 0;
    color: #333;
    font-size: 18px;
}

.onboarding-skip {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 14px;
}

.onboarding-body {
    margin-bottom: 20px;
}

.onboarding-body p {
    margin: 0;
    color: #666;
    line-height: 1.5;
}

.onboarding-footer {
    display: flex;
    justify-content: space-between;
}

.onboarding-prev, .onboarding-next {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
}

.onboarding-prev {
    background: #f5f5f5;
    color: #333;
}

.onboarding-next {
    background: #007bff;
    color: white;
}

.onboarding-progress {
    height: 4px;
    background: #007bff;
    transition: width 0.3s ease;
}
`;

// 注入样式
const styleSheet = document.createElement('style');
styleSheet.textContent = onboardingStyles;
document.head.appendChild(styleSheet);

// 导出类
window.UserOnboarding = UserOnboarding;