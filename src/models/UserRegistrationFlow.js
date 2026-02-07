/**
 * 用户注册流程跟踪模型 - MarketBook 平台
 * 优化注册体验，提供进度跟踪和个性化引导
 * 
 * @version 1.0.0
 * @author MarketBook Team
 * @description 增强用户注册流程，提高转化率和用户体验
 */

class UserRegistrationFlow {
    constructor(userId, registrationData = {}) {
        this.userId = userId;
        this.steps = {
            accountCreated: false,      // 账户创建完成
            emailVerified: false,       // 邮箱验证完成
            profileCompleted: false,    // 资料填写完成
            tradingSetup: false,        // 交易设置完成
            firstLogin: false,         // 首次登录完成
            tutorialCompleted: false   // 新手引导完成
        };
        
        this.currentStep = 'accountCreated';
        this.completionPercentage = 0;
        this.startedAt = new Date();
        this.lastUpdatedAt = new Date();
        this.estimatedCompletionTime = null;
        
        // 引导提示和个性化建议
        this.guidanceTips = [];
        this.personalizedSuggestions = [];
        
        // 性能指标
        this.timeSpentPerStep = {};
        this.abandonmentRisk = 'low';
        
        // 注册来源和渠道跟踪
        this.registrationSource = registrationData.source || 'direct';
        this.referralCode = registrationData.referralCode || null;
        this.marketingCampaign = registrationData.campaign || null;
    }

    /**
     * 标记步骤完成
     * @param {string} stepName 步骤名称
     */
    completeStep(stepName) {
        if (this.steps.hasOwnProperty(stepName)) {
            this.steps[stepName] = true;
            this.currentStep = this.getNextStep();
            this.lastUpdatedAt = new Date();
            this.updateCompletionPercentage();
            this.updateAbandonmentRisk();
            
            // 记录步骤完成时间
            this.timeSpentPerStep[stepName] = {
                started: this.lastUpdatedAt,
                completed: new Date()
            };
        }
    }

    /**
     * 获取下一个待完成步骤
     * @returns {string} 下一个步骤名称
     */
    getNextStep() {
        const stepOrder = [
            'accountCreated',
            'emailVerified', 
            'profileCompleted',
            'tradingSetup',
            'firstLogin',
            'tutorialCompleted'
        ];
        
        for (const step of stepOrder) {
            if (!this.steps[step]) {
                return step;
            }
        }
        return 'completed';
    }

    /**
     * 更新完成百分比
     */
    updateCompletionPercentage() {
        const totalSteps = Object.keys(this.steps).length;
        const completedSteps = Object.values(this.steps).filter(Boolean).length;
        this.completionPercentage = Math.round((completedSteps / totalSteps) * 100);
    }

    /**
     * 更新放弃风险等级
     */
    updateAbandonmentRisk() {
        const timeSinceStart = new Date() - this.startedAt;
        const hoursSinceStart = timeSinceStart / (1000 * 60 * 60);
        
        if (hoursSinceStart > 48 && this.completionPercentage < 50) {
            this.abandonmentRisk = 'high';
        } else if (hoursSinceStart > 24 && this.completionPercentage < 70) {
            this.abandonmentRisk = 'medium';
        } else {
            this.abandonmentRisk = 'low';
        }
    }

    /**
     * 生成个性化引导建议
     * @param {object} userData 用户数据
     */
    generateGuidance(userData) {
        this.guidanceTips = [];
        this.personalizedSuggestions = [];
        
        // 基于当前步骤的引导提示
        switch (this.currentStep) {
            case 'emailVerified':
                this.guidanceTips.push({
                    type: 'reminder',
                    message: '请检查邮箱并完成验证，以解锁完整功能',
                    priority: 'high'
                });
                break;
                
            case 'profileCompleted':
                this.guidanceTips.push({
                    type: 'suggestion',
                    message: '完善个人资料有助于获得更精准的交易建议',
                    priority: 'medium'
                });
                break;
                
            case 'tradingSetup':
                this.guidanceTips.push({
                    type: 'tutorial',
                    message: '新手建议从模拟盘开始，零风险学习交易技巧',
                    priority: 'high'
                });
                break;
        }
        
        // 基于用户特征的个性化建议
        if (userData.tradingExperience === 'beginner') {
            this.personalizedSuggestions.push({
                category: 'learning',
                title: '新手交易指南',
                description: '为您推荐适合初学者的交易课程和模拟练习',
                action: 'start_tutorial'
            });
        }
        
        if (userData.interests?.includes('crypto')) {
            this.personalizedSuggestions.push({
                category: 'feature',
                title: '加密货币交易',
                description: '探索我们的加密货币模拟交易功能',
                action: 'explore_crypto'
            });
        }
    }

