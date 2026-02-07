/**
 * 用户资料模型 - MarketBook项目
 * 扩展用户基础信息，包含头像、个性化设置等
 * 
 * 功能特性：
 * - 用户资料数据验证
 * - 头像管理（支持默认头像生成）
 * - 社交链接管理
 * - 个性化偏好设置
 * 
 * @version 1.1.0
 * @author MarketBook Team
 */

class UserProfile {
    constructor(profileData) {
        // 基础信息
        this.userId = profileData.userId || null;
        this.displayName = profileData.displayName || '';
        this.avatar = profileData.avatar || null;
        this.bio = profileData.bio || '';
        this.location = profileData.location || '';
        this.website = profileData.website || '';
        
        // 社交链接配置
        this.socialLinks = profileData.socialLinks || {
            twitter: '',
            linkedin: '',
            github: '',
            wechat: ''
        };
        
        // 用户偏好设置
        this.preferences = profileData.preferences || {
            theme: 'light',           // 主题：light/dark/auto
            notifications: true,      // 通知开关
            language: 'zh-CN',        // 语言偏好
            emailUpdates: false,      // 邮件更新
            privacyLevel: 'public'    // 隐私级别：public/friends/private
        };
        
        // 时间戳
        this.createdAt = profileData.createdAt || new Date();
        this.updatedAt = profileData.updatedAt || new Date();
    }

    /**
     * 验证头像URL格式
     * 支持data URL、相对路径和绝对URL
     * 
     * @returns {boolean} 是否有效
     */
    validateAvatar() {
        if (!this.avatar) return true; // 头像为可选字段
        
        const avatarRegex = /^(data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+|\/.*|https?:\/\/.*)$/;
        return avatarRegex.test(this.avatar);
    }

    /**
     * 验证网站URL格式
     * 
     * @returns {boolean} 是否有效
     */
    validateWebsite() {
        if (!this.website) return true; // 网站为可选字段
        
        const websiteRegex = /^https?:\/\/[\w\-\.]+\.[a-z]{2,}(\/.*)?$/i;
        return websiteRegex.test(this.website);
    }

    /**
     * 验证显示名称格式
     * 支持中文、字母、数字、空格，长度1-30位
     * 
     * @returns {boolean} 是否有效
     */
    validateDisplayName() {
        if (!this.displayName) return true; // 显示名称为可选字段
        
        const displayNameRegex = /^[\w\s\u4e00-\u9fa5]{1,30}$/;
        return displayNameRegex.test(this.displayName);
    }

    /**
     * 验证社交链接格式
     * 
     * @returns {boolean} 是否有效
     */
    validateSocialLinks() {
        const socialPlatforms = ['twitter', 'linkedin', 'github', 'wechat'];
        
        for (const platform of socialPlatforms) {
            const link = this.socialLinks[platform];
            if (link && !this.isValidSocialLink(platform, link)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * 验证特定社交平台链接
     * 
     * @param {string} platform 社交平台
     * @param {string} link 链接地址
     * @returns {boolean} 是否有效
     */
    isValidSocialLink(platform, link) {
        const validators = {
            twitter: /^https?:\/\/(www\.)?twitter\.com\/[\w]+$/,
            linkedin: /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w\-]+$/,
            github: /^https?:\/\/(www\.)?github\.com\/[\w\-]+$/,
            wechat: /^[\w\-]+$/ // 微信号格式
        };
        
        return validators[platform] ? validators[platform].test(link) : true;
    }

    /**
     * 完整验证资料数据
     * 
     * @returns {object} 验证结果 {isValid: boolean, errors: string[]}
     */
    validateAll() {
        const errors = [];
        
        // 必填字段验证
        if (!this.userId) {
            errors.push('用户ID不能为空');
        }
        
        // 可选字段验证
        if (this.displayName && !this.validateDisplayName()) {
            errors.push('显示名称格式不正确（1-30位，支持中文、字母、数字、空格）');
        }
        
        if (this.avatar && !this.validateAvatar()) {
            errors.push('头像格式不正确，支持PNG、JPEG、JPG、GIF、WebP格式');
        }
        
        if (this.website && !this.validateWebsite()) {
            errors.push('网站URL格式不正确');
        }
        
        if (!this.validateSocialLinks()) {
            errors.push('社交链接格式不正确');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 获取安全的资料信息（不包含敏感数据）
     * 
     * @returns {object} 安全资料信息
     */
    getSafeInfo() {
        return {
            userId: this.userId,
            displayName: this.displayName,
            avatar: this.avatar,
            bio: this.bio,
            location: this.location,
            website: this.website,
            socialLinks: {...this.socialLinks},
            preferences: {...this.preferences},
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * 更新头像URL
     * 
     * @param {string} avatarUrl 新的头像URL
     * @returns {boolean} 更新是否成功
     */
    updateAvatar(avatarUrl) {
        if (this.validateAvatar(avatarUrl)) {
            this.avatar = avatarUrl;
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    /**
     * 更新偏好设置
     * 
     * @param {object} newPreferences 新的偏好设置
     * @returns {boolean} 更新是否成功
     */
    updatePreferences(newPreferences) {
        const validPreferences = ['theme', 'notifications', 'language', 'emailUpdates', 'privacyLevel'];
        
        for (const key in newPreferences) {
            if (validPreferences.includes(key)) {
                this.preferences[key] = newPreferences[key];
            }
        }
        
        this.updatedAt = new Date();
        return true;
    }

    /**
     * 生成默认头像URL（基于用户名）
     * 
     * @param {string} username 用户名
     * @returns {string} 默认头像URL（SVG格式）
     */
    static generateDefaultAvatar(username) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
        const colorIndex = username.length % colors.length;
        const initials = username.substring(0, 2).toUpperCase();
        
        const svgContent = `
            <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" fill="${colors[colorIndex]}"/>
                <text x="50" y="55" font-family="Arial" font-size="24" fill="white" text-anchor="middle">${initials}</text>
            </svg>
        `;
        
        return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    }

    /**
     * 获取资料统计信息
     * 
     * @returns {object} 统计信息
     */
    getStats() {
        return {
            completeness: this.calculateCompleteness(),
            lastUpdated: this.updatedAt,
            hasAvatar: !!this.avatar,
            hasBio: !!this.bio,
            hasSocialLinks: Object.values(this.socialLinks).some(link => !!link),
            profileAgeDays: Math.floor((new Date() - new Date(this.createdAt)) / (1000 * 60 * 60 * 24)),
            updateFrequency: this.getUpdateFrequency(),
            socialConnectivity: this.calculateSocialConnectivity(),
            // 新增性能指标
            cacheStatus: this.getCacheStatus(),
            loadTimeEstimate: this.estimateLoadTime(),
            optimizationLevel: this.getOptimizationLevel()
        };
    }

    /**
     * 计算资料更新频率
     * 
     * @returns {string} 更新频率描述
     */
    getUpdateFrequency() {
        const updateDays = Math.floor((new Date() - new Date(this.updatedAt)) / (1000 * 60 * 60 * 24));
        
        if (updateDays <= 1) return 'very_frequent';
        if (updateDays <= 7) return 'frequent';
        if (updateDays <= 30) return 'occasional';
        return 'rare';
    }

    /**
     * 计算社交连接度
     * 
     * @returns {number} 社交连接度分数（0-100）
     */
    calculateSocialConnectivity() {
        let score = 0;
        const socialPlatforms = ['twitter', 'linkedin', 'github', 'wechat'];
        
        // 每个有效的社交链接加25分
        socialPlatforms.forEach(platform => {
            if (this.socialLinks[platform] && this.socialLinks[platform].trim()) {
                score += 25;
            }
        });
        
        return score;
    }

    /**
     * 检查资料是否包含联系方式
     * 
     * @returns {boolean} 是否包含联系方式
     */
    hasContactInfo() {
        return this.website || 
               Object.values(this.socialLinks).some(link => link && link.trim()) ||
               (this.bio && this.bio.trim());
    }

    /**
     * 获取资料质量评级
     * 
     * @returns {string} 质量评级（poor/fair/good/excellent）
     */
    getQualityRating() {
        const completeness = this.calculateCompleteness();
        
        if (completeness >= 80) return 'excellent';
        if (completeness >= 60) return 'good';
        if (completeness >= 40) return 'fair';
        return 'poor';
    }

    /**
     * 计算资料完整度
     * 优化：增加权重分配，重要字段权重更高
     * 
     * @returns {number} 完整度百分比（0-100）
     */
    calculateCompleteness() {
        const fieldWeights = {
            displayName: 0.3,  // 显示名称最重要
            avatar: 0.25,     // 头像次重要
            bio: 0.2,         // 个人简介
            location: 0.15,   // 地理位置
            website: 0.1      // 个人网站
        };
        
        let completeness = 0;
        
        if (this.displayName && this.displayName.trim()) {
            completeness += fieldWeights.displayName;
        }
        if (this.avatar) {
            completeness += fieldWeights.avatar;
        }
        if (this.bio && this.bio.trim()) {
            completeness += fieldWeights.bio;
        }
        if (this.location && this.location.trim()) {
            completeness += fieldWeights.location;
        }
        if (this.website && this.website.trim()) {
            completeness += fieldWeights.website;
        }
        
        return Math.round(completeness * 100);
    }
}

module.exports = UserProfile;