/**
 * 邮箱验证模型
 * 管理用户邮箱验证流程
 */

class EmailVerification {
    constructor(verificationData) {
        this.id = verificationData.id || null;
        this.userId = verificationData.userId || null;
        this.email = verificationData.email || '';
        this.token = verificationData.token || this.generateToken();
        this.expiresAt = verificationData.expiresAt || this.generateExpiryDate();
        this.isVerified = verificationData.isVerified || false;
        this.createdAt = verificationData.createdAt || new Date();
        this.verifiedAt = verificationData.verifiedAt || null;
    }

    /**
     * 生成验证令牌
     * @returns {string} 随机令牌
     */
    generateToken() {
        return require('crypto').randomBytes(32).toString('hex');
    }

    /**
     * 生成过期时间（24小时后）
     * @returns {Date} 过期时间
     */
    generateExpiryDate() {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24);
        return expiryDate;
    }

    /**
     * 检查令牌是否过期
     * @returns {boolean} 是否过期
     */
    isExpired() {
        return new Date() > this.expiresAt;
    }

    /**
     * 验证令牌
     * @param {string} token 要验证的令牌
     * @returns {boolean} 是否验证成功
     */
    verify(token) {
        if (this.isExpired()) {
            return false;
        }
        
        if (this.token === token) {
            this.isVerified = true;
            this.verifiedAt = new Date();
            return true;
        }
        
        return false;
    }

    /**
     * 重新生成验证令牌
     */
    regenerateToken() {
        this.token = this.generateToken();
        this.expiresAt = this.generateExpiryDate();
        this.isVerified = false;
        this.verifiedAt = null;
        this.createdAt = new Date();
    }

    /**
     * 验证数据完整性
     * @returns {object} 验证结果
     */
    validate() {
        const errors = [];
        
        if (!this.userId) {
            errors.push('用户ID不能为空');
        }
        
        if (!this.email) {
            errors.push('邮箱不能为空');
        }
        
        if (!this.token) {
            errors.push('验证令牌不能为空');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 获取验证信息
     * @returns {object} 验证信息
     */
    getInfo() {
        return {
            id: this.id,
            userId: this.userId,
            email: this.email,
            isVerified: this.isVerified,
            expiresAt: this.expiresAt,
            createdAt: this.createdAt,
            verifiedAt: this.verifiedAt,
            isExpired: this.isExpired()
        };
    }
}

module.exports = EmailVerification;