    /**
     * 获取注册进度报告
     * @returns {object} 进度报告
     */
    getProgressReport() {
        return {
            userId: this.userId,
            currentStep: this.currentStep,
            completionPercentage: this.completionPercentage,
            steps: this.steps,
            startedAt: this.startedAt,
            lastUpdatedAt: this.lastUpdatedAt,
            timeSpent: this.calculateTimeSpent(),
            guidanceTips: this.guidanceTips,
            personalizedSuggestions: this.personalizedSuggestions,
            abandonmentRisk: this.abandonmentRisk,
            estimatedCompletion: this.estimateCompletionTime()
        };
    }

    /**
     * 计算各步骤耗时
     * @returns {object} 时间统计
     */
    calculateTimeSpent() {
        const result = {};
        
        for (const [step, timeData] of Object.entries(this.timeSpentPerStep)) {
            if (timeData.completed) {
                result[step] = timeData.completed - timeData.started;
            }
        }
        
        return result;
    }

    /**
     * 预估完成时间
     * @returns {Date} 预估完成时间
     */
    estimateCompletionTime() {
        if (this.currentStep === 'completed') {
            return this.lastUpdatedAt;
        }
        
        const averageStepTime = this.calculateAverageStepTime();
        const remainingSteps = this.getRemainingStepsCount();
        
        const estimatedTime = new Date(this.lastUpdatedAt);
        estimatedTime.setMinutes(estimatedTime.getMinutes() + (averageStepTime * remainingSteps));
        
        return estimatedTime;
    }

    /**
     * 计算平均步骤耗时（分钟）
     * @returns {number} 平均耗时
     */
    calculateAverageStepTime() {
        const times = Object.values(this.calculateTimeSpent());
        if (times.length === 0) return 30; // 默认30分钟
        
        const averageMs = times.reduce((sum, time) => sum + time, 0) / times.length;
        return Math.round(averageMs / (1000 * 60)); // 转换为分钟
    }

    /**
     * 获取剩余步骤数量
     * @returns {number} 剩余步骤数
     */
    getRemainingStepsCount() {
        return Object.values(this.steps).filter(completed => !completed).length;
    }

    /**
     * 检查是否完成注册
     * @returns {boolean} 是否完成
     */
    isCompleted() {
        return this.currentStep === 'completed';
    }

    /**
     * 获取注册漏斗分析数据
     * @returns {object} 漏斗数据
     */
    getFunnelAnalysis() {
        return {
            registrationSource: this.registrationSource,
            referralCode: this.referralCode,
            marketingCampaign: this.marketingCampaign,
            completionRate: this.completionPercentage,
            timeToComplete: this.isCompleted() ? 
                (this.lastUpdatedAt - this.startedAt) : null,
            dropOffPoints: this.identifyDropOffPoints(),
            conversionPotential: this.assessConversionPotential()
        };
    }

    /**
     * 识别流失点
     * @returns {array} 流失点分析
     */
    identifyDropOffPoints() {
        const dropOffs = [];
        const stepOrder = ['accountCreated', 'emailVerified', 'profileCompleted', 'tradingSetup', 'firstLogin'];
        
        for (let i = 0; i < stepOrder.length - 1; i++) {
            const currentStep = stepOrder[i];
            const nextStep = stepOrder[i + 1];
            
            if (this.steps[currentStep] && !this.steps[nextStep]) {
                dropOffs.push({
                    fromStep: currentStep,
                    toStep: nextStep,
                    riskLevel: this.calculateStepRisk(nextStep)
                });
            }
        }
        
        return dropOffs;
    }

    /**
     * 计算步骤风险等级
     * @param {string} step 步骤名称
     * @returns {string} 风险等级
     */
    calculateStepRisk(step) {
        const riskFactors = {
            emailVerified: 'medium',    // 邮箱验证容易忘记
            tradingSetup: 'high',       // 交易设置可能复杂
            tutorialCompleted: 'low'    // 新手引导相对简单
        };
        
        return riskFactors[step] || 'low';
    }

    /**
     * 评估转化潜力
     * @returns {string} 转化潜力等级
     */
    assessConversionPotential() {
        if (this.completionPercentage >= 80) return 'high';
        if (this.completionPercentage >= 50) return 'medium';
        return 'low';
    }
}

module.exports = UserRegistrationFlow;