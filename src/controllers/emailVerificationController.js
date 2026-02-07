/**
 * 邮箱验证控制器
 * 处理邮箱验证码的发送和验证
 */

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const EmailVerification = require('../models/EmailVerification');
const User = require('../models/User');

class EmailVerificationController {
    constructor() {
        // 配置邮件发送器（实际项目中需要配置SMTP）
        this.transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.example.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || 'user@example.com',
                pass: process.env.SMTP_PASS || 'password'
            }
        });
    }

    /**
     * 生成邮箱验证码
     * @param {string} email 邮箱地址
     * @returns {Promise<object>} 验证码信息
     */
    async generateVerificationCode(email) {
        try {
            // 生成6位数字验证码
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟过期
            
            // 创建或更新验证记录
            const verification = new EmailVerification({
                email: email,
                code: code,
                expiresAt: expiresAt,
                attempts: 0
            });
            
            await verification.save();
            
            return {
                success: true,
                code: code,
                expiresAt: expiresAt
            };
        } catch (error) {
            console.error('生成验证码失败:', error);
            return {
                success: false,
                error: '生成验证码失败'
            };
        }
    }

    /**
     * 发送邮箱验证码
     * @param {string} email 邮箱地址
     * @param {string} username 用户名
     * @returns {Promise<object>} 发送结果
     */
    async sendVerificationCode(email, username) {
        try {
            const result = await this.generateVerificationCode(email);
            if (!result.success) {
                return result;
            }

            // 邮件内容
            const mailOptions = {
                from: process.env.SMTP_FROM || 'noreply@marketbook.com',
                to: email,
                subject: 'MarketBook - 邮箱验证',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">欢迎加入 MarketBook！</h2>
                        <p>亲爱的 ${username}，</p>
                        <p>感谢您注册 MarketBook 交易论坛平台。请使用以下验证码完成邮箱验证：</p>
                        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #007bff; margin: 0; font-size: 32px;">${result.code}</h1>
                        </div>
                        <p>验证码将在 <strong>10分钟</strong> 后过期。</p>
                        <p>如果这不是您发起的请求，请忽略此邮件。</p>
                        <hr style="margin: 30px 0;">
                        <p style="color: #666; font-size: 12px;">
                            MarketBook 团队<br>
                            此邮件为系统自动发送，请勿回复
                        </p>
                    </div>
                `
            };

            // 发送邮件（开发环境可以模拟发送）
            if (process.env.NODE_ENV === 'production') {
                await this.transporter.sendMail(mailOptions);
            } else {
                console.log('开发环境 - 验证码邮件内容:');
                console.log(`收件人: ${email}`);
                console.log(`验证码: ${result.code}`);
                console.log('实际生产环境会发送真实邮件');
            }

            return {
                success: true,
                message: '验证码已发送到您的邮箱',
                expiresAt: result.expiresAt
            };
        } catch (error) {
            console.error('发送验证码失败:', error);
            return {
                success: false,
                error: '发送验证码失败，请稍后重试'
            };
        }
    }

    /**
     * 验证邮箱验证码
     * @param {string} email 邮箱地址
     * @param {string} code 验证码
     * @returns {Promise<object>} 验证结果
     */
    async verifyCode(email, code) {
        try {
            const verification = await EmailVerification.findOne({
                email: email,
                code: code,
                expiresAt: { $gt: new Date() },
                verified: false
            });

            if (!verification) {
                return {
                    success: false,
                    error: '验证码无效或已过期'
                };
            }

            // 检查尝试次数
            if (verification.attempts >= 5) {
                return {
                    success: false,
                    error: '验证尝试次数过多，请重新获取验证码'
                };
            }

            // 增加尝试次数
            verification.attempts += 1;
            await verification.save();

            // 验证成功
            if (verification.code === code) {
                verification.verified = true;
                verification.verifiedAt = new Date();
                await verification.save();

                // 更新用户邮箱验证状态
                await User.findOneAndUpdate(
                    { email: email },
                    { emailVerified: true }
                );

                return {
                    success: true,
                    message: '邮箱验证成功'
                };
            }

            return {
                success: false,
                error: '验证码错误'
            };
        } catch (error) {
            console.error('验证码验证失败:', error);
            return {
                success: false,
                error: '验证失败，请稍后重试'
            };
        }
    }

    /**
     * 重新发送验证码
     * @param {string} email 邮箱地址
     * @param {string} username 用户名
     * @returns {Promise<object>} 发送结果
     */
    async resendVerificationCode(email, username) {
        try {
            // 检查是否在冷却期内（1分钟内不能重复发送）
            const recentVerification = await EmailVerification.findOne({
                email: email,
                createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
            });

            if (recentVerification) {
                return {
                    success: false,
                    error: '请等待1分钟后再重新发送验证码'
                };
            }

            return await this.sendVerificationCode(email, username);
        } catch (error) {
            console.error('重新发送验证码失败:', error);
            return {
                success: false,
                error: '重新发送验证码失败'
            };
        }
    }

    /**
     * 清理过期的验证记录
     */
    async cleanupExpiredVerifications() {
        try {
            const result = await EmailVerification.deleteMany({
                expiresAt: { $lt: new Date() }
            });
            
            console.log(`清理了 ${result.deletedCount} 条过期验证记录`);
            return result.deletedCount;
        } catch (error) {
            console.error('清理过期验证记录失败:', error);
            return 0;
        }
    }
}

module.exports = EmailVerificationController;