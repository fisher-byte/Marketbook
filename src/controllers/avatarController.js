/**
 * 头像上传控制器
 * 负责用户头像的上传、验证和管理
 */

const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

class AvatarController {
    constructor() {
        this.uploadDir = path.join(__dirname, '../uploads/avatars');
        this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.maxFileSize = 2 * 1024 * 1024; // 2MB
        
        // 确保上传目录存在
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    /**
     * 上传用户头像
     * @param {object} req - 请求对象
     * @param {object} res - 响应对象
     */
    async uploadAvatar(req, res) {
        try {
            // 验证请求数据
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: '数据验证失败',
                    errors: errors.array()
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: '请选择要上传的头像文件'
                });
            }

            // 验证文件类型
            if (!this.allowedMimeTypes.includes(req.file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: '不支持的文件格式，仅支持 JPEG、PNG、GIF、WebP 格式'
                });
            }

            // 验证文件大小
            if (req.file.size > this.maxFileSize) {
                return res.status(400).json({
                    success: false,
                    message: '文件大小超过限制（最大2MB）'
                });
            }

            // 生成唯一的文件名
            const userId = req.user.id || req.body.userId;
            const fileExtension = path.extname(req.file.originalname);
            const fileName = `avatar_${userId}_${Date.now()}${fileExtension}`;
            const filePath = path.join(this.uploadDir, fileName);

            // 移动文件到上传目录
            fs.renameSync(req.file.path, filePath);

            // 更新用户头像信息
            const UserProfile = require('./UserProfile');
            const profile = new UserProfile();
            const updateResult = await profile.updateAvatar(userId, fileName);

            if (updateResult.success) {
                res.json({
                    success: true,
                    message: '头像上传成功',
                    data: {
                        avatarUrl: `/uploads/avatars/${fileName}`,
                        fileName: fileName
                    }
                });
            } else {
                // 如果数据库更新失败，删除已上传的文件
                fs.unlinkSync(filePath);
                res.status(500).json({
                    success: false,
                    message: '头像更新失败'
                });
            }

        } catch (error) {
            console.error('头像上传错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误'
            });
        }
    }

    /**
     * 删除用户头像
     * @param {object} req - 请求对象
     * @param {object} res - 响应对象
     */
    async deleteAvatar(req, res) {
        try {
            const userId = req.user.id || req.body.userId;
            const UserProfile = require('./UserProfile');
            const profile = new UserProfile();
            
            const userProfile = await profile.getProfile(userId);
            
            if (userProfile && userProfile.avatar) {
                // 删除物理文件
                const filePath = path.join(this.uploadDir, userProfile.avatar);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                
                // 更新数据库
                await profile.updateAvatar(userId, null);
                
                res.json({
                    success: true,
                    message: '头像删除成功'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: '未找到用户头像'
                });
            }

        } catch (error) {
            console.error('头像删除错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误'
            });
        }
    }

    /**
     * 获取头像上传配置
     * @param {object} req - 请求对象
     * @param {object} res - 响应对象
     */
    getUploadConfig(req, res) {
        res.json({
            success: true,
            data: {
                allowedTypes: this.allowedMimeTypes,
                maxSize: this.maxFileSize,
                maxSizeMB: (this.maxFileSize / (1024 * 1024)).toFixed(1)
            }
        });
    }
}

module.exports = AvatarController;