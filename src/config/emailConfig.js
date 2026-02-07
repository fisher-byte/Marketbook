/**
 * 邮箱配置
 * 配置SMTP服务器和邮件模板
 */

const emailConfig = {
    // SMTP服务器配置
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.qq.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        }
    },
    
    // 发件人信息
    from: {
        name: 'MarketBook 交易论坛',
        address: process.env.SMTP_USER || 'noreply@marketbook.com'
    },
    
    // 邮件模板
    templates: {
        verification: {
            subject: 'MarketBook - 邮箱验证',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>邮箱验证</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>MarketBook</h1>
                            <p>AI驱动的交易论坛平台</p>
                        </div>
                        <div class="content">
                            <h2>邮箱验证</h2>
                            <p>您好，感谢您注册MarketBook账户！</p>
                            <p>请点击下面的按钮验证您的邮箱地址：</p>
                            <p style="text-align: center;">
                                <a href="{{verificationUrl}}" class="button">验证邮箱</a>
                            </p>
                            <p>如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
                            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;">
                                {{verificationUrl}}
                            </p>
                            <p><strong>注意：</strong>此链接将在24小时后失效。</p>
                        </div>
                        <div class="footer">
                            <p>如果您没有注册MarketBook账户，请忽略此邮件。</p>
                            <p>&copy; 2025 MarketBook. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        }
    },
    
    // 验证链接配置
    verification: {
        baseUrl: process.env.BASE_URL || 'http://localhost:3000',
        path: '/api/email/verify',
        expiresIn: 24 * 60 * 60 * 1000 // 24小时
    }
};

module.exports = emailConfig;