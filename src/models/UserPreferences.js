/**
 * 用户偏好设置模型 - MarketBook 平台
 * 负责管理用户的个性化设置和偏好配置
 * 
 * @version 1.0.0
 * @author MarketBook Team
 * @description 用户偏好设置管理，支持个性化配置
 */

class UserPreferences {
    constructor(preferencesData = {}) {
        // 基础偏好设置
        this.userId = preferencesData.userId || null;
        
        // 界面设置
        this.theme = preferencesData.theme || 'light'; // light/dark/auto
        this.language = preferencesData.language || 'zh-CN';
        this.timezone = preferencesData.timezone || 'Asia/Shanghai';
        
        // 通知设置
        this.emailNotifications = preferencesData.emailNotifications !== undefined ? preferencesData.emailNotifications : true;
        this.pushNotifications = preferencesData.pushNotifications !== undefined ? preferencesData.pushNotifications : true;
        this.smsNotifications = preferencesData.smsNotifications !== undefined ? preferencesData.smsNotifications : false;
        
        // 交易相关设置
        this.defaultCurrency = preferencesData.defaultCurrency || 'CNY';
        this.riskTolerance = preferencesData.riskTolerance || 'medium'; // low/medium/high
        this.tradingView = preferencesData.tradingView || 'advanced'; // basic/advanced/professional
        
        // 隐私设置
        this.profileVisibility = preferencesData.profileVisibility || 'public'; // public/friends/private
        this.activityVisibility = preferencesData.activityVisibility || 'public'; // public/friends/private
        this.showOnlineStatus = preferencesData.showOnlineStatus !== undefined ? preferencesData.showOnlineStatus : true;
        
        // 时间戳
        this.createdAt = preferencesData.createdAt || new Date();
        this.updatedAt = preferencesData.updatedAt || new Date();
    }

    // ==================== 验证方法 ====================

    /**
     * 验证主题设置
     * @returns {boolean} 是否有效
     */
    validateTheme() {
        const validThemes = ['light', 'dark', 'auto'];
        return validThemes.includes(this.theme);
    }

    /**
     * 验证语言设置
     * @returns {boolean} 是否有效
     */
    validateLanguage() {
        const validLanguages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'];
        return validLanguages.includes(this.language);
    }

    /**
     * 验证风险承受能力设置
     * @returns {boolean} 是否有效
     */
    validateRiskTolerance() {
        const validTolerances = ['low', 'medium', 'high'];
        return validTolerances.includes(this.riskTolerance);
    }

    /**
     * 验证交易视图设置
     * @returns {boolean} 是否有效
     */
    validateTradingView() {
        const validViews = ['basic', 'advanced', 'professional'];
        return validViews.includes(this.tradingView);
    }

    /**
     * 验证隐私设置
     * @returns {boolean} 是否有效
     */
    validatePrivacySettings() {
        const validVisibilities = ['public', 'friends', 'private'];
        return validVisibilities.includes(this.profileVisibility) && 
               validVisibilities.includes(this.activityVisibility);
    }

    /**
     * 完整验证偏好设置
     * @returns {object} 验证结果 {isValid: boolean, errors: string[]}
     */
    validateAll() {
        const errors = [];
        
        if (!this.validateTheme()) {
            errors.push('主题设置无效');
        }
        
        if (!this.validateLanguage()) {
            errors.push('语言设置无效');
        }
        
        if (!this.validateRiskTolerance()) {
            errors.push('风险承受能力设置无效');
        }
        
        if (!this.validateTradingView()) {
            errors.push('交易视图设置无效');
        }
        
        if (!this.validatePrivacySettings()) {
            errors.push('隐私设置无效');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // ==================== 业务逻辑方法 ====================

    /**
     * 更新偏好设置
     * @param {object} updates 更新数据
     */
    update(updates) {
        const allowedFields = [
            'theme', 'language', 'timezone',
            'emailNotifications', 'pushNotifications', 'smsNotifications',
            'defaultCurrency', 'riskTolerance', 'tradingView',
            'profileVisibility', 'activityVisibility', 'showOnlineStatus'
        ];
        
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                this[key] = updates[key];
            }
        });
        
        this.updatedAt = new Date();
    }

    /**
     * 重置为默认设置
     */
    resetToDefaults() {
        this.theme = 'light';
        this.language = 'zh-CN';
        this.timezone = 'Asia/Shanghai';
        this.emailNotifications = true;
        this.pushNotifications = true;
        this.smsNotifications = false;
        this.defaultCurrency = 'CNY';
        this.riskTolerance = 'medium';
        this.tradingView = 'advanced';
        this.profileVisibility = 'public';
        this.activityVisibility = 'public';
        this.showOnlineStatus = true;
        this.updatedAt = new Date();
    }

    /**
     * 获取偏好设置摘要
     * @returns {object} 设置摘要
     */
    getSummary() {
        return {
            theme: this.theme,
            language: this.language,
            notifications: {
                email: this.emailNotifications,
                push: this.pushNotifications,
                sms: this.smsNotifications
            },
            trading: {
                currency: this.defaultCurrency,
                riskTolerance: this.riskTolerance,
                view: this.tradingView
            },
            privacy: {
                profile: this.profileVisibility,
                activity: this.activityVisibility,
                onlineStatus: this.showOnlineStatus
            }
        };
    }

    /**
     * 检查是否为高级用户设置
     * @returns {boolean} 是否为高级设置
     */
    isAdvancedUser() {
        return this.tradingView === 'professional' && this.riskTolerance === 'high';
    }

    /**
     * 检查是否启用夜间模式
     * @returns {boolean} 是否启用夜间模式
     */
    isDarkMode() {
        if (this.theme === 'auto') {
            // 根据时间自动判断（简化版）
            const hour = new Date().getHours();
            return hour >= 18 || hour < 6;
        }
        return this.theme === 'dark';
    }

    /**
     * 获取通知设置状态
     * @returns {object} 通知状态
     */
    getNotificationStatus() {
        return {
            hasAnyNotifications: this.emailNotifications || this.pushNotifications || this.smsNotifications,
            primaryMethod: this.pushNotifications ? 'push' : 
                          this.emailNotifications ? 'email' : 'sms'
        };
    }
}

module.exports = UserPreferences;