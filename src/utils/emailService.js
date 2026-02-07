/**
 * 邮件服务工具类
 * 负责发送验证邮件等邮件相关功能
 */

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.init();
    }

    /**
     * 初始化邮件传输器
     */
    init() {
        // 使用环境变量配置邮件服务
        const config = {
            host: process.env.SMTP_HOST || 'smtp.qq.com',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        };

        if (config.auth.user && config.auth.pass) {
            this.transporter = nodemailer.createTransport(config);
        } else {
            console.warn('邮件服务未配置，将使用模拟模式');
        }
    }

    /**
     * 发送验证邮件
     * @param {string} to 收件人邮箱
     * @param {string} token 验证令牌
     * @param {string} username 用户名
     * @returns {Promise<boolean>} 是否发送成功
     */
    async sendVerificationEmail(to, token, username) {
        if (!this.transporter) {
            console.log(`[模拟邮件] 发送验证邮件到 ${to}, 令牌: ${token}`);
            return true;
        }

        try {
            const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
            
            const mailOptions = {
                from: `"MarketBook" <${process.env.SMTP_USER}>`,
                to: to,
                subject: 'MarketBook - 邮箱验证',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">欢迎加入 MarketBook！</h2>
                        <p>亲爱的 ${username}，</p>
                        <p>感谢您注册 MarketBook 交易论坛平台。请点击下面的链接验证您的邮箱地址：</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${verificationUrl}" 
                               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                验证邮箱地址
                            </a>
                        </p>
                        <p>如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
                        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
                        <p>此链接将在24小时内有效。</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px;">
                            如果您没有注册 MarketBook，请忽略此邮件。<br>
                            MarketBook 团队
                        </p>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`验证邮件已发送到 ${to}, 消息ID: ${result.messageId}`);
            return true;
        } catch (error) {
            console.error('发送验证邮件失败:', error);
            return false;
        }
    }

    /**
     * 发送密码重置邮件
     * @param {string} to 收件人邮箱
     * @param {string} token 重置令牌
     * @param {string} username 用户名
     * @returns {Promise<boolean>} 是否发送成功
     */
    async sendPasswordResetEmail(to, token, username) {
        if (!this.transporter) {
            console.log(`[模拟邮件] 发送密码重置邮件到 ${to}, 令牌: ${token}`);
            return true;
        }

        try {
            const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
            
            const mailOptions = {
                from: `"MarketBook" <${process.env.SMTP_USER}>`,
                to: to,
                subject: 'MarketBook - 密码重置',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #dc2626;">密码重置请求</h2>
                        <p>亲爱的 ${username}，</p>
                        <p>我们收到了您重置密码的请求。请点击下面的链接设置新密码：</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                重置密码
                            </a>
                        </p>
                        <p>如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
                        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                        <p>此链接将在1小时内有效。</p>
                        <p style="color: #999; font-size: 12px;">
                            如果您没有请求重置密码，请忽略此邮件。<br>
                            MarketBook 团队
                        </p>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`密码重置邮件已发送到 ${to}, 消息ID: ${result.messageId}`);
            return true;
        } catch (error) {
            console.error('发送密码重置邮件失败:', error);
            return false;
        }
    }

    /**
     * 测试邮件服务连接
     * @returns {Promise<boolean>} 连接是否正常
     */
    async testConnection() {
        if (!this.transporter) {
            console.log('邮件服务使用模拟模式');
            return true;
        }

        try {
            await this.transporter.verify();
            console.log('邮件服务连接正常');
            return true;
        } catch (error) {
            console.error('邮件服务连接失败:', error);
            return false;
        }
    }
}

module.exports = new EmailService